'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [logo, setLogo]           = useState('/logo-portales.svg')
  const [brandName, setBrandName] = useState('Restaurante Portales')
  const [accent, setAccent]       = useState('#E8912A')

  useEffect(() => {
    fetch('/api/settings?key=profile_logo').then(r => r.json()).then(d => { if (d?.value) setLogo(d.value) }).catch(() => {})
    fetch('/api/settings?key=restaurant_name').then(r => r.json()).then(d => { if (d?.value) setBrandName(d.value) }).catch(() => {})
    fetch('/api/settings?key=sidebar_accent').then(r => r.json()).then(d => { if (d?.value) setAccent(d.value) }).catch(() => {})
  }, [])

  const portals = [
    {
      label: 'Admin',
      sub:   'Panel de administración',
      href:  '/admin/login',
      icon:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    },
    {
      label: 'Resta3',
      sub:   'Panel del restaurante',
      href:  '/resta3/login',
      icon:  'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
    },
    {
      label: 'Empleado',
      sub:   'Acceso para el equipo',
      href:  '/employee/login',
      icon:  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ backgroundColor: '#0d0d0d' }}>
      <div className="w-full max-w-xs space-y-8">

        {/* Logo y nombre */}
        <div className="text-center space-y-3">
          <img src={logo} alt={brandName} className="h-16 w-auto mx-auto object-contain" />
          <h1 className="text-xl font-black text-white">{brandName}</h1>
          <p className="text-xs" style={{ color: '#555' }}>Selecciona tu acceso</p>
        </div>

        {/* Botones de acceso */}
        <div className="space-y-3">
          {portals.map(p => (
            <a key={p.href} href={p.href}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all active:scale-95"
              style={{ backgroundColor: '#1a1a1a', border: '1.5px solid #2a2a2a' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}18` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent}
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={p.icon} />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-white">{p.label}</p>
                <p className="text-xs" style={{ color: '#555' }}>{p.sub}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
