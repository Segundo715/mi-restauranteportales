import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const RESTA3_FEATURES = ['r3_tpv','r3_mesas','r3_cocina','r3_inventario','r3_compras','r3_empleados','r3_reportes']

export async function GET() {
  // With a dedicated DB, all feature flags (R1 + Resta3) are stored in a single 'feature_flags' key.
  const { data } = await supabase
    .from('settings').select('value').eq('key', 'feature_flags').limit(1)

  const row = Array.isArray(data) ? data[0] : data
  const allFlags: Record<string, boolean> = row?.value
    ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : {}

  const flags = Object.fromEntries(RESTA3_FEATURES.map(k => [k, allFlags[k] ?? true]))

  return Response.json(flags, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
