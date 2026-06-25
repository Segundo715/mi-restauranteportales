'use client'

// Rail derecho fijo del panel RESTA3. Fijo en desktop (lg+), drawer en mobile/tablet.
// En mobile el aside NO existe en el DOM cuando está cerrado — evita capas GPU en Android.
import { createContext, useContext, useEffect, useState } from 'react'
import { useBrand } from '@/app/components/BrandProvider'

interface RightRailApi {
  mount: HTMLElement | null
  setFilled: (b: boolean) => void
  setTitle: (t: string) => void
  open: boolean
  setOpen: (b: boolean) => void
}

const RightRailContext = createContext<RightRailApi>({
  mount: null,
  setFilled: () => {},
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

export default function RightRail({ children }: { children: React.ReactNode }) {
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [filled, setFilled] = useState(false)
  const [title, setTitle] = useState('Panel')
  const [open, setOpen] = useState(false)

  return (
    <RightRailContext.Provider value={{ mount, setFilled, setTitle, open, setOpen }}>
      <div className="lg:mr-[420px]">{children}</div>

      {/* Botón de apertura — solo en mobile/tablet cuando está cerrado.
          Sin transform para no crear capa GPU. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir panel"
          className="lg:hidden fixed right-0 z-40 flex flex-col items-center gap-1 px-2 py-3 rounded-l-xl shadow-lg"
          style={{
            top: 'calc(50vh - 44px)',
            backgroundColor: S.card,
            border: `1px solid ${S.border}`,
            borderRight: 'none',
            color: S.text,
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {filled && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: S.accent }} />}
        </button>
      )}

      {/* Overlay mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Drawer mobile: solo existe en DOM cuando está abierto → sin capa GPU permanente */}
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

      {/* Rail desktop: usa lg:fixed — en mobile NO tiene position:fixed → sin capa GPU */}
      <aside
        className="hidden lg:flex lg:fixed flex-col top-0 right-0 h-screen w-[420px] z-[41]"
        style={{ backgroundColor: S.card, borderLeft: `1px solid ${S.border}` }}>
        <AsideBody
          setMount={setMount}
          filled={filled}
          title={title}
          onClose={() => setOpen(false)}
          showClose={false}
        />
      </aside>
    </RightRailContext.Provider>
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
