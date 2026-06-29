import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const RESTA3_FEATURES = ['r3_dashboard','r3_tpv','r3_mesas','r3_cocina','r3_inventario','r3_compras','r3_empleados','r3_reportes']

export async function GET() {
  const { data } = await supabase
    .from('settings').select('value').eq('key', 'feature_flags_resta3').limit(1)

  const row = Array.isArray(data) ? data[0] : data
  const overrides: Record<string, boolean> = row?.value
    ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value)
    : {}
  // Si un flag no está en Supabase, se habilita por defecto.
  const flags = Object.fromEntries(RESTA3_FEATURES.map(k => [k, overrides[k] ?? true]))

  return Response.json(flags, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
