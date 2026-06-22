'use client'

// Login de RESTA3 — misma estructura visual que /admin/login.
// Lee resta3_accent / resta3_logo / resta3_name con fallback a settings del admin.
// Cookie: resta3_session (independiente de admin_session).
import { useState, useEffect } from 'react'

type Tab = 'login' | 'register'

const STORAGE_KEY = 'r3_remembered_name'

function validatePassword(pw: string) {
  if (pw.length < 12) return 'La contraseña debe tener al menos 12 caracteres'
  if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(pw)) return 'La contraseña debe incluir letras'
  if (!/[0-9]/.test(pw)) return 'La contraseña debe incluir números'
  return ''
}

export default function Resta3LoginPage() {
  const [tab, setTab]                     = useState<Tab>('login')
  const [name, setName]                   = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remember, setRemember]           = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  // Branding dinámico
  const [accent, setAccent]       = useState('#00e676')
  const [logo, setLogo]           = useState('/logo.png')
  const [brandName, setBrandName] = useState('RESTA3')
  const [brandSub, setBrandSub]   = useState('Panel de gestión')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { setName(saved); setRemember(true) }

    const keys = ['resta3_accent', 'resta3_logo', 'resta3_name', 'sidebar_accent', 'profile_logo', 'restaurant_name']
    Promise.all(keys.map(k => fetch(`/api/settings?key=${k}`).then(r => r.json()))).then(res => {
      const [r3a, r3l, r3n, a, l, n] = res.map((d: { value?: string }) => d.value ?? '')
      if (r3a || a) setAccent(r3a || a)
      if (r3l || l) setLogo(r3l || l)
      if (r3n || n) {
        setBrandName(r3n || n)
        if (r3n && n && r3n !== n) setBrandSub(n)
      }
    })
  }, [])

  function switchTab(t: Tab) { setTab(t); setError(''); setConfirmPassword('') }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!name.trim() || !password) { setError('Completa todos los campos'); return }
    if (tab === 'register') {
      const words = name.trim().split(/\s+/)
      if (words.length < 2) { setError('Ingresa tu nombre completo (nombre y apellido)'); return }
      if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
      const pwErr = validatePassword(password)
      if (pwErr) { setError(pwErr); return }
    }
    if (remember) localStorage.setItem(STORAGE_KEY, name.trim())
    else localStorage.removeItem(STORAGE_KEY)
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/resta3/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab, name: name.trim(), password }),
      })
      const data = await res.json()
      if (res.ok) window.location.href = '/resta3'
      else setError(data.error ?? 'Error')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const accentHex  = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#00e676'
  const borderIdle = `${accentHex}4d`

  const INPUT = 'w-full rounded-2xl px-4 py-3.5 text-sm transition-colors focus:outline-none'
  const inputStyle = { backgroundColor: 'var(--ad-elevated)', color: 'var(--ad-text)', border: `1px solid ${borderIdle}` }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5"
      style={{ backgroundColor: 'var(--ad-bg)' }}>

      {/* Brand */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden"
          style={{ background: `linear-gradient(135deg,${accentHex},#06b6d4)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
        </div>
        <div className="font-extrabold text-xl tracking-wide" style={{ color: 'var(--ad-text)' }}>{brandName}</div>
        <p className="text-sm mt-1 font-medium" style={{ color: accentHex }}>{brandSub}</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}>

        {/* Tabs */}
        <div className="flex p-1.5 gap-1.5 m-4 rounded-2xl" style={{ backgroundColor: 'var(--ad-elevated)' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} type="button" onClick={() => switchTab(t)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={tab === t
                ? { backgroundColor: accentHex, color: '#000' }
                : { color: 'var(--ad-sub)' }}>
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Nombre completo</label>
            <input id="r3-username" name="username" type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej. Carlos López" autoComplete="name" autoFocus
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = accentHex}
              onBlur={e => e.currentTarget.style.borderColor = borderIdle} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Contraseña</label>
            <input id="r3-password" name="password" type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Mín. 12 caracteres con letras y números" autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = accentHex}
              onBlur={e => e.currentTarget.style.borderColor = borderIdle} />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Confirmar contraseña</label>
              <input id="r3-confirm-password" name="confirm_password" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                placeholder="Repite la contraseña" autoComplete="new-password"
                className={INPUT} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = accentHex}
                onBlur={e => e.currentTarget.style.borderColor = borderIdle} />
            </div>
          )}

          {/* Recordarme */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded" style={{ accentColor: accentHex }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ad-sub)' }}>Recordarme</span>
          </label>

          {error && (
            <div className="border rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
              style={{ backgroundColor: '#2d0a0a', borderColor: '#7f1d1d' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors mt-1"
            style={{ backgroundColor: accentHex, color: '#000' }}>
            {loading ? 'Cargando...' : tab === 'login' ? '→ Entrar' : '→ Crear cuenta'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--ad-sub)' }}>Solo para uso del personal autorizado</p>
    </div>
  )
}
