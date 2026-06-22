// maxDuration extiende el tiempo de ejecución para funciones de streaming en Vercel.
// Edge Runtime causaba 401 porque Vercel no inyecta env vars sensibles en ese contexto.
export const maxDuration = 60

import { getAllOrders } from '@/lib/ordersDb'
import { getAllMenuItems } from '@/lib/menuDb'
import { getAllRecipes } from '@/lib/recipeDb'
import { getSetting } from '@/lib/settingsDb'
import { getAllReviews } from '@/lib/reviewDb'
import { getAllCards } from '@/lib/loyaltyDb'
import { getAllTables } from '@/lib/tablesDb'
import { getAllInventory } from '@/lib/inventoryDb'

const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_FAST     = 'llama-3.1-8b-instant'
const MODEL_POWERFUL = 'llama-3.3-70b-versatile'

type Role = 'cook' | 'staff' | 'customer' | 'admin' | 'recipe' | 'resta3' | 'employee'
interface SimpleMenu { id: string; name: string; price: number; category: string; description?: string }

async function buildSystem(
  role: Role,
  restaurantName: string,
  menuContext?: SimpleMenu[],
): Promise<string> {
  const now  = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', hour12: true })
  const base = `Eres el asistente inteligente del restaurante "${restaurantName}". Hora actual: ${now}.
Responde SIEMPRE en español. Sé breve, directo y útil.`

  // Timeout compartido para todas las llamadas a Supabase (2.5 s por llamada)
  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
    Promise.race([p, new Promise<T>(res => setTimeout(() => res(fallback), 2500))])

  // ── CLIENTE: usa el menú enviado por el cliente (sin llamadas a Supabase) ──
  if (role === 'customer') {
    const menuText = menuContext && menuContext.length > 0
      ? menuContext.map(m => `${m.name} $${m.price} — ${m.category}${m.description ? ' — ' + m.description.slice(0, 80) : ''}`).join('\n')
      : 'Menú no disponible en este momento.'

    return `${base}

Rol: ASISTENTE AL CLIENTE — recomiendas platillos, informas sobre el menú.
IMPORTANTE: cuando recomiendes platillos menciona su nombre EXACTAMENTE como aparece en el menú (mismas mayúsculas y tildes). Recomienda máximo 4 platillos a la vez.

## MENÚ DISPONIBLE
${menuText}`
  }

  const labels: Record<string, string> = { pending: 'pendiente', preparing: 'preparando', ready: 'listo', picked_up: 'con rider', delivered: 'entregado' }
  const age = (iso: string) => `${Math.floor((Date.now() - new Date(iso).getTime()) / 60000)}min`

  // ── COCINERO ──
  if (role === 'cook') {
    const [orders, menu, recipes] = await Promise.all([
      safe(getAllOrders(), []),
      safe(getAllMenuItems(), []),
      safe(getAllRecipes(), []),
    ])
    const active = orders.filter(o => o.status !== 'delivered').slice(0, 30)
    const ordersText = active.length === 0 ? 'Sin pedidos activos.' : active.map(o => {
      const loc = o.notes?.match(/^\[(\w+)\]/)?.[1] ?? (o.tableNumber ? `Mesa ${o.tableNumber}` : 'sin mesa')
      return `• ${o.customerName} | ${loc} | ${labels[o.status] ?? o.status} | ${age(o.createdAt)} | ${o.items.map(i => `${i.quantity}×${i.name}`).join(', ')}`
    }).join('\n')
    const recipesText = recipes.map(r =>
      `▸ ${r.name}\n  Ingredientes: ${r.ingredients.join(', ')}\n  Pasos: ${r.steps.map((s, i) => `${i + 1}. ${s}`).join(' → ')}`
    ).join('\n\n')

    return `${base}
Rol: COCINERO — das pasos numerados de recetas. Si dicen "siguiente" continúa donde quedaste.
Conoces TODO el recetario y los pedidos activos en tiempo real.

## PEDIDOS ACTIVOS (${active.length})
${ordersText}

## MENÚ (disponibilidad)
${menu.map(m => `${m.name} $${m.price} (${m.available ? '✓ disponible' : '✗ agotado'})`).join('\n')}

## RECETARIO COMPLETO
${recipesText}`
  }

  // ── MESERO / STAFF (resta3) ──
  if (role === 'staff') {
    const [orders, menu, cards] = await Promise.all([
      safe(getAllOrders(), []),
      safe(getAllMenuItems(), []),
      safe(getAllCards(), []),
    ])
    const active  = orders.filter(o => o.status !== 'delivered').slice(0, 40)
    const pending = cards.filter(c => !c.active).length
    const ordersText = active.length === 0 ? 'Sin pedidos activos.' : active.map(o => {
      const loc = o.notes?.match(/^\[(\w+)\]/)?.[1] ?? (o.tableNumber ? `Mesa ${o.tableNumber}` : 'sin mesa')
      return `• [${o.id.slice(-4)}] ${o.customerName} | ${loc} | ${labels[o.status] ?? o.status} | ${age(o.createdAt)} | ${o.items.map(i => `${i.quantity}×${i.name}`).join(', ')} | $${o.total ?? 0}`
    }).join('\n')

    return `${base}
Rol: MESERO — gestionas pedidos, tarjetas de lealtad y atención al cliente.

## PEDIDOS ACTIVOS (${active.length})
${ordersText}

## MENÚ DISPONIBLE
${menu.filter(m => m.available).map(m => `${m.name} $${m.price} — ${m.category}`).join('\n')}

## TARJETAS DE LEALTAD
Total: ${cards.length} | Activas: ${cards.filter(c => c.active).length} | Pendientes de activar: ${pending}`
  }

  // ── EMPLEADO (panel /employee) — pedidos + recetario completo + menú + tarjetas ──
  if (role === 'employee') {
    const [orders, menu, recipes, cards] = await Promise.all([
      safe(getAllOrders(), []),
      safe(getAllMenuItems(), []),
      safe(getAllRecipes(), []),
      safe(getAllCards(), []),
    ])
    const active  = orders.filter(o => o.status !== 'delivered').slice(0, 40)
    const pending = cards.filter(c => !c.active).length
    const ordersText = active.length === 0 ? 'Sin pedidos activos.' : active.map(o => {
      const loc = o.notes?.match(/^\[(\w+)\]/)?.[1] ?? (o.tableNumber ? `Mesa ${o.tableNumber}` : 'sin mesa')
      return `• [${o.id.slice(-4)}] ${o.customerName} | ${loc} | ${labels[o.status] ?? o.status} | ${age(o.createdAt)} | ${o.items.map(i => `${i.quantity}×${i.name}`).join(', ')} | $${o.total ?? 0}`
    }).join('\n')
    const recipesText = recipes.map(r =>
      `▸ ${r.name}\n  Ingredientes: ${r.ingredients.join(', ')}\n  Pasos: ${r.steps.map((s, i) => `${i + 1}. ${s}`).join(' → ')}`
    ).join('\n\n')

    return `${base}
Rol: EMPLEADO — conoces pedidos en tiempo real, el recetario completo y tarjetas de lealtad.
Cuando te pregunten por una receta da los pasos NUMERADOS uno por uno. Si dicen "siguiente" continúa donde quedaste.

## PEDIDOS ACTIVOS (${active.length})
${ordersText}

## MENÚ DISPONIBLE
${menu.filter(m => m.available).map(m => `${m.name} $${m.price} — ${m.category}`).join('\n')}

## RECETARIO COMPLETO
${recipesText}

## TARJETAS DE LEALTAD
Total: ${cards.length} | Activas: ${cards.filter(c => c.active).length} | Pendientes de activar: ${pending}`
  }

  // ── RESTA3 ──
  if (role === 'resta3') {
    const [orders, tables, inventory, menu] = await Promise.all([
      safe(getAllOrders(), []),
      safe(getAllTables(), []),
      safe(getAllInventory(), []),
      safe(getAllMenuItems(), []),
    ])
    const active   = orders.filter(o => o.status !== 'delivered').slice(0, 40)
    const today    = new Date().toDateString()
    const todayOrd = orders.filter(o => new Date(o.createdAt).toDateString() === today)
    const revenue  = todayOrd.reduce((s, o) => s + (o.total ?? 0), 0)
    const lowStock = inventory.filter(i => i.stock <= i.minStock)

    const tablesText = tables.length === 0 ? 'Sin mesas configuradas.' : tables.map(t => {
      const info = t.status === 'ocupada' && t.customer ? ` (${t.customer} desde ${t.since ?? '?'})` : ''
      return `• ${t.label} [${t.zone}] — ${t.status}${info} — ${t.seats} lugares`
    }).join('\n')

    const inventoryAlert = lowStock.length === 0
      ? 'Sin alertas de stock.'
      : lowStock.map(i => `⚠ ${i.name}: ${i.stock} ${i.unit} (mínimo ${i.minStock})`).join('\n')

    const ordersText = active.length === 0 ? 'Sin pedidos activos.' : active.map(o => {
      const loc = o.tableNumber ? `Mesa ${o.tableNumber}` : 'sin mesa'
      return `• [${o.id.slice(-4)}] ${o.customerName} | ${loc} | ${labels[o.status] ?? o.status} | ${age(o.createdAt)} | $${o.total ?? 0}`
    }).join('\n')

    return `${base}
Rol: OPERADOR RESTA3 — panel completo de operaciones del restaurante.
Tienes visibilidad en tiempo real de mesas, pedidos, inventario y ventas del día.

## HOY: ${todayOrd.length} pedidos | $${revenue.toFixed(2)} en ventas | ${active.length} activos

## MESAS (${tables.length} total)
Libres: ${tables.filter(t => t.status === 'libre').length} | Ocupadas: ${tables.filter(t => t.status === 'ocupada').length} | Reservadas: ${tables.filter(t => t.status === 'reservada').length} | Limpieza: ${tables.filter(t => t.status === 'limpieza').length}
${tablesText}

## PEDIDOS ACTIVOS (${active.length})
${ordersText}

## INVENTARIO — ALERTAS DE STOCK BAJO
${inventoryAlert}

## MENÚ DISPONIBLE (${menu.filter(m => m.available).length} ítems activos)
${menu.map(m => `${m.name} $${m.price} (${m.available ? '✓' : '✗ agotado'})`).join('\n')}`
  }

  // ── RECETARIO ──
  if (role === 'recipe') {
    const [recipes, menu] = await Promise.all([
      safe(getAllRecipes(), []),
      safe(getAllMenuItems(), []),
    ])
    const recipesText = recipes.map(r =>
      `▸ ${r.name}${r.description ? ': ' + r.description : ''}\n  Ingredientes: ${r.ingredients.join(', ')}\n  Pasos:\n${r.steps.map((s, i) => `    ${i + 1}. ${s}`).join('\n')}`
    ).join('\n\n')

    return `${base}
Rol: CHEF VIRTUAL — explicas recetas paso a paso, sugieres variaciones y sustituciones de ingredientes.

## RECETARIO COMPLETO
${recipesText}

## MENÚ DISPONIBLE
${menu.filter(m => m.available).map(m => `${m.name} $${m.price}`).join(', ')}`
  }

  // ── ADMIN ──
  const [orders, menu, recipes, reviews, cards] = await Promise.all([
    safe(getAllOrders(), []),
    safe(getAllMenuItems(), []),
    safe(getAllRecipes(), []),
    safe(getAllReviews(), []),
    safe(getAllCards(), []),
  ])
  const today       = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
  const active      = orders.filter(o => o.status !== 'delivered')
  const revenue     = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const avgRating   = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A'
  const badReviews  = reviews.filter(r => r.bad).length
  const week        = new Date(Date.now() - 7 * 86400000).toDateString()
  const weekOrders  = orders.filter(o => new Date(o.createdAt) >= new Date(week))
  const weekRevenue = weekOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const topItems    = menu.filter(m => (m.likes ?? 0) > 0).sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).slice(0, 5)

  return `${base}
Rol: ADMINISTRADOR — acceso completo a todos los datos del restaurante en tiempo real.
Puedes analizar ventas, tendencias, clientes, reseñas, menú e inventario.

## RESUMEN HOY
Pedidos: ${todayOrders.length} | Ventas: $${revenue.toFixed(2)} | Activos ahora: ${active.length}
Esta semana: ${weekOrders.length} pedidos | $${weekRevenue.toFixed(2)} en ventas

## PEDIDOS ACTIVOS (${active.length})
${active.length === 0 ? 'Ninguno.' : active.slice(0, 20).map(o => `• ${o.customerName} | ${labels[o.status] ?? o.status} | $${o.total ?? 0} | ${age(o.createdAt)}`).join('\n')}

## VENTAS DE HOY (últimas 20)
${todayOrders.slice(0, 20).map(o => `${o.customerName} | $${o.total ?? 0} | ${new Date(o.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`).join('\n') || 'Sin ventas hoy.'}

## MENÚ (${menu.length} ítems | ${menu.filter(m => !m.available).length} agotados)
${menu.map(m => `${m.name} $${m.price} ${m.available ? '' : '[AGOTADO]'} ❤${m.likes ?? 0}`).join('\n')}

## PLATILLOS MÁS POPULARES
${topItems.length === 0 ? 'Sin datos de likes aún.' : topItems.map((m, i) => `${i + 1}. ${m.name} — ${m.likes} likes`).join('\n')}

## RESEÑAS (${reviews.length} total | ⭐ ${avgRating} promedio | ${badReviews} negativas)
${reviews.slice(0, 10).map(r => `${r.rating}⭐ ${r.customerName}: "${r.comment.slice(0, 80)}"`).join('\n') || 'Sin reseñas.'}

## TARJETAS DE LEALTAD
Total: ${cards.length} | Activas: ${cards.filter(c => c.active).length} | Pendientes: ${cards.filter(c => !c.active).length}

## RECETARIO
${recipes.length} recetas | Categorías: ${[...new Set(recipes.map(r => r.category))].join(', ')}`
}

function streamText(text: string): Response {
  const enc = new TextEncoder()
  return new Response(
    new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close() } }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GROQ_API_KEY ?? '').trim()
    if (!apiKey) return streamText('El asistente IA no está configurado en este servidor. Contacta al administrador.')

    const body = await req.json()
    const { messages, role = 'staff', menuContext } = body

    // Para customer: saltamos getSetting para no perder ~1s de timeout de Vercel Hobby.
    // El nombre del restaurante no es crítico en el rol cliente.
    const isCustomer  = (role as Role) === 'customer'
    let restaurantName = 'Restaurante'
    if (!isCustomer) {
      try {
        restaurantName = await Promise.race([
          getSetting('restaurant_name', 'Restaurante'),
          new Promise<string>(res => setTimeout(() => res('Restaurante'), 800)),
        ])
      } catch { /* usa fallback */ }
    }

    let system: string
    try {
      system = await buildSystem(role as Role, restaurantName, menuContext)
    } catch {
      const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', hour12: true })
      system = `Eres el asistente del restaurante "${restaurantName}". Hora: ${now}. Responde en español.`
    }

    type ChatMsg = { role: string; content: string }
    const cleanMsgs: ChatMsg[] = (messages as ChatMsg[]).filter(
      (m: ChatMsg, i: number) => !(i === 0 && m.role === 'assistant')
    )

    const model       = isCustomer ? MODEL_FAST : MODEL_POWERFUL
    const groqMs      = isCustomer ? 25000 : 20000

    const groqCtrl    = new AbortController()
    const groqTimeout = setTimeout(() => groqCtrl.abort(), groqMs)
    let groqRes: Response
    try {
      groqRes = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: system }, ...cleanMsgs],
          stream: true,
          max_tokens: isCustomer ? 200 : 600,
          temperature: 0.65,
        }),
        signal: groqCtrl.signal,
      })
    } catch {
      clearTimeout(groqTimeout)
      return streamText('El asistente tardó demasiado. Intenta de nuevo en un momento.')
    }
    clearTimeout(groqTimeout)

    if (!groqRes.ok) {
      const msg = groqRes.status === 429
        ? 'El asistente alcanzó su límite de uso. Intenta en unos minutos.'
        : groqRes.status === 401
        ? 'La clave de IA no es válida. Verifica GROQ_API_KEY en Vercel → Settings → Environment Variables.'
        : `Error al contactar la IA (${groqRes.status}). Intenta de nuevo.`
      return streamText(msg)
    }

    const encoder = new TextEncoder()
    const reader  = groqRes.body!.getReader()
    const decoder = new TextDecoder()
    let buffer    = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') { controller.close(); return }
              try {
                const json = JSON.parse(data)
                const text = json.choices?.[0]?.delta?.content
                if (text) controller.enqueue(encoder.encode(text))
              } catch { /* fragmento SSE incompleto */ }
            }
          }
        } catch { /* cliente cerró conexión */ }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return streamText('Ocurrió un error inesperado. Intenta de nuevo.')
  }
}
