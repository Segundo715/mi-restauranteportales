import { supabase } from './supabase'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

export interface Recipe {
  id: string
  name: string
  description: string
  category: string
  ingredients: string[]
  steps: string[]
  imageUrl?: string
  createdAt: string
}

function toRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: (row.category as string) ?? 'General',
    ingredients: (row.ingredients as string[]) ?? [],
    steps: (row.steps as string[]) ?? [],
    imageUrl: row.image_url as string | undefined,
    createdAt: row.created_at as string,
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const { data } = await supabase.from('recipes').select('*').eq('restaurant_id', RID).order('created_at', { ascending: false })
  return (data ?? []).map(toRecipe)
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const { data } = await supabase.from('recipes').select('*').eq('id', id).maybeSingle()
  return data ? toRecipe(data) : undefined
}

export async function createRecipe(data: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
  const { data: row, error } = await supabase.from('recipes').insert({
    name: data.name,
    description: data.description,
    category: data.category,
    ingredients: data.ingredients,
    steps: data.steps,
    image_url: data.imageUrl ?? null,
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toRecipe(row)
}

export async function updateRecipe(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<Recipe | null> {
  const patch: Record<string, unknown> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.description !== undefined) patch.description = data.description
  if (data.category !== undefined) patch.category = data.category
  if (data.ingredients !== undefined) patch.ingredients = data.ingredients
  if (data.steps !== undefined) patch.steps = data.steps
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl
  const { data: row } = await supabase.from('recipes').update(patch).eq('id', id).select().single()
  return row ? toRecipe(row) : null
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  return !error
}
