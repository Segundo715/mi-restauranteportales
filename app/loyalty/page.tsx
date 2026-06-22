'use client'

// Login/registro de cuenta de cliente (nombre + contraseña vía /api/customer-auth).
// Si loyalty_id ya existe en localStorage, redirige directo a /menu sin mostrar el formulario.
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'login' | 'register'

const INPUT = 'w-full border border-[#B90F45]/40 rounded-2xl px-4 py-3.5 text-white bg-[#1a1a1a] placeholder-gray-500 focus:outline-none focus:border-[#B90F45] text-sm transition-colors'

export default function LoyaltyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('loyalty_id')) router.replace('/menu')
  }, [router])

  async function handleSubmit() {
    if (!name.trim() || !password) { setError('Completa todos los campos'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab, name: name.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      localStorage.setItem('loyalty_id', data.id)
      router.push('/menu')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-5" style={{ backgroundColor: '#000000' }}>
      {/* Logo + nombre */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Logo" className="h-20 w-auto mx-auto mb-3" />
        <h1 className="text-white text-2xl font-black tracking-widest">NICHO</h1>
        <p className="text-sm font-medium mt-1" style={{ color: '#B90F45' }}>5 visitas = 1 café gratis</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
        {/* Tabs */}
        <div className="flex p-1.5 gap-1.5 m-4 rounded-2xl" style={{ backgroundColor: '#1a1a1a' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} type="button"
              onClick={() => { setTab(t); setError('') }}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={tab === t
                ? { backgroundColor: '#B90F45', color: '#fff' }
                : { color: '#6b7280' }}>
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Nombre</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej. María González" autoComplete="username" className={INPUT} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Contraseña</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••" autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className={INPUT} />
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
              style={{ backgroundColor: '#2d0a0a', border: '1px solid #7f1d1d' }}>{error}</div>
          )}

          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="w-full text-white font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors mt-1"
            style={{ backgroundColor: '#B90F45' }}>
            {submitting ? 'Cargando...' : tab === 'login' ? '☕ Entrar a NICHO' : '☕ Unirme a NICHO'}
          </button>
        </div>
      </div>
    </div>
  )
}
