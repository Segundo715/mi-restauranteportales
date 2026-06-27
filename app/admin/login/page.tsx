'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'admin_remembered_name'

export default function LoginPage() {
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [logo, setLogo]         = useState('/logo-portales.svg')
  const [brandName, setBrandName] = useState('Restaurante')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setName(saved)
    fetch('/api/settings?key=profile_logo').then(r => r.json()).then(d => { if (d?.value) setLogo(d.value) }).catch(() => {})
    fetch('/api/settings?key=restaurant_name').then(r => r.json()).then(d => { if (d?.value) setBrandName(d.value) }).catch(() => {})
  }, [])

  const INPUT = 'w-full rounded-2xl px-4 py-3.5 text-white text-sm transition-colors focus:outline-none'
  const inputStyle = { backgroundColor: '#0a0e1c', border: '1px solid color-mix(in srgb, var(--ad-accent) 30%, transparent)' }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !password) { setError('Completa todos los campos'); return }
    localStorage.setItem(STORAGE_KEY, name.trim())
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', name: name.trim(), password }),
      })
      const data = await res.json()
      if (res.ok) window.location.href = '/admin'
      else setError(data.error ?? 'Error')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5" style={{ backgroundColor: 'var(--ad-sidebar)' }}>

      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden"
          style={{ background: '#E8912A' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
        </div>
        <div className="font-extrabold text-xl tracking-wide" style={{ color: 'var(--ad-text)' }}>{brandName}</div>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--ad-accent)' }}>Panel de administración</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}>

        <p className="text-sm font-black text-center pt-4 pb-1" style={{ color: 'var(--ad-accent)' }}>Iniciar sesión</p>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Usuario</label>
            <input id="admin-username" name="username" type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Tu nombre de usuario" autoComplete="username" autoFocus
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--ad-accent) 30%, transparent)'} />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Contraseña</label>
            <div className="relative">
              <input id="admin-password" name="password" type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Contraseña" autoComplete="current-password"
                className={INPUT + ' pr-12'} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--ad-accent) 30%, transparent)'} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: 'var(--ad-sub)' }} aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="border rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
              style={{ backgroundColor: '#2d0a0a', borderColor: '#7f1d1d' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors mt-1"
            style={{ backgroundColor: 'var(--ad-accent)', color: '#000' }}>
            {loading ? 'Cargando...' : '→ Entrar'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--ad-sub)' }}>Solo para uso del personal autorizado</p>
    </div>
  )
}
