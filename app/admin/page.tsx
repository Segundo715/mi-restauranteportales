'use client'

// Dashboard de fidelización con KPIs y distribución por tier.
// Datos estáticos/demo — sirve como wireframe visual del módulo de lealtad.
import AdminNav from '@/app/components/AdminNav'
import { Icon, type IconName } from '@/app/components/Icon'

const S = {
  bg: 'var(--ad-bg)', card: 'var(--ad-card)', accent: 'var(--ad-accent)',
  text: 'var(--ad-text)', sub: 'var(--ad-sub)', border: 'var(--ad-border)',
  elevated: 'var(--ad-elevated)',
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-0.5 h-7">
      {data.map((v, i) => (
        <div key={i} className="w-1 rounded-sm" style={{ height: `${Math.max(4, (v / max) * 28)}px`, backgroundColor: color, opacity: 0.7 }} />
      ))}
    </div>
  )
}

const WEEKS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
const EMIT   = [42000, 48000, 45000, 49200]
const CANJE  = [11000, 14000, 12500, 14900]
const MAX_E  = Math.max(...EMIT)

export default function AdminFidelizacionPage() {
  return (
    <div className="min-h-screen md:ml-[240px] md:pt-16" style={{ backgroundColor: S.bg }}>
      <AdminNav />
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2" style={{ color: S.text }}><Icon name="gem" size={20} /> Fidelización</h1>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Programa de lealtad, puntos, tarjetas y rewards</p>
          </div>
          <button className="text-sm px-4 py-2 rounded-xl font-bold" style={{ backgroundColor: S.accent, color: '#000' }}>+ Nuevo reward</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Miembros activos',    value: '2,847', delta: '↑ 12.4% vs mes ant.', icon: 'card', iconBg: 'rgba(168,85,247,.12)', sc: '#c084fc', spark: [18,22,20,26,24,30,28,34,32,38] },
            { label: 'Puntos emitidos (mes)',value: '184K',  delta: '↑ 8.7% vs mes ant.',  icon: 'star', iconBg: 'rgba(0,230,118,.10)',  sc: 'var(--ad-accent)', spark: [12,14,13,16,15,18,17,20,19,22] },
            { label: 'Canjes realizados',   value: '342',   delta: '↑ 15.2%',              icon: 'gift', iconBg: 'rgba(251,191,36,.12)', sc: '#fbbf24', spark: [5,8,7,10,9,14,12,16,14,18]  },
            { label: 'Tasa de retención',   value: '78%',   delta: '↑ 3.1pp',              icon: 'refresh', iconBg: 'rgba(59,130,246,.12)', sc: '#60a5fa', spark: [60,62,64,66,68,70,72,74,76,78] },
            { label: 'LTV miembros vs no',  value: '3.4x',  delta: '↑ 0.3x',               icon: 'trendingUp', iconBg: 'rgba(6,182,212,.12)',  sc: '#22d3ee', spark: [2.4,2.6,2.7,2.9,3.0,3.1,3.2,3.3,3.3,3.4] },
          ].map(k => (
            <div key={k.label} className="rounded-2xl p-4" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: S.sub }}>{k.label}</p>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.iconBg, color: k.sc }}><Icon name={k.icon as IconName} size={16} /></span>
              </div>
              <p className="text-[1.7rem] font-black leading-none mb-2" style={{ color: S.text }}>{k.value}</p>
              <div className="flex items-end justify-between">
                <span className="text-xs font-medium" style={{ color: '#4ade80' }}>{k.delta}</span>
                <Spark data={k.spark} color={k.sc} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Distribución por Tier */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Distribución por Tier</span>
            </div>
            <div className="px-5 py-4">
              {/* SVG donut */}
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 120 120" width="180" height="180">
                  {(() => {
                    const data = [{ v: 124, c: '#c084fc' }, { v: 412, c: '#fbbf24' }, { v: 845, c: '#60a5fa' }, { v: 1466, c: '#64748b' }]
                    const total = data.reduce((s, d) => s + d.v, 0)
                    let offset = 0
                    const r = 45, cx = 60, cy = 60, gap = 2
                    return data.map((d, i) => {
                      const pct = d.v / total
                      const circ = 2 * Math.PI * r
                      const startAngle = offset
                      offset += pct * 360
                      return (
                        <circle key={i} cx={cx} cy={cy} r={r}
                          fill="none" stroke={d.c} strokeWidth="18"
                          strokeDasharray={`${(pct * 360 - gap) / 360 * circ} ${circ}`}
                          strokeDashoffset={-(startAngle / 360) * circ + circ / 4}
                          strokeLinecap="butt" />
                      )
                    })
                  })()}
                  <text x="60" y="56" textAnchor="middle" fill="var(--ad-text)" fontSize="14" fontWeight="900">2,847</text>
                  <text x="60" y="70" textAnchor="middle" fill="var(--ad-sub)" fontSize="8">miembros</text>
                </svg>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Platinum', count: '124',   pct: '4.4%',  color: '#c084fc' },
                  { label: 'Gold',     count: '412',   pct: '14.5%', color: '#fbbf24' },
                  { label: 'Silver',   count: '845',   pct: '29.7%', color: '#60a5fa' },
                  { label: 'Bronze',   count: '1,466', pct: '51.4%', color: '#64748b' },
                ].map(t => (
                  <div key={t.label} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="flex-1 text-sm" style={{ color: S.text }}>{t.label}</span>
                    <span className="font-bold text-sm" style={{ color: S.text }}>{t.count}</span>
                    <span className="text-xs w-10 text-right" style={{ color: S.sub }}>{t.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actividad de puntos */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Actividad de puntos</span>
              <span className="text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1" style={{ backgroundColor: 'var(--ad-overlay)', color: S.sub }}>Este mes <Icon name="chevronDown" size={12} /></span>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Emitidos',  value: '+184,200', color: 'var(--ad-accent)' },
                  { label: 'Canjeados', value: '-52,400',  color: '#fbbf24' },
                  { label: 'Expirados', value: '-8,100',   color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl" style={{ backgroundColor: S.elevated, border: `1px solid ${S.border}` }}>
                    <p className="text-xs mb-1" style={{ color: S.sub }}>{s.label}</p>
                    <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-3" style={{ height: 160 }}>
                {WEEKS.map((w, i) => (
                  <div key={w} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col-reverse gap-0.5">
                      <div className="w-full rounded-sm" style={{ height: `${(EMIT[i] / MAX_E) * 120}px`, backgroundColor: 'var(--ad-accent)' }} />
                      <div className="w-full rounded-sm" style={{ height: `${(CANJE[i] / MAX_E) * 120}px`, backgroundColor: '#fbbf24' }} />
                    </div>
                    <span className="text-xs" style={{ color: S.sub }}>{w}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2">
                {[['var(--ad-accent)','Emitidos'],['#fbbf24','Canjeados']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: S.sub }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />{l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjetas digitales */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Tarjetas digitales</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { icon: 'wallet', bg: 'rgba(168,85,247,.1)', text: 'Apple Wallet',  sub: '1,245 tarjetas activas', pct: '62%' },
                { icon: 'wallet', bg: 'rgba(59,130,246,.1)', text: 'Google Wallet', sub: '768 tarjetas activas',   pct: '38%' },
              ].map(w => (
                <div key={w.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: w.bg, color: S.text }}><Icon name={w.icon as IconName} size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: S.text }}>{w.text}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{w.sub}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: S.accent }}>{w.pct}</span>
                </div>
              ))}
              <div className="p-3 rounded-xl" style={{ backgroundColor: S.elevated, border: `1px solid ${S.border}` }}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs" style={{ color: S.sub }}>Tasa de adopción</span>
                  <span className="text-xs font-bold" style={{ color: S.text }}>71%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,.06)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: '71%', background: 'linear-gradient(90deg,var(--ad-accent),#06b6d4)' }} />
                </div>
              </div>
              {[
                { icon: 'send', bg: 'rgba(0,230,118,.1)',  text: 'Push enviados (mes)',  sub: '4,520 notificaciones',           pct: '89% entrega' },
                { icon: 'refresh', bg: 'rgba(251,191,36,.1)', text: 'Updates de tarjeta',   sub: 'Puntos y tier en tiempo real',   pct: null },
              ].map(a => (
                <div key={a.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: a.bg, color: S.text }}><Icon name={a.icon as IconName} size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: S.text }}>{a.text}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{a.sub}</p>
                  </div>
                  {a.pct
                    ? <span className="text-xs font-bold shrink-0" style={{ color: S.text }}>{a.pct}</span>
                    : <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: S.accent }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: S.accent }} />Activo</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top clientes */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Top clientes fidelizados</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { rank: 1, rc: '#c084fc', bg: 'linear-gradient(135deg,#c084fc,#7c3aed)', icon: 'gem', name: 'Roberto García', tier: 'Platinum · 45 visitas', pts: '15,200 pts', ltv: '$89,200 LTV' },
                { rank: 2, rc: '#fbbf24', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', icon: 'star', name: 'Ana Martínez',   tier: 'Gold · 23 visitas',     pts: '8,450 pts',  ltv: '$47,500 LTV' },
                { rank: 3, rc: '#f59e0b', bg: 'linear-gradient(135deg,#fbbf24,#b45309)', icon: 'star', name: 'Lucía Pérez',    tier: 'Gold · 15 visitas',     pts: '6,800 pts',  ltv: '$31,000 LTV' },
                { rank: 4, rc: '#60a5fa', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', icon: 'star', name: 'Carlos Mendoza', tier: 'Silver · 12 visitas',   pts: '3,200 pts',  ltv: '$22,800 LTV' },
              ].map(p => (
                <div key={p.rank} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: `${p.rc}20`, color: p.rc }}>{p.rank}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: p.bg }}><Icon name={p.icon as IconName} size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: S.text }}>{p.name}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{p.tier}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: S.text }}>{p.pts}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{p.ltv}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <span className="text-xs font-semibold" style={{ color: S.accent }}>Ver todos los miembros →</span>
            </div>
          </div>

          {/* Rewards */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Rewards más canjeados</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { rank: 1, rc: '#c084fc', icon: 'gift', name: 'Postre gratis',         sub: '500 pts · 142 canjes',   pct: '41.5%' },
                { rank: 2, rc: '#fbbf24', icon: 'coffee', name: 'Bebida 2x1',            sub: '300 pts · 98 canjes',    pct: '28.6%' },
                { rank: 3, rc: '#60a5fa', icon: 'cash', name: '$200 de descuento',     sub: '1,000 pts · 64 canjes',  pct: '18.7%' },
                { rank: 4, rc: '#94a3b8', icon: 'utensils', name: 'Plato principal gratis', sub: '2,500 pts · 38 canjes', pct: '11.1%' },
              ].map(p => (
                <div key={p.rank} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: `${p.rc}20`, color: p.rc }}>{p.rank}</div>
                  <span className="shrink-0" style={{ color: p.rc }}><Icon name={p.icon as IconName} size={18} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: S.text }}>{p.name}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{p.sub}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: S.accent }}>{p.pct}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <span className="text-xs font-semibold" style={{ color: S.accent }}>Gestionar rewards →</span>
            </div>
          </div>

          {/* Cupones */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <span className="font-bold text-sm" style={{ color: S.text }}>Cupones automáticos</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { icon: 'gift', bg: 'rgba(251,191,36,.1)', name: 'Cupón Cumpleaños',   sub: 'Postre gratis · 34 enviados' },
                { icon: 'heart', bg: 'rgba(239,68,68,.1)',  name: 'Recuperación churn', sub: '20% off · 15d sin volver'    },
                { icon: 'user', bg: 'rgba(0,230,118,.1)',  name: 'Bienvenida',          sub: '10% primera compra'          },
                { icon: 'trophy', bg: 'rgba(168,85,247,.1)', name: 'Ascenso de tier',    sub: 'Reward sorpresa al subir'    },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg, color: S.text }}><Icon name={c.icon as IconName} size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: S.text }}>{c.name}</p>
                    <p className="text-xs" style={{ color: S.sub }}>{c.sub}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: S.accent }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: S.accent }} />Activo
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <span className="text-xs font-semibold" style={{ color: S.accent }}>Ver todas las automatizaciones →</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
