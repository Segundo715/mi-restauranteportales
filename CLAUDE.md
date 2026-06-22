@AGENTS.md

# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja en este repositorio.

## Comandos

```bash
npm run dev      # Servidor de desarrollo (next dev --webpack)
npm run build    # Build de producción
npm run lint     # Ejecutar ESLint
npx tsc --noEmit # Verificar tipos sin emitir archivos
```

No hay suite de pruebas configurada. Siempre ejecutar `npx tsc --noEmit` para verificar — los diagnósticos del IDE son frecuentemente obsoletos e incorrectos.

## Qué hace esta app

Plataforma SaaS para restaurantes y cafeterías ("Chubis", con marca blanca por tenant). Tres audiencias:

- **Clientes** (público): menú digital (`/menu`), reseñas (`/review`, `/resena`), recetario (`/recetas`, `/resetas`), estilos de tarjeta de lealtad (`/card`, `/card/premium`, `/card/2x1`, `/card/descuento`, `/card/wallet`, `/card/usuario`), registro (`/registro`, `/loyalty`), activación (`/activate`). Señalización TV en `/tv`.
- **Empleados** (`/employee/*`): sellar tarjetas de lealtad, gestionar pedidos, menú, recetas, clientes. Login en `/employee/login`.
- **RESTA3** (`/resta3/*`): panel secundario del personal con marca propia (logo/acento/nombre guardados como `resta3_logo`, `resta3_accent`, `resta3_name` en la tabla `settings`). Login en `/resta3/login`.
- **Admins** (`/admin/*`): dashboard completo — analíticas, CRM, ventas, menú, recetas, TV, reservaciones y plano de mesas, lealtad/sellado, reseñas, automatización, contenido, producción, reportes, configuración (`/admin/configuracion`), editor de navegación del cliente (`/admin/navegador`). Login en `/admin/login`.

`app/page.tsx` redirige `/` → `/menu`.

## Arquitectura

**Stack:** Next.js 16 (App Router, webpack) · React 19 · Tailwind CSS 4 · TypeScript · Supabase · Konva/react-konva (canvas) · lottie-react

> ⚠️ Esta es Next.js 16 con cambios que rompen compatibilidad con versiones anteriores. Ver `AGENTS.md` — leer `node_modules/next/dist/docs/` antes de escribir código del framework.

### Capa de datos — Supabase

Toda la persistencia pasa por Supabase (`lib/supabase.ts`, cliente de clave anon único). Cada dominio tiene su propio módulo `lib/*Db.ts` que posee una tabla y expone funciones async que devuelven tipos camelCase mediante un mapper `toX(row)` (columnas de BD en snake_case):

| Módulo | Tabla | Notas |
|---|---|---|
| `lib/db.ts` | `customers` | Clientes de lealtad + cuentas de cliente (hash SHA-256). Máquina de estados de activación. |
| `lib/loyaltyDb.ts` | `loyalty_cards` | Flag `active`, `expires_at` rotativo de 90 días. `findOrCreate` por nombre + teléfono normalizado. |
| `lib/menuDb.ts` | `menu_items` | CRUD, contador `likes`, flag `available`. |
| `lib/ordersDb.ts` | `orders` | `status`: pending → preparing → ready → delivered. |
| `lib/recipeDb.ts` | `recipes` | Cargado desde `data/recipes.json` vía `POST /api/recipes/seed`. |
| `lib/reviewDb.ts` | `reviews` | `bad = rating <= 3`, `published = rating >= 4`. Reseñas malas disparan email. |
| `lib/tvDb.ts` | `tv_slides` | `slide_order`, `active`, `is_offer`. |
| `lib/settingsDb.ts` | `settings` | Clave-valor genérico: `getSetting(key, fallback)` / `setSetting(key, value)` (upsert). |
| `lib/adminDb.ts` | `admins` | SHA-256(`ADMIN_SECRET:name:password`). |
| `lib/employeeDb.ts` | `employees` | SHA-256(`emp:ADMIN_SECRET:name:password`). |
| `lib/tablesDb.ts` | `tables` | Mesas del restaurante: `status` = `libre \| ocupada \| reservada \| limpieza`. |
| `lib/inventoryDb.ts` | `inventory` | `stock`, `minStock` (umbral de alerta), `unit`, `cost`. |

Estos módulos son **solo de servidor** — nunca importar desde componentes cliente. Los archivos `data/*.json` (excepto `recipes.json`) son obsoletos y no se usan en tiempo de ejecución.

**Subida de imágenes:** `app/api/{menu,tv,recipes,settings}/upload/route.ts` acepta multipart, sube al bucket `uploads/` de Supabase Storage (prefijado por dominio), devuelve URL pública. Las rutas de subida son **pass-through** — almacenan lo que reciben. La conversión a WebP ocurre **en el navegador** via `lib/uploadWebp.ts` antes de subir.

### Manejo de imágenes — WebP en el cliente

`lib/uploadWebp.ts` es una utilidad `'use client'` — importar solo desde componentes cliente, nunca desde rutas del servidor:

- `browserToWebp(file)` — convierte via Canvas API a calidad 0.82 (omite SVG/WebP)
- `uploadWebp(file, apiUrl, onSize?)` — convierte y luego sube; callback `onSize(bytesOriginal, bytesWebP)` para feedback en UI
- `fmtBytes(n)` — formatea bytes como B / KB / MB

`lib/imageWebp.ts` es ahora un pass-through (sin dependencia de sharp — los binarios nativos de sharp fallan en Vercel).

### Autenticación y sesiones

- **Admin/empleado/resta3:** `lib/auth.ts` emite un token HMAC sin estado `"<id>.<hmac(id)>"` firmado con `ADMIN_SECRET`, guardado en la cookie httpOnly `admin_session`. Las rutas API protegen escrituras con `verifySession(req.cookies.get('admin_session')?.value)`. Login/logout: `POST`/`DELETE /api/auth` (admin), `/api/employee/auth`, `/api/resta3/auth`.
- **Cuentas de clientes:** nombre + contraseña (`/api/customer-auth`), hash en `lib/db.ts`.

### Marca y configuración (tabla `settings`)

La marca es basada en datos, no hardcodeada. Los layouts de admin/empleado/resta3 leen la configuración **en el servidor** y la inyectan via `BrandProvider` + un script de init `data-admin-theme` para evitar parpadeo. Claves conocidas:

- `restaurant_name`, `profile_logo`, `sidebar_accent` — chrome del panel admin/empleado
- `resta3_logo`, `resta3_accent`, `resta3_name` — overrides de RESTA3 (si vacíos, usa los generales)
- `employee_logo`, `employee_accent` — overrides del panel de empleados
- `registro_titulo`, `registro_subtitulo` — texto de `/registro`
- `customer_nav` — JSON para tabs de `CustomerNav` (ver `normalizeNavConfig`)
- `reward_categories` — JSON para niveles de tarjeta de lealtad
- `recetario_color`, `recetario_logo` — marca del recetario

### Asistente de IA (`app/api/ai/chat/route.ts`)

Endpoint de chat en streaming respaldado por la API de Groq. Restricciones clave:

- **Debe usar Lambda de Node.js** — `export const maxDuration = 60`. Nunca usar `export const runtime = 'edge'`; Vercel no inyecta `GROQ_API_KEY` en los aislados V8 del Edge Runtime (causa 401).
- Modelos: `llama-3.1-8b-instant` (rol cliente, rápido) · `llama-3.3-70b-versatile` (todos los roles de personal/admin)
- `buildSystem(role, restaurantName, menuContext?)` obtiene datos en tiempo real de Supabase por rol (timeout de 2.5 s por llamada via `Promise.race`):

| Rol | Datos obtenidos |
|---|---|
| `customer` | Usa `menuContext` enviado por el cliente — sin llamadas a Supabase |
| `cook` | Pedidos + menú + recetas completas (paso a paso) |
| `staff` | Pedidos + menú + conteos de tarjetas de lealtad |
| `employee` | Pedidos + menú + recetas completas + tarjetas de lealtad |
| `resta3` | Mesas (conteos por estado) + pedidos + alertas de inventario + menú + ventas día/semana |
| `admin` | Pedidos + menú + reseñas (rating promedio, negativas) + tarjetas + alertas inventario + ventas |
| `recipe` | Recetas completas + menú |

**Componente `AIChat`** (`app/components/AIChat.tsx`):
- Tipo `AIRole`: `'cook' | 'staff' | 'customer' | 'admin' | 'recipe' | 'resta3' | 'employee'`
- `getRoleFromPath(path)` detecta el rol por URL: `/resta3/cocina` → `cook`, `/resta3` → `resta3`, `/employee` → `employee`, `/admin` → `admin`, `/reseta|/receta` → `recipe`, sino → `customer`
- Los roles `cook` y `employee` cargan automáticamente la lista de recetas como botones de acción rápida
- El rol `customer` envía `menuContext` (ya obtenido en el cliente) para evitar dobles llamadas a Supabase
- Entrada por voz via Web Speech API. Requiere HTTPS. Si `busy`, el texto capturado va al campo de entrada en lugar de enviarse de inmediato.
- Incluido en: `app/admin/layout.tsx`, `app/employee/layout.tsx`, páginas de resta3

### Flags de funcionalidades

`lib/features.ts` exporta `FEATURES` (clave → `{ enabled, label, emoji }`). `AdminNav` muestra en gris con badge "PRO" las funcionalidades desactivadas. `AdminNav` es reorganizable por arrastre (orden en localStorage `admin_nav_order`). La UI para activar/desactivar flags fue **eliminada de** `/admin/configuracion` — los flags solo se cambian en el código.

### Máquina de estados del cliente

```
loading → form → confirm → waiting → (enlace de activación enviado) → card
```
- `loyalty_pending_id` en localStorage = registrado, sin activar
- `loyalty_id` / `loyalty_card_id` = confirmado, activo

**Activación:** Cliente envía formulario → `POST /api/customers` → empleado envía `wa.me/...?text=.../activate?id=UUID` → cliente toca el enlace → confirmado.

### Rutas API (`app/api/`)

Ruta de colección (`GET`/`POST`) + ruta `[id]` (`GET`/`PATCH`/`DELETE`). `PATCH` despacha por campo `action`:
- `customers/[id]`: `confirm | stamp | redeem`
- `loyalty/[id]`: `stamp | redeem | activate | deactivate` (protegido con admin)
- `menu/[id]/like`: incremento público de `likes`
- `settings`: `GET ?key=` público; `POST` solo admin
- `recipes/seed`: llena desde `data/recipes.json` sin sobreescribir ingredientes/pasos existentes
- `ai/chat`: proxy Groq en streaming — ver sección de IA

### Códigos QR y escáner

- QR del negocio (`/admin`): codifica `window.location.origin`
- QR del cliente: codifica el UUID — el empleado escanea para sellar
- `QRScanner` importa dinámicamente `html5-qrcode` dentro de `useEffect` (no seguro en SSR). El `div#qr-reader` debe existir antes de `Html5Qrcode.start()`; el padre lo remonta vía bump de ref `scanKey`.
- `/activate` envuelve `useSearchParams()` en `<Suspense>` (requerido por App Router).

### Módulos solo cliente (Konva + localStorage)

Carpeta raíz `components/` (distinta de `app/components/`), importada via `@/components/...`.

- **Señalización TV** — editor `/admin/tv` + vista fullscreen `/admin/tv/pantalla/[id]`. Animaciones Lottie en `public/animations/`; registrar via `app/components/animations/registry.ts`. localStorage: `pantalla_dashboard_v1`.
- **Reservaciones** — `/admin/reservaciones` con pestañas: plano de mesas (react-konva, `floor_plan_v1`), panel de servicio, perfiles (`guest_profiles_v1`), turnos (`shift_plan_v1`), timeline, consumo.

**Regla Konva/SSR:** cargar el canvas con `next/dynamic(() => import('./FloorCanvas'), { ssr: false })` desde un componente `'use client'` — nunca importar react-konva desde un Server Component.

### Cabeceras de seguridad (`next.config.ts`)

- `poweredByHeader: false` — elimina `X-Powered-By`
- Todas las rutas: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Content-Security-Policy: frame-ancestors 'self'`, `Permissions-Policy: microphone=(self)`
- Páginas dinámicas: `Cache-Control: no-cache`
- `X-Frame-Options` **no se usa** — reemplazado por CSP `frame-ancestors`.

### Email

`lib/email.ts` usa nodemailer (Gmail). `createReview` con `rating <= 3` envía alerta. No hace nada si `GMAIL_USER`/`GMAIL_APP_PASSWORD` no están configurados.

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL` — **requerida**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **requerida**
- `ADMIN_SECRET` — secreto HMAC de sesión + hash de contraseña. Fallback a `'dev-secret'` (inseguro).
- `GROQ_API_KEY` — **requerida para el chat de IA**. Debe configurarse en Vercel → Settings → Environment Variables (no solo en `.env.local`).
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `REVIEW_EMAIL` — opcionales, alertas de reseñas negativas por email

`app/components/LoyaltyCard.tsx` tiene una constante `BUSINESS_WA` (número de WhatsApp, sin `+` ni espacios) que cambiar por despliegue.

## Restricciones importantes

- **Agregar un campo persistido** → actualizar el mapper `toX(row)`, los payloads de inserción/actualización y la `interface` en `lib/*Db.ts`.
- Tailwind CSS 4: `@import "tailwindcss"` en `globals.css`, sin `tailwind.config.js`. Tokens personalizados en `@theme inline {}`. Temas del admin via variables CSS `--ad-*` activadas por `data-admin-theme`.
- `RouteContext<'/api/.../[id]'>` es un tipo de Next.js 16 disponible globalmente — sin necesidad de importar.
- `html5-qrcode` — nunca importar estáticamente; siempre `import()` dentro de `useEffect`.
- `react-konva`/`konva` — nunca importar estáticamente; usar `next/dynamic(..., { ssr: false })` desde un componente cliente.
- `lib/uploadWebp.ts` — solo `'use client'`; nunca importar desde rutas del servidor ni `lib/*Db.ts`.
- `app/api/ai/chat/route.ts` — debe permanecer como Lambda de Node.js (`maxDuration = 60`); Edge Runtime rompe la inyección de `GROQ_API_KEY`.
- El alias `@/*` apunta a la raíz del repositorio, por lo que `@/components/...` = `components/` raíz (módulos Konva), no `app/components/`.
- Solo servidor: `lib/*Db.ts`, `lib/auth.ts`, `lib/email.ts` — nunca importar desde componentes cliente.
