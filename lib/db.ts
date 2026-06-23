import { supabase } from './supabase'
import { createHash } from 'node:crypto'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

// Registra cuándo se selló y cuántas visitas tenía el cliente en ese momento.
export interface Stamp {
  timestamp: string
  visitsAfter: number
}

export interface Customer {
  id: string
  name: string
  age?: number
  phone: string
  visits: number
  confirmed: boolean
  registeredAt: string
  stamps: Stamp[]
  requestedAt?: string
  passwordHash?: string
}

// Prefijo "customer:" separa el espacio de hashes de clientes del de admins/empleados.
function hashPassword(name: string, password: string): string {
  return createHash('sha256').update(`customer:${name.toLowerCase()}:${password}`).digest('hex')
}

function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number | undefined,
    phone: (row.phone as string) ?? '',
    visits: (row.visits as number) ?? 0,
    confirmed: row.confirmed as boolean,
    registeredAt: row.registered_at as string,
    stamps: (row.stamps as Stamp[]) ?? [],
    requestedAt: row.requested_at as string | undefined,
    passwordHash: row.password_hash as string | undefined,
  }
}

export async function getAllCustomers(): Promise<Customer[]> {
  const { data } = await supabase.from('customers').select('*').eq('restaurant_id', RID).order('registered_at')
  return (data ?? []).map(toCustomer)
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const { data } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
  return data ? toCustomer(data) : undefined
}

export async function createCustomer(name: string, phone: string, age?: number): Promise<Customer> {
  const { data, error } = await supabase.from('customers').insert({
    name: name.trim(),
    age: age ?? null,
    phone: phone.trim(),
    visits: 0,
    confirmed: false,
    stamps: [],
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toCustomer(data)
}

export async function confirmCustomer(id: string): Promise<Customer | null> {
  const { data } = await supabase.from('customers').update({ confirmed: true }).eq('id', id).select().single()
  return data ? toCustomer(data) : null
}

export async function addStamp(id: string): Promise<Customer | null> {
  const { data: row } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
  if (!row) return null
  const c = toCustomer(row)
  // Solo los clientes confirmados pueden acumular sellos. Máximo 5 sellos antes de canjear.
  if (!c.confirmed || c.visits >= 5) return c
  const newStamps = [...c.stamps, { timestamp: new Date().toISOString(), visitsAfter: c.visits + 1 }]
  const { data } = await supabase.from('customers')
    .update({ visits: c.visits + 1, stamps: newStamps })
    .eq('id', id).select().single()
  return data ? toCustomer(data) : null
}

export async function redeemCoffee(id: string): Promise<Customer | null> {
  const { data } = await supabase.from('customers').update({ visits: 0 }).eq('id', id).select().single()
  return data ? toCustomer(data) : null
}

export async function requestCheckIn(id: string): Promise<Customer | null> {
  const { data } = await supabase.from('customers')
    .update({ requested_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return data ? toCustomer(data) : null
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  return !error
}

export async function createCustomerAccount(name: string, password: string, phone = '', age?: number): Promise<Customer | null> {
  const { data: existing } = await supabase.from('customers')
    .select('id').ilike('name', name).eq('restaurant_id', RID).not('password_hash', 'is', null).maybeSingle()
  if (existing) return null
  const { data, error } = await supabase.from('customers').insert({
    name: name.trim(),
    age: age ?? null,
    phone: phone.trim(),
    visits: 0,
    confirmed: true,
    stamps: [],
    password_hash: hashPassword(name, password),
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toCustomer(data)
}

export async function authenticateCustomer(name: string, password: string): Promise<Customer | null> {
  const hash = hashPassword(name, password)
  const { data } = await supabase.from('customers')
    .select('*').ilike('name', name).eq('password_hash', hash).eq('restaurant_id', RID).maybeSingle()
  return data ? toCustomer(data) : null
}

export async function findOrCreateSimple(name: string, phone: string): Promise<Customer> {
  // Normaliza teléfono eliminando guiones, espacios y paréntesis antes de comparar.
  const clean = phone.replace(/\D/g, '')
  const { data: all } = await supabase.from('customers').select('*').ilike('name', name).eq('restaurant_id', RID)
  const existing = (all ?? []).find((r: Record<string, unknown>) =>
    (r.phone as string).replace(/\D/g, '') === clean
  )
  if (existing) {
    if (!existing.confirmed) {
      await supabase.from('customers').update({ confirmed: true }).eq('id', existing.id)
      existing.confirmed = true
    }
    return toCustomer(existing)
  }
  const { data, error } = await supabase.from('customers').insert({
    name: name.trim(),
    phone: phone.trim(),
    visits: 0,
    confirmed: true,
    stamps: [],
    restaurant_id: RID,
  }).select().single()
  if (error) throw error
  return toCustomer(data)
}
