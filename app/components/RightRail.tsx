'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useBrand } from '@/app/components/BrandProvider'

interface RightRailApi {
  mount: HTMLElement | null
  setMount: (el: HTMLElement | null) => void
  filled: boolean
  setFilled: (b: boolean) => void
  title: string
  setTitle: (t: string) => void
  open: boolean
  setOpen: (b: boolean) => void
}

const RightRailContext = createContext<RightRailApi>({
  mount: null,
  setMount: () => {},
  filled: false,
  setFilled: () => {},
  title: 'Panel',
  setTitle: () => {},
  open: false,
  setOpen: () => {},
})

export function useRightRail(): RightRailApi {
  return useContext(RightRailContext)
}

const S = {
  card: 'var(--ad-card)',
  bg: 'var(--ad-bg)',
  text: 'var(--ad-text)',
  sub: 'var(--ad-sub)',
  border: 'var(--ad-border)',
  accent: 'var(--ad-accent)',
}

function AsideBody({
  setMount, filled, title, onClose, showClose,
}: {
  setMount: (el: HTMLElement | null) => void
  filled: boolean
  title: string
  onClose: () => void
  showClose: boolean
}) {
  return (
    <>
      <div className="px-4 py-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}>
        <p className="font-black text-sm tracking-wide" style={{ color: S.text }}>{title}</p>
        {showClose && (
          <button onClick={onClose} aria-label="Cerrar panel"
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: S.sub }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div ref={setMount} className="flex-1 min-h-0 flex flex-col" />
        {!filled && <DefaultRailContent />}
      </div>
    </>
  )
}

// Provider: gestiona el estado del rail — debe ser ancestro de RightRail y DesktopRail
export function RightRailProvider({ children }: { children: React.ReactNode }) {
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [filled, setFilled] = useState(false)
  const [title, setTitle] = useState('Panel')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('resta3:open-rail', handler)
    return () => window.removeEventListener('resta3:open-rail', handler)
  }, [])

  return (
    <RightRailContext.Provider value={{ mount, setMount, filled, setFilled, title, setTitle, open, setOpen }}>
      {children}
    </RightRailContext.Provider>
  )
}

// DesktopRail: flex item en el layout — SIN position:fixed, cero GPU compositor layers
export function DesktopRail() {
  const { setMount, filled, title, setOpen } = useRightRail()
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[420px] lg:flex-shrink-0"
      style={{ backgroundColor: S.card, borderLeft: `1px solid ${S.border}` }}>
      <AsideBody
        setMount={setMount}
        filled={filled}
        title={title}
        onClose={() => setOpen(false)}
        showClose={false}
      />
    </aside>
  )
}

// RightRail: envuelve el contenido de la página + maneja el drawer mobile
// NO provee context (lo provee RightRailProvider en layout) y NO tiene aside fixed permanente
export default function RightRail({ children }: { children: React.ReactNode }) {
  const { setMount, filled, title, open, setOpen } = useRightRail()

  return (
    <>
      {children}

      {/* Overlay mobile — solo cuando está abierto */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Drawer mobile — solo existe en DOM cuando está abierto, y solo en < lg */}
      {open && (
        <aside
          className="lg:hidden fixed top-0 right-0 h-screen w-[420px] z-[41] flex flex-col shadow-2xl"
          style={{ backgroundColor: S.card, borderLeft: `1px solid ${S.border}` }}>
          <AsideBody
            setMount={setMount}
            filled={filled}
            title={title}
            onClose={() => setOpen(false)}
            showClose={true}
          />
        </aside>
      )}
    </>
  )
}

function DefaultRailContent() {
  const brand = useBrand()
  const [now, setNow] = useState('')

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000 * 30)
    return () => clearInterval(id)
  }, [])

  const shortcuts = [
    { href: '/resta3/tpv',    label: 'TPV / Caja', emoji: '🧾' },
    { href: '/resta3/cocina', label: 'Cocina',      emoji: '🍳' },
    { href: '/resta3/mesas',  label: 'Mesas',       emoji: '🪑' },
  ]

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
        <p className="text-3xl font-black tabular-nums" style={{ color: S.text }}>{now || '—'}</p>
        <p className="text-xs mt-1" style={{ color: S.sub }}>{brand.name || 'RESTA3'}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: S.sub }}>Accesos rápidos</p>
        <div className="space-y-1.5">
          {shortcuts.map(s => (
            <a key={s.href} href={s.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }}>
              <span className="text-base">{s.emoji}</span>{s.label}
            </a>
          ))}
        </div>
      </div>
      <p className="text-[11px] mt-auto text-center" style={{ color: S.sub }}>
        Panel fijo · espacio para más funciones
      </p>
    </div>
  )
}
