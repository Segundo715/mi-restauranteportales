'use client'

import { useState } from 'react'

export default function AdminInitPage() {
  const [name, setName]         = useState('restaurantelosportales')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !password) { setError('Completa todos los campos'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        setTimeout(() => { window.location.href = '/admin' }, 1500)
      } else {
        setError(data.error ?? 'Error')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const INPUT = 'w-full rounded-2xl px-4 py-3.5 text-white text-sm transition-colors focus:outline-none'
  const inputStyle = { backgroundColor: '#0a0e1c', border: '1px solid rgba(232,145,42,0.3)' }

  if (done) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--ad-bg)' }}>
        <p className="text-xl font-black" style={{ color: 'var(--ad-accent)' }}>¡Cuenta creada!</p>
        <p className="text-sm mt-2" style={{ color: 'var(--ad-sub)' }}>Entrando al panel...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5" style={{ backgroundColor: 'var(--ad-bg)' }}>

      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="font-extrabold text-xl tracking-wide" style={{ color: 'var(--ad-text)' }}>Primer inicio</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ad-sub)' }}>Crea tu cuenta de administrador</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Usuario</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="usuario" autoComplete="username" autoFocus
              className={INPUT} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(232,145,42,0.3)'} />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-sub)' }}>Contraseña</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Elige una contraseña segura" autoComplete="new-password"
                className={INPUT + ' pr-12'} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--ad-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(232,145,42,0.3)'} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: 'var(--ad-sub)' }} aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
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
            {loading ? 'Creando...' : 'Crear cuenta y entrar'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-6 text-center max-w-xs" style={{ color: 'var(--ad-sub)' }}>
        Esta página solo funciona una vez. Después desaparece automáticamente.
      </p>
    </div>
  )
}
