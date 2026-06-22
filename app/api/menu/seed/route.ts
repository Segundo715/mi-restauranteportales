import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import demoMenu from '@/lib/demo-menu.json'

export async function POST(req: NextRequest) {
  if (!verifySession(req.cookies.get('admin_session')?.value))
    return Response.json({ error: 'No autorizado' }, { status: 401 })

  let created = 0
  let skipped = 0

  for (const item of demoMenu) {
    const { data: existing } = await supabase
      .from('menu_items')
      .select('id')
      .eq('name', item.name)
      .maybeSingle()

    if (existing) { skipped++; continue }

    await supabase.from('menu_items').insert({
      name:        item.name,
      description: item.description,
      price:       item.price,
      category:    item.category,
      available:   item.available,
      likes:       0,
    })
    created++
  }

  return Response.json({ ok: true, created, skipped })
}
