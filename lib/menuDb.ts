import { supabase } from './supabase'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  available: boolean
  likes: number
  createdAt: string
}

function toItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    price: row.price as number,
    category: row.category as string,
    imageUrl: (row.image_url as string) ?? undefined,
    available: row.available as boolean,
    likes: (row.likes as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', RID).order('created_at')
  return (data ?? []).map(toItem)
}

export async function createMenuItem(data: Omit<MenuItem, 'id' | 'createdAt'>): Promise<MenuItem> {
  const { data: row, error } = await supabase.from('menu_items').insert({
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    image_url: data.imageUrl ?? null,
    available: data.available,
    likes: data.likes ?? 0,
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toItem(row)
}

export async function updateMenuItem(id: string, data: Partial<Omit<MenuItem, 'id' | 'createdAt'>>): Promise<MenuItem | null> {
  // Construimos el patch solo con los campos definidos para no sobreescribir con undefined.
  const patch: Record<string, unknown> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.description !== undefined) patch.description = data.description
  if (data.price !== undefined) patch.price = data.price
  if (data.category !== undefined) patch.category = data.category
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl
  if (data.available !== undefined) patch.available = data.available
  if (data.likes !== undefined) patch.likes = data.likes
  const { data: row } = await supabase.from('menu_items').update(patch).eq('id', id).select().single()
  return row ? toItem(row) : null
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  return !error
}
