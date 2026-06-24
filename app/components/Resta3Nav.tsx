'use client'

// Sidebar de RESTA3. Usa BrandProvider (vía useBrand) para mostrar el logo
// y nombre del restaurante igual que el admin. Mismas CSS vars --ad-* para tema coherente.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminThemeToggle from '@/app/components/AdminThemeToggle'
import { useBrand } from '@/app/components/BrandProvider'

const LINKS = [
  { href: '/resta3',            icon: 'dashboard', label: 'Dashboard',    exact: true },
  { href: '/resta3/tpv',        icon: 'tpv',       label: 'TPV / Caja' },
  { href: '/resta3/mesas',      icon: 'mesas',      label: 'Mesas' },
  { href: '/resta3/cocina',     icon: 'cocina',     label: 'Cocina' },
  { href: '/resta3/domicilios', icon: 'domicilios', label: 'Domicilios' },
  { href: '/resta3/inventario', icon: 'inventario', label: 'Inventario' },
  { href: '/resta3/compras',    icon: 'compras',    label: 'Compras' },
  { href: '/resta3/empleados',  icon: 'empleados',  label: 'Empleados' },
  { href: '/resta3/menu',       icon: 'menu',       label: 'Menú' },
  { href: '/resta3/reportes',   icon: 'reportes',   label: 'Reportes' },
  { href: '/resta3/corte',      icon: 'corte',      label: 'Corte de Caja' },
  { href: '/resta3/tv',         icon: 'tv',         label: 'Pantalla TV' },
]

const ICONS: Record<string, string> = {
  dashboard:  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  tpv:        '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  menu:       '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  tv:         '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  mesas:      '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
  cocina:     '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  domicilios: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  inventario: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  compras:    '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  empleados:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  reportes:   '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  corte:      '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h.01M11 15h2"/>',
  logout:     '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
}

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }} />
  )
}

const LINK_FEATURE: Record<string, string> = {
  tpv: 'r3_tpv', mesas: 'r3_mesas', cocina: 'r3_cocina',
  inventario: 'r3_inventario', compras: 'r3_compras',
  empleados: 'r3_empleados', reportes: 'r3_reportes',
}

function contrastText(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return '#000'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#000' : '#fff'
}

export default function Resta3Nav() {
  const router = useRouter()
  const [pathname, setPathname] = useState('')
  const [open, setOpen] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [subtitle, setSubtitle] = useState('Dirección General')
  const brand = useBrand()

  const brandName = brand.name || 'RESTA3'
  const brandLogo = brand.logo || '/logo.png'
  const accentColor = brand.accent || 'var(--ad-accent)'
  const accentText = contrastText(brand.accent)

  useEffect(() => {
    setPathname(window.location.pathname)
    const fetchFlags = () =>
      fetch('/api/resta3/features').then(r => r.json()).then(setFlags).catch(() => {})
    fetchFlags()
    window.addEventListener('focus', fetchFlags)
    fetch('/api/settings?key=admin_subtitle')
      .then(r => r.json())
      .then(d => { if (d?.value) setSubtitle(d.value) })
      .catch(() => {})
    return () => window.removeEventListener('focus', fetchFlags)
  }, [])

  function isEnabled(icon: string): boolean {
    const fid = LINK_FEATURE[icon]
    return fid ? (flags[fid] ?? true) : true
  }

  async function logout() {
    await fetch('/api/resta3/auth', { method: 'DELETE' })
    router.push('/resta3/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const S = {
    sidebar: { backgroundColor: 'var(--ad-sidebar)', borderRight: '1px solid var(--ad-border)' },
    text:    { color: 'var(--ad-text)' },
    sub:     { color: 'var(--ad-sub)' },
    border:  { borderTop: '1px solid var(--ad-border)' },
    overlay: { backgroundColor: 'var(--ad-overlay)' },
  }

  const sidebar = (
    <div className="flex flex-col h-full" style={S.sidebar}>
      {/* Logo — misma estructura que AdminNav */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
          <img src={brandLogo} alt="" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-wide" style={S.text}>{brandName}</div>
          <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--ad-sub)' }}>{subtitle}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {LINKS.map(link => {
          const active = isActive(link.href, link.exact)
          const enabled = isEnabled(link.icon)
          if (!enabled) return null
          return (
            <a key={link.href} href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { backgroundColor: accentColor, color: accentText }
                : { color: 'var(--ad-sub)' }}>
              <NavIcon name={link.icon} />
              <span className="flex-1">{link.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={S.border}>
        <div className="flex items-center gap-3 p-2 rounded-lg mb-1" style={S.overlay}>
          <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,var(--ad-accent),#06b6d4)` }}>
            <img src={brandLogo} alt="" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={S.text}>{brandName}</div>
            <div className="text-xs" style={{ color: 'var(--ad-sub)' }}>RP</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: 'var(--ad-sub)' }}>
          <NavIcon name="logout" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Agencia + toggle (escritorio) */}
      <div className="hidden md:flex fixed top-4 right-4 z-[100] items-center gap-2">
        <img src="/L_agencia/logo_singular.svg" alt="Singular" className="ad-logo h-5 w-auto pointer-events-none" />
        <AdminThemeToggle />
      </div>

      {/* Topbar mobile */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--ad-sidebar)', borderBottom: '1px solid var(--ad-border)' }}>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2.5">
          <div className="flex flex-col gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="block h-0.5 rounded-full w-5" style={{ backgroundColor: 'var(--ad-text)' }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={brandLogo} alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-sm" style={S.text}>{brandName}</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <img src="/L_agencia/logo_singular.svg" alt="Singular" className="ad-logo h-5 w-auto" />
          <AdminThemeToggle />
        </div>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-[240px]">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-200 ${open ? 'visible' : 'invisible pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black transition-opacity duration-200 ${open ? 'opacity-60' : 'opacity-0'}`}
          onClick={() => setOpen(false)} />
        <aside className={`relative w-64 h-full shadow-2xl transform transition-transform duration-250 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebar}
        </aside>
      </div>
    </>
  )
}
