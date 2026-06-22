import { supabase } from './supabase'

// Almacén genérico de configuración (tabla settings, columnas key / value).
// Usado por los layouts para leer nombre, logo y color del restaurante sin necesidad de auth.

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? fallback
}

// upsert: inserta si no existe, actualiza si ya existe (evita duplicados).
export async function setSetting(key: string, value: string): Promise<void> {
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
}
