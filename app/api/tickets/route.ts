import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifySession } from '@/lib/auth'
import { getSetting } from '@/lib/settingsDb'

const RID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default'

export async function POST(req: NextRequest) {
  const cookies = req.cookies
  const isAuth =
    verifySession(cookies.get('admin_session')?.value) ||
    verifySession(cookies.get('employee_session')?.value) ||
    verifySession(cookies.get('resta3_session')?.value)

  if (!isAuth) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { from_name, from_role, message } = await req.json()
  if (!message?.trim()) return Response.json({ error: 'Mensaje requerido' }, { status: 400 })

  const restaurantName = await getSetting('restaurant_name')

  const { error } = await supabase.from('sa_tickets').insert({
    restaurant_id: RID,
    restaurant_name: restaurantName || RID,
    from_name: from_name || 'Desconocido',
    from_role: from_role || 'Usuario',
    message: message.trim(),
  })

  if (error) return Response.json({ error: 'Error al enviar reporte' }, { status: 500 })
  return Response.json({ ok: true })
}
