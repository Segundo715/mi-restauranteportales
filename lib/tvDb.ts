import { supabase } from './supabase'

export interface TVSlide {
  id: string
  title: string
  subtitle?: string
  price?: string
  imageUrl?: string
  isOffer: boolean
  order: number
  active: boolean
  createdAt: string
}

function toSlide(row: Record<string, unknown>): TVSlide {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: row.subtitle as string | undefined,
    price: row.price as string | undefined,
    imageUrl: row.image_url as string | undefined,
    isOffer: row.is_offer as boolean,
    order: row.slide_order as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  }
}

export async function getAllSlides(): Promise<TVSlide[]> {
  const { data } = await supabase.from('tv_slides').select('*').order('slide_order')
  return (data ?? []).map(toSlide)
}

// Solo las slides activas se muestran en la pantalla TV del restaurante.
export async function getActiveSlides(): Promise<TVSlide[]> {
  const { data } = await supabase.from('tv_slides').select('*').eq('active', true).order('slide_order')
  return (data ?? []).map(toSlide)
}

export async function createSlide(data: Omit<TVSlide, 'id' | 'createdAt' | 'order'>): Promise<TVSlide> {
  // El orden se asigna al final de la lista actual (0-based).
  const { count } = await supabase.from('tv_slides').select('*', { count: 'exact', head: true })
  const { data: row, error } = await supabase.from('tv_slides').insert({
    title: data.title,
    subtitle: data.subtitle ?? null,
    price: data.price ?? null,
    image_url: data.imageUrl ?? null,
    is_offer: data.isOffer,
    slide_order: count ?? 0,
    active: data.active,
  }).select().single()
  if (error) throw error
  return toSlide(row)
}

export async function updateSlide(id: string, data: Partial<TVSlide>): Promise<TVSlide | null> {
  const patch: Record<string, unknown> = {}
  if (data.title !== undefined) patch.title = data.title
  if (data.subtitle !== undefined) patch.subtitle = data.subtitle
  if (data.price !== undefined) patch.price = data.price
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl
  if (data.isOffer !== undefined) patch.is_offer = data.isOffer
  if (data.order !== undefined) patch.slide_order = data.order
  if (data.active !== undefined) patch.active = data.active
  const { data: row } = await supabase.from('tv_slides').update(patch).eq('id', id).select().single()
  return row ? toSlide(row) : null
}

export async function deleteSlide(id: string): Promise<boolean> {
  const { error } = await supabase.from('tv_slides').delete().eq('id', id)
  return !error
}
