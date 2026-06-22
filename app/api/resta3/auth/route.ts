import { NextRequest } from 'next/server'
import { authenticateAdmin, createAdmin } from '@/lib/adminDb'
import { createSession } from '@/lib/auth'

// Cookie separada de /admin para que las sesiones de Resta3 y del admin principal sean independientes.
const COOKIE = 'resta3_session'

function setSession(adminId: string, adminName: string) {
  const token = createSession(adminId)
  const res = Response.json({ ok: true, name: adminName })
  res.headers.set('Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`)
  return res
}

export async function POST(req: NextRequest) {
  const { name, password, action = 'login' } = await req.json()
  if (!name?.trim() || !password)
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })

  if (action === 'register') {
    if (password.length < 6)
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    const admin = await createAdmin(name.trim(), password)
    if (!admin)
      return Response.json({ error: 'El usuario ya existe' }, { status: 409 })
    return setSession(admin.id, admin.name)
  }

  // login
  const admin = await authenticateAdmin(name.trim(), password)
  if (!admin)
    return Response.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  return setSession(admin.id, admin.name)
}

// Cierra sesión sobreescribiendo la cookie con Max-Age=0 (eliminación inmediata).
export async function DELETE() {
  const res = Response.json({ ok: true })
  res.headers.set('Set-Cookie',
    `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
  return res
}
