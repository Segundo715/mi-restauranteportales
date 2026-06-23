import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const RESTA3_FEATURES = ['r3_tpv','r3_mesas','r3_cocina','r3_inventario','r3_compras','r3_empleados','r3_reportes']

export async function GET() {
  // Portales stores all feature flags (R1 + Resta3) together in feature_flags_portales.
  // Fall back to the global feature_flags_resta3 if portales hasn't been configured yet.
  const { data: portalesData } = await supabase
    .from('settings').select('value').eq('key', 'feature_flags_portales').limit(1)

  const portalesRow = Array.isArray(portalesData) ? portalesData[0] : portalesData
  const portalesFlags: Record<string, boolean> = portalesRow?.value
    ? (typeof portalesRow.value === 'string' ? JSON.parse(portalesRow.value) : portalesRow.value) : {}

  const hasPortalesR3 = RESTA3_FEATURES.some(k => k in portalesFlags)

  let overrides: Record<string, boolean> = portalesFlags
  if (!hasPortalesR3) {
    const { data } = await supabase
      .from('settings').select('value').eq('key', 'feature_flags_resta3').limit(1)
    const row = Array.isArray(data) ? data[0] : data
    overrides = row?.value
      ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : {}
  }

  const flags = Object.fromEntries(RESTA3_FEATURES.map(k => [k, overrides[k] ?? true]))

  return Response.json(flags, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
