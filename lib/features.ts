import { supabase } from './supabase'

// Catálogo de todas las features del sistema.
// El SuperAdmin activa/desactiva estos módulos por restaurante desde mi-superadminrestaurante.
export const FEATURES = {
  orders:          { label: 'Pedidos',           emoji: '📋' },
  menu:            { label: 'Menú',              emoji: '🍽' },
  reviews:         { label: 'Reseñas',           emoji: '⭐' },
  tv:              { label: 'Pantalla TV',       emoji: '📺' },
  customers:       { label: 'Clientes',          emoji: '👥' },
  analytics:       { label: 'Analytics',         emoji: '📊' },
  loyaltyCard:     { label: 'Tarjeta Lealtad',   emoji: '☕' },
  favorites:       { label: 'Favoritos',         emoji: '❤️'  },
  ventas:          { label: 'Ventas',            emoji: '💰' },
  marketing:       { label: 'Marketing',         emoji: '📣' },
  crm:             { label: 'CRM',               emoji: '🤝' },
  reservaciones:   { label: 'Reservaciones',     emoji: '📅' },
  operaciones:     { label: 'Operaciones',       emoji: '🏭' },
  automatizaciones:{ label: 'Automatizaciones',  emoji: '🤖' },
  contenido:       { label: 'Contenido',         emoji: '🖼'  },
  produccion:      { label: 'Producción',        emoji: '📦' },
  reportes:        { label: 'Reportes',          emoji: '📑' },
  configuracion:   { label: 'Configuración',     emoji: '⚙️'  },
} as const

export type FeatureKey = keyof typeof FEATURES

export type FeatureFlags = Record<FeatureKey, boolean>

// Defaults por restaurante — usados cuando Supabase aún no tiene config para ese ID.
// mi-superadminrestaurante puede sobreescribir cualquier flag via feature_flags_{rid}.
const RESTAURANT_DEFAULTS: Record<string, Partial<FeatureFlags>> = {
  portales: {
    // Admin: solo menú, TV y dashboard (analytics)
    menu:             true,
    tv:               true,
    analytics:        true,
    // todo lo demás deshabilitado
    orders:           false,
    reviews:          false,
    customers:        false,
    loyaltyCard:      false,
    favorites:        false,
    ventas:           false,
    marketing:        false,
    crm:              false,
    reservaciones:    false,
    operaciones:      false,
    automatizaciones: false,
    contenido:        false,
    produccion:       false,
    reportes:         false,
    configuracion:    false,
  },
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const rid = process.env.NEXT_PUBLIC_RESTAURANT_ID
  const presetDefaults = rid ? (RESTAURANT_DEFAULTS[rid] ?? {}) : {}

  // Primero buscamos flags específicos del restaurante; si no existen, usamos los globales.
  const keys = rid ? [`feature_flags_${rid}`, 'feature_flags'] : ['feature_flags']

  let overrides: Partial<FeatureFlags> = {}
  for (const key of keys) {
    const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
    if (data?.value) { overrides = JSON.parse(data.value); break }
  }

  // Prioridad: Supabase > preset del restaurante > true (habilitado por defecto)
  return Object.fromEntries(
    Object.keys(FEATURES).map(k => [k, overrides[k as FeatureKey] ?? presetDefaults[k as FeatureKey] ?? true])
  ) as FeatureFlags
}
