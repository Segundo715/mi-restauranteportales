import { createClient } from '@supabase/supabase-js'

// Cliente único compartido por todos los db-helpers.
// Usa la anon key porque las políticas RLS de Supabase controlan el acceso.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)
