import { supabase } from './supabase'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

export interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
  published: boolean
  bad: boolean
}

function toReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    customerName: row.customer_name as string,
    rating: row.rating as number,
    comment: (row.comment as string) ?? '',
    createdAt: row.created_at as string,
    published: row.published as boolean,
    bad: row.bad as boolean,
  }
}

export async function getAllReviews(): Promise<Review[]> {
  const { data } = await supabase.from('reviews').select('*').eq('restaurant_id', RID).order('created_at', { ascending: false })
  return (data ?? []).map(toReview)
}

export async function getPublishedReviews(): Promise<Review[]> {
  const { data } = await supabase.from('reviews').select('*').eq('restaurant_id', RID).eq('published', true).order('created_at', { ascending: false })
  return (data ?? []).map(toReview)
}

export async function createReview(data: Pick<Review, 'customerName' | 'rating' | 'comment'>): Promise<Review> {
  const { data: row, error } = await supabase.from('reviews').insert({
    customer_name: data.customerName,
    rating: data.rating,
    comment: data.comment,
    // Rating ≤ 3 → reseña negativa (dispara alerta por email al admin).
    bad: data.rating <= 3,
    // Rating ≥ 4 → se publica automáticamente en el menú público.
    published: data.rating >= 4,
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toReview(row)
}

export async function updateReview(id: string, patch: Partial<Review>): Promise<Review | null> {
  const update: Record<string, unknown> = {}
  if (patch.published !== undefined) update.published = patch.published
  if (patch.bad !== undefined) update.bad = patch.bad
  if (patch.comment !== undefined) update.comment = patch.comment
  const { data } = await supabase.from('reviews').update(update).eq('id', id).select().single()
  return data ? toReview(data) : null
}

export async function deleteReview(id: string): Promise<boolean> {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  return !error
}
