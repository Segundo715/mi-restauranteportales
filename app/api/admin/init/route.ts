import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { countAdmins, createAdmin } from '@/lib/adminDb'

// Primer inicio: crea el admin inicial SOLO si no existe ninguno todavía.
// Una vez que hay un admin registrado, este endpoint devuelve 403 para siempre.
export async function POST(req: NextRequest) {
  const count = await countAdmins()
  if (count > 0)
    return NextResponse.json({ error: 'Ya existe un administrador. Usa /admin/login.' }, { status: 403 })

  const { name, password } = await req.json()
  if (!name?.trim() || !password)
    return NextResponse.json({ error: 'Nombre y contraseña requeridos' }, { status: 400 })

  const admin = await createAdmin(name.trim(), password)
  if (!admin)
    return NextResponse.json({ error: 'No se pudo crear el administrador' }, { status: 500 })

  const res = NextResponse.json({ ok: true, name: admin.name })
  res.cookies.set('admin_session', createSession(admin.id), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 86400 })
  res.cookies.set('admin_name', admin.name, { path: '/', sameSite: 'lax', maxAge: 86400 })
  return res
}
