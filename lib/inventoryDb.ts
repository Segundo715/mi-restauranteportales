import { supabase } from './supabase'

export interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  minStock: number // umbral mínimo: cuando stock < minStock, se muestra alerta en el panel
  unit: string
  cost: number
  updatedAt: string
}

function toItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? 'General',
    stock: row.stock as number,
    minStock: row.min_stock as number,
    unit: (row.unit as string) ?? 'pz',
    cost: row.cost as number,
    updatedAt: row.updated_at as string,
  }
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const { data } = await supabase.from('inventory').select('*').order('category').order('name')
  return (data ?? []).map(toItem)
}

export async function updateStock(id: string, stock: number): Promise<InventoryItem | null> {
  const { data } = await supabase.from('inventory')
    .update({ stock, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return data ? toItem(data) : null
}

export async function createInventoryItem(data: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> {
  const { data: row, error } = await supabase.from('inventory').insert({
    name: data.name, category: data.category, stock: data.stock,
    min_stock: data.minStock, unit: data.unit, cost: data.cost,
  }).select().single()
  if (error) throw error
  return toItem(row)
}

export async function updateInventoryItem(id: string, data: Partial<Omit<InventoryItem, 'id' | 'updatedAt'>>): Promise<InventoryItem | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) patch.name = data.name
  if (data.category !== undefined) patch.category = data.category
  if (data.stock !== undefined) patch.stock = data.stock
  if (data.minStock !== undefined) patch.min_stock = data.minStock
  if (data.unit !== undefined) patch.unit = data.unit
  if (data.cost !== undefined) patch.cost = data.cost
  const { data: row } = await supabase.from('inventory').update(patch).eq('id', id).select().single()
  return row ? toItem(row) : null
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  return !error
}
