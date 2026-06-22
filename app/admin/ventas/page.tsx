'use client'

// Vista de ventas con gráfica de barras del mes. Datos demo; no conecta a API de ventas real.
import AdminNav from '@/app/components/AdminNav'
import { Icon } from '@/app/components/Icon'

const S = {
  bg: 'var(--ad-bg)', card: 'var(--ad-card)', accent: 'var(--ad-accent)',
  text: 'var(--ad-text)', sub: 'var(--ad-sub)', border: 'var(--ad-border)',
}

const SALES =[18200,22400,19800,24100,21500,26300,23700,28900,25200,30100,27400,32500,29800,34200,31600,36400,33800,38200,35600,40100,37500,42300,39700,44500,41900,46800,44200,49100,46500,51300]
const MAX_S = Math.max(...SALES)

export default function AdminVentasPage() {
  return (
    <div className="min-h-screen md:ml-[240px] md:pt-16" style={{ backgroundColor: S.bg }}>
      <AdminNav />
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="pt-1">
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color: S.text }}><Icon name="cash" size={20} /> Ventas</h1>
          <p className="text-xs mt-0.5" style={{ color: S.sub }}>Transacciones, pagos y cierres</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Ventas hoy',      value: '$24,580', delta: '↑ 18.2%' },
            { label: 'Pedidos',         value: '87',      delta: null       },
            { label: 'Ticket promedio', value: '$320',    delta: null       },
            { label: 'Propinas',        value: '$3,200',  delta: null       },
          ].map(k => (
            <div key={k.label} className="rounded-2xl p-4" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: S.sub }}>{k.label}</p>
              <p className="text-2xl font-black" style={{ color: S.text }}>{k.value}</p>
              {k.delta && <p className="text-xs font-medium mt-1" style={{ color: '#4ade80' }}>{k.delta}</p>}
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <span className="font-bold text-sm" style={{ color: S.text }}>Ventas del mes</span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-end gap-1" style={{ height: 280 }}>
              {SALES.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm" style={{ height: `${Math.max(4, (v / MAX_S) * 260)}px`, backgroundColor: '#6366f1' }} />
                  {(i + 1) % 5 === 0 && <span className="text-[9px]" style={{ color: S.sub }}>{i + 1}</span>}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['$18K','$27K','$36K','$45K','$51K'].map(v => (
                <span key={v} className="text-xs" style={{ color: S.sub }}>{v}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
