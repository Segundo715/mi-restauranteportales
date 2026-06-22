export interface BirthdayRegistration {
  id: string
  name: string
  phone: string
  birthdate: string
  createdAt: string
}

function getBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const raw = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const key = raw.replace(/^﻿/, '').trim()
  return { url, key }
}

function toReg(row: Record<string, unknown>): BirthdayRegistration {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    birthdate: row.birthdate as string,
    createdAt: row.created_at as string,
  }
}

export async function getAllBirthdays(): Promise<BirthdayRegistration[]> {
  const { url, key } = getBase()
  const res = await fetch(`${url}/rest/v1/birthday_registrations?select=*&order=birthdate`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data as Record<string, unknown>[]).map(toReg)
}

export async function createBirthday(
  name: string,
  phone: string,
  birthdate: string,
): Promise<BirthdayRegistration> {
  const { url, key } = getBase()
  const res = await fetch(`${url}/rest/v1/birthday_registrations`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ name, phone, birthdate }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  const [row] = await res.json()
  return toReg(row as Record<string, unknown>)
}

export async function deleteBirthday(id: string): Promise<void> {
  const { url, key } = getBase()
  await fetch(`${url}/rest/v1/birthday_registrations?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
}
