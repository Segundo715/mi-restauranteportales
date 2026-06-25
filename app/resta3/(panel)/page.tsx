'use client'

// Dashboard de RESTA3: KPIs del día (ventas, mesas, pedidos) con datos en tiempo real de Supabase.
import { useEffect, useState } from 'react'
import { Icon, type IconName } from '@/app/components/Icon'

const S = {
  bg: 'var(--ad-bg)', card: 'var(--ad-card)', accent: 'var(--ad-accent)',
  text: 'var(--ad-text)', sub: 'var(--ad-sub)', border: 'var(--ad-border)',
  blue: '#3b82f6', green: '#22c55e', red: '#ef4444', purple: '#a855f7',
}

interface Order { id: string; customerName: string; status: string; total?: number; createdAt: string }
interface MenuItem { id: string; name: string; category: string; price: number; likes: number; available: boolean }
interface LoyaltyCard { id: string; name: string; visits: number; active: boolean }

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: IconName }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}>
          <Icon name={icon} size={20} />
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}18`, color }}>EN VIVO</span>
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: S.text }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: S.sub }}>{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    preparing: { label: 'En cocina', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    ready:     { label: 'Listo',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    delivered: { label: 'Entregado', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  }
  const s = map[status] ?? { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.12)' }
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default function Resta3Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cards, setCards] = useState<LoyaltyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/menu').then(r => r.json()),
      fetch('/api/loyalty').then(r => r.json()),
    ]).then(([o, m, c]) => {
      setOrders(Array.isArray(o) ? o : [])
      setMenu(Array.isArray(m) ? m : [])
      setCards(Array.isArray(c) ? c : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const activeOrders = orders.filter(o => o.status !== 'delivered')
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString())
  const totalRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const avgTicket = todayOrders.length ? totalRevenue / todayOrders.length : 0
  const topMenu = [...menu].filter(m => m.likes > 0).sort((a, b) => b.likes - a.likes).slice(0, 5)
  const activeCards = cards.filter(c => c.active).length

  const statusCounts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="min-h-screen md:ml-[240px]" style={{ backgroundColor: S.bg }}>
      <div className="max-w-[1200px] mx-auto p-4 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-black" style={{ color: S.text }}>
              Dashboard <span style={{ color: S.accent }}>RESTA3</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>
              {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: S.green }} />
            <span className="text-xs font-bold" style={{ color: S.green }}>Sistema activo</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Ventas del día" value={`$${totalRevenue.toFixed(0)}`} sub={`${todayOrders.length} órdenes`} color={S.accent} icon="cash" />
          <StatCard label="Pedidos activos" value={activeOrders.length} sub="En proceso ahora" color={S.blue} icon="utensils" />
          <StatCard label="Ticket promedio" value={`$${avgTicket.toFixed(0)}`} sub="Por orden" color={S.purple} icon="receipt" />
          <StatCard label="Clientes activos" value={activeCards} sub="Tarjetas fidelización" color={S.green} icon="users" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Órdenes activas */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Órdenes en curso</span>
              <a href="/resta3/tpv" className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${S.accent}18`, color: S.accent }}>
                + Nueva orden
              </a>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm" style={{ color: S.sub }}>Cargando...</div>
            ) : activeOrders.length === 0 ? (
              <div className="p-8 flex flex-col items-center">
                <span className="mb-2" style={{ color: '#22c55e' }}><Icon name="checkCircle" size={28} /></span>
                <p className="text-sm font-medium" style={{ color: S.sub }}>Sin pedidos pendientes</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: S.border }}>
                {activeOrders.slice(0, 8).map(order => (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg,#f59e0b22,#d9770611)', color: S.accent }}>
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: S.text }}>{order.customerName}</p>
                      <p className="text-xs" style={{ color: S.sub }}>{fmtTime(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                    {order.total != null && (
                      <p className="text-sm font-black shrink-0" style={{ color: S.accent }}>${order.total}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho */}
          <div className="space-y-4">

            {/* Estado de órdenes */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <p className="text-sm font-bold mb-3" style={{ color: S.text }}>Estado de cocina</p>
              <div className="space-y-2">
                {[
                  { label: 'Pendientes', count: statusCounts.pending, color: '#f59e0b' },
                  { label: 'En preparación', count: statusCounts.preparing, color: '#3b82f6' },
                  { label: 'Listos', count: statusCounts.ready, color: '#22c55e' },
                  { label: 'Entregados', count: statusCounts.delivered, color: '#64748b' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs" style={{ color: S.sub }}>{s.label}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top platillos */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <p className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: S.text }}>Top platillos <span style={{ color: '#f472b6' }}><Icon name="heart" size={14} /></span></p>
              {topMenu.length === 0 ? (
                <p className="text-xs" style={{ color: S.sub }}>Sin datos aún</p>
              ) : (
                <div className="space-y-2">
                  {topMenu.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-sm w-4 font-black" style={{ color: S.accent }}>{i + 1}</span>
                      <p className="flex-1 text-xs truncate" style={{ color: S.text }}>{item.name}</p>
                      <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: '#f472b6' }}><Icon name="heart" size={12} /> {item.likes}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <p className="text-sm font-bold mb-3" style={{ color: S.text }}>Acceso rápido</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'Nueva orden', href: '/resta3/tpv', icon: 'receipt' },
                  { label: 'Ver cocina', href: '/resta3/cocina', icon: 'chef' },
                  { label: 'Inventario', href: '/resta3/inventario', icon: 'box' },
                  { label: 'Reportes', href: '/resta3/reportes', icon: 'chart' },
                ] as const).map(a => (
                  <a key={a.href} href={a.href}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl text-center transition-all"
                    style={{ backgroundColor: 'var(--ad-elevated)', border: `1px solid ${S.border}` }}>
                    <span style={{ color: S.text }}><Icon name={a.icon} size={20} /></span>
                    <span className="text-[10px] font-bold" style={{ color: S.sub }}>{a.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Módulos del sistema */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: S.sub }}>Módulos del sistema</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {([
              { label: 'TPV / Caja', icon: 'monitor', href: '/resta3/tpv', color: S.accent, desc: 'Terminal de venta' },
              { label: 'Mesas', icon: 'chair', href: '/resta3/mesas', color: S.blue, desc: 'Gestión del salón' },
              { label: 'Cocina', icon: 'chef', href: '/resta3/cocina', color: '#f97316', desc: 'Pantalla KDS' },
              { label: 'Inventario', icon: 'box', href: '/resta3/inventario', color: S.green, desc: 'Stock y productos' },
              { label: 'Empleados', icon: 'users', href: '/resta3/empleados', color: S.purple, desc: 'Turnos y personal' },
              { label: 'Reportes', icon: 'chart', href: '/resta3/reportes', color: '#ec4899', desc: 'Analytics y Z' },
            ] as const).map(m => (
              <a key={m.href} href={m.href}
                className="rounded-2xl p-4 text-center transition-all hover:scale-[1.02]"
                style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
                <div className="mb-2 flex justify-center" style={{ color: m.color }}><Icon name={m.icon} size={26} /></div>
                <p className="text-xs font-black" style={{ color: S.text }}>{m.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: S.sub }}>{m.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
