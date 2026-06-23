import { supabase } from './supabase'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

export type TableStatus = 'libre' | 'ocupada' | 'reservada' | 'limpieza'

export interface RestaurantTable {
  id: string
  label: string
  seats: number
  status: TableStatus
  customer?: string
  since?: string
  zone: string
  updatedAt: string
}

function toTable(row: Record<string, unknown>): RestaurantTable {
  return {
    id: row.id as string,
    label: row.label as string,
    seats: row.seats as number,
    status: row.status as TableStatus,
    customer: (row.customer as string) || undefined,
    since: (row.since as string) || undefined,
    zone: (row.zone as string) ?? 'Salón',
    updatedAt: row.updated_at as string,
  }
}

export async function getAllTables(): Promise<RestaurantTable[]> {
  const { data } = await supabase.from('tables').select('*').eq('restaurant_id', RID).order('label')
  return (data ?? []).map(toTable)
}

export async function updateTable(id: string, patch: Partial<Pick<RestaurantTable, 'status' | 'customer' | 'since' | 'label' | 'seats' | 'zone'>>): Promise<RestaurantTable | null> {
  const { data } = await supabase.from('tables')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return data ? toTable(data) : null
}

export async function createTable(data: Omit<RestaurantTable, 'id' | 'updatedAt'>): Promise<RestaurantTable> {
  const { data: row, error } = await supabase.from('tables').insert({
    label: data.label, seats: data.seats, status: data.status,
    customer: data.customer ?? null, since: data.since ?? null, zone: data.zone,
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toTable(row)
}

export async function deleteTable(id: string): Promise<boolean> {
  const { error } = await supabase.from('tables').delete().eq('id', id)
  return !error
}
