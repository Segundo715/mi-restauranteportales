'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LS_KEY    = 'customer_session'
const LS_NAME   = 'customer_last_name'
const LS_ACCENT = 'cfg_accent'
const LS_LOGO   = 'cfg_logo'
const LS_BRAND  = 'cfg_brand'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [logo, setLogo]         = useState(() => typeof window !== 'undefined' ? (localStorage.getItem(LS_LOGO) || '/logo-portales.svg') : '/logo-portales.svg')
  const [brandName, setBrandName] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem(LS_BRAND) || 'Restaurante Portales') : 'Restaurante Portales')
  const [accent, setAccent]     = useState(() => typeof window !== 'undefined' ? (localStorage.getItem(LS_ACCENT) || '#E8912A') : '#E8912A')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const session = localStorage.getItem(LS_KEY)
    if (session) { router.replace('/menu'); return }
    const savedName = localStorage.getItem(LS_NAME)
    if (savedName) setName(savedName)
    fetch('/api/settings?key=profile_logo').then(r => r.json()).then(d => { if (d?.value) { setLogo(d.value); localStorage.setItem(LS_LOGO, d.value) } }).catch(() => {})
    fetch('/api/settings?key=restaurant_name').then(r => r.json()).then(d => { if (d?.value) { setBrandName(d.value); localStorage.setItem(LS_BRAND, d.value) } }).catch(() => {})
    fetch('/api/settings?key=sidebar_accent').then(r => r.json()).then(d => { if (d?.value) { setAccent(d.value); localStorage.setItem(LS_ACCENT, d.value) } }).catch(() => {})
  }, [router])

  async function handleSubmit() {
    if (!name.trim()) { setError('Ingresa tu nombre'); return }
    if (password.length !== 12) { setError('La contraseña debe tener exactamente 12 dígitos'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab, name: name.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); setLoading(false); return }
      localStorage.setItem(LS_NAME, name.trim())
      localStorage.setItem(LS_KEY, JSON.stringify(data))
      router.replace('/menu')
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-3">
          <img src={logo} alt={brandName} className="h-20 w-auto mx-auto object-contain" />
          <h1 className="text-2xl font-black text-white">{brandName}</h1>
        </div>

        <div className="rounded-3xl p-6 space-y-5" style={{ backgroundColor: '#1a1a1a', border: `1px solid ${accent}` }}>
          <div className="flex border-b" style={{ borderColor: '#333' }}>
            <button type="button" onClick={() => { setTab('login'); setError('') }}
              className="flex-1 py-3 text-sm font-black transition-colors"
              style={{ color: tab === 'login' ? accent : '#666', borderBottom: tab === 'login' ? `2px solid ${accent}` : '2px solid transparent' }}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => { setTab('register'); setError('') }}
              className="flex-1 py-3 text-sm font-black transition-colors"
              style={{ color: tab === 'register' ? accent : '#666', borderBottom: tab === 'register' ? `2px solid ${accent}` : '2px solid transparent' }}>
              Crear cuenta
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-widest">Nombre completo</label>
            <input type="text" value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-gray-600 outline-none"
              style={{ backgroundColor: '#111', border: '1.5px solid #333' }}
              autoComplete="name" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-widest">
              Contraseña <span style={{ color: accent }}>(12 dígitos)</span>
            </label>
            <input type="password" inputMode="numeric" value={password}
              onChange={e => { setPassword(e.target.value.replace(/\D/g, '').slice(0, 12)); setError('') }}
              placeholder="············"
              className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-gray-600 outline-none tracking-widest"
              style={{ backgroundColor: '#111', border: '1.5px solid #333' }}
              autoComplete="current-password" />
            <p className="text-xs" style={{ color: '#555' }}>{password.length}/12 dígitos</p>
          </div>

          {error && <p className="text-sm text-red-400 font-medium px-1">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-60 transition-all"
            style={{ backgroundColor: accent, color: '#000' }}>
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>

      </div>
    </div>
  )
}
