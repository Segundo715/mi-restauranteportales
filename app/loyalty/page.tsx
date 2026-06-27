'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LS_ID     = 'loyalty_id'
const LS_NAME   = 'nicho_last_customer_name'
const LS_ACCENT = 'cfg_accent'
const LS_LOGO   = 'cfg_logo'
const LS_BRAND  = 'cfg_brand'

const INPUT = 'w-full border rounded-2xl px-4 py-3.5 text-white bg-[#1a1a1a] placeholder-gray-500 focus:outline-none text-sm transition-colors'

export default function LoyaltyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logo, setLogo] = useState('/logo.png')
  const [brandName, setBrandName] = useState('NICHO')
  const [accent, setAccent] = useState('#B90F45')

  useEffect(() => {
    if (localStorage.getItem(LS_ID)) { router.replace('/menu'); return }
    const savedName = localStorage.getItem(LS_NAME)
    if (savedName) { setName(savedName) }
    const ca = localStorage.getItem(LS_ACCENT); if (ca) setAccent(ca)
    const cl = localStorage.getItem(LS_LOGO);   if (cl) setLogo(cl)
    const cn = localStorage.getItem(LS_BRAND);  if (cn) setBrandName(cn)
    fetch('/api/settings?key=profile_logo').then(r => r.json()).then(d => { if (d?.value) { setLogo(d.value); localStorage.setItem(LS_LOGO, d.value) } }).catch(() => {})
    fetch('/api/settings?key=restaurant_name').then(r => r.json()).then(d => { if (d?.value) { setBrandName(d.value); localStorage.setItem(LS_BRAND, d.value) } }).catch(() => {})
    fetch('/api/settings?key=sidebar_accent').then(r => r.json()).then(d => { if (d?.value) { setAccent(d.value); localStorage.setItem(LS_ACCENT, d.value) } }).catch(() => {})
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
      localStorage.setItem(LS_NAME, name.trim())
      localStorage.setItem(LS_ID, data.id)
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
        <img src={logo} alt="Logo" className="h-20 w-auto mx-auto mb-3" />
        <h1 className="text-white text-2xl font-black tracking-widest">{brandName}</h1>
        <p className="text-sm font-medium mt-1" style={{ color: accent }}>5 visitas = 1 café gratis</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>

        <div className="flex border-b" style={{ borderColor: '#1a1a1a' }}>
          <button type="button" onClick={() => { setTab('login'); setError('') }}
            className="flex-1 py-3 text-sm font-black transition-colors"
            style={{ color: tab === 'login' ? accent : '#555', borderBottom: tab === 'login' ? `2px solid ${accent}` : '2px solid transparent' }}>
            Iniciar sesión
          </button>
          <button type="button" onClick={() => { setTab('register'); setError('') }}
            className="flex-1 py-3 text-sm font-black transition-colors"
            style={{ color: tab === 'register' ? accent : '#555', borderBottom: tab === 'register' ? `2px solid ${accent}` : '2px solid transparent' }}>
            Crear cuenta
          </button>
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
            style={{ backgroundColor: accent }}>
            {submitting ? 'Cargando...' : tab === 'login' ? '☕ Entrar a NICHO' : '☕ Unirme a NICHO'}
          </button>

        </div>
      </div>
    </div>
  )
}
