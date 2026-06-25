'use client'

// POST /api/auth escribe la cookie httpOnly admin_session en éxito.
// Soporta registro de nuevas cuentas desde la misma pantalla (tab "Crear cuenta").
import { useState, useEffect } from 'react'

type Tab = 'login' | 'register'

const STORAGE_KEY = 'admin_remembered_name'

function validatePassword(pw: string) {
  if (pw.length < 12) return 'La contraseña debe tener al menos 12 caracteres'
  if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(pw)) return 'La contraseña debe incluir letras'
  if (!/[0-9]/.test(pw)) return 'La contraseña debe incluir números'
  return ''
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [returnUser, setReturnUser] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logo, setLogo] = useState('/logo-portales.svg')
  const [brandName, setBrandName] = useState('Restaurante')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { setName(saved); setReturnUser(true) }
    fetch('/api/settings?key=profile_logo').then(r => r.json()).then(d => { if (d?.value) setLogo(d.value) }).catch(() => {})
    fetch('/api/settings?key=restaurant_name').then(r => r.json()).then(d => { if (d?.value) setBrandName(d.value) }).catch(() => {})
  }, [])

  const INPUT = 'w-full rounded-2xl px-4 py-3.5 text-white text-sm transition-colors focus:outline-none'
  const inputStyle = { backgroundColor: '#0a0e1c', border: '1px solid rgba(0,230,118,0.3)' }

  function switchTab(t: Tab) { setTab(t); setError(''); setConfirmPassword('') }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !password) { setError('Completa todos los campos'); return }
    if (tab === 'register') {
      const words = name.trim().split(/\s+/)
      if (words.length < 2) { setError('Ingresa tu nombre completo (nombre y apellido)'); return }
      if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
      const pwErr = validatePassword(password)
      if (pwErr) { setError(pwErr); return }
    }
    localStorage.setItem(STORAGE_KEY, name.trim())
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab === 'login' ? 'login' : 'register', name: name.trim(), password }),
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

      {/* Brand */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,var(--ad-accent),#06b6d4)' }}>
          <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
        </div>
        <div className="font-extrabold text-xl tracking-wide" style={{ color: 'var(--ad-text)' }}>{brandName}</div>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--ad-accent)' }}>Panel de administración</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}>

        {/* Tabs — solo visibles para usuarios nuevos */}
        {returnUser ? (
          <p className="text-sm font-black text-center pt-4 pb-1" style={{ color: 'var(--ad-accent)' }}>Iniciar sesión</p>
        ) : (
          <div className="flex p-1.5 gap-1.5 m-4 rounded-2xl" style={{ backgroundColor: 'var(--ad-bg)' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={tab === t
                  ? { backgroundColor: 'var(--ad-accent)', color: '#000' }
                  : { color: 'var(--ad-sub)' }}>
                {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Nombre completo</label>
            <input id="admin-username" name="username" type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej. Carlos López" autoComplete="name" autoFocus
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)'} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Contraseña</label>
            <input id="admin-password" name="password" type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Mín. 12 caracteres con letras y números" autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)'} />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Confirmar contraseña</label>
              <input id="admin-confirm-password" name="confirm_password" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                placeholder="Repite la contraseña" autoComplete="new-password"
                className={INPUT} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)'} />
            </div>
          )}

          {returnUser && (
            <button type="button"
              onClick={() => { setReturnUser(false); switchTab('register'); setName(''); setPassword(''); setConfirmPassword('') }}
              className="w-full text-xs text-center py-1" style={{ color: 'var(--ad-sub)' }}>
              ¿Cuenta nueva? Registrarse
            </button>
          )}

          {error && (
            <div className="border rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
              style={{ backgroundColor: '#2d0a0a', borderColor: '#7f1d1d' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors mt-1"
            style={{ backgroundColor: 'var(--ad-accent)', color: '#000' }}>
            {loading ? 'Cargando...' : tab === 'login' ? '→ Entrar' : '→ Crear cuenta'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--ad-sub)' }}>Solo para uso del personal autorizado</p>
    </div>
  )
}
