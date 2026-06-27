'use client'

// Tarjeta de fidelidad estándar. Usa loyalty_card_id en localStorage como identificador;
// si no existe, redirige al flujo de registro (/registro).
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import CustomerNav from '@/app/components/CustomerNav'
import { RewardIcon } from '@/app/components/RewardIcon'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

const STORAGE_KEY = 'loyalty_card_id'
const CATEGORIES_KEY = 'reward_categories'

// Config por defecto de la "Tarjeta de Café" (se sobreescribe desde /admin/tarjetas)
const DEFAULT_CAFE = {
  name: 'Tarjeta de Café', reward: 'Café gratis', goal: 5, icon: 'coffee', color: '#E8912A',
  iconColor: '#ffffff', logo: '/logo-portales.svg', image: '/uploads/menu/SalmonBowl.jpeg',
  brandText: 'Los Portales', brandLogo: '',
}

interface CafeConfig {
  name: string; reward: string; goal: number; icon: string; color: string
  iconColor: string; logo: string; image: string; brandText: string; brandLogo: string
}

interface Customer {
  id: string; name: string; phone: string; visits: number; active: boolean; confirmed: boolean
}

type Step = 'loading' | 'form' | 'waiting' | 'card'

const INPUT = 'w-full border border-[#E8912A]/40 rounded-2xl px-4 py-3.5 text-white bg-[#1a1a1a] placeholder-gray-500 focus:outline-none focus:border-[#E8912A] text-sm transition-colors'

export default function CardPage() {
  const [step, setStep] = useState<Step>('loading')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cfg, setCfg] = useState<CafeConfig>(DEFAULT_CAFE)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      fetch(`/api/loyalty/${saved}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setCustomer(data)
            setStep(data.active ? 'card' : 'waiting')
          } else {
            // Tarjeta eliminada — limpiar localStorage y mostrar formulario
            localStorage.removeItem(STORAGE_KEY)
            setStep('form')
          }
        })
        .catch(() => { setStep('form') })
    } else {
      setStep('form')
    }
    // Cargar parámetros de la categoría "Tarjeta de Café" desde /admin/tarjetas
    fetch(`/api/settings?key=${CATEGORIES_KEY}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.value) return
        const list = JSON.parse(d.value)
        const cafe = Array.isArray(list) ? (list.find((c: CafeConfig & { id: string }) => c.id === 'cafe') ?? list[0]) : null
        if (cafe) setCfg({
          name: cafe.name ?? DEFAULT_CAFE.name,
          reward: cafe.reward ?? DEFAULT_CAFE.reward,
          goal: Math.max(1, Math.round(cafe.goal) || DEFAULT_CAFE.goal),
          icon: cafe.icon ?? DEFAULT_CAFE.icon,
          color: cafe.color ?? DEFAULT_CAFE.color,
          iconColor: cafe.iconColor || DEFAULT_CAFE.iconColor,
          logo: cafe.logo || DEFAULT_CAFE.logo,
          image: cafe.image || DEFAULT_CAFE.image,
          brandText: cafe.brandText || DEFAULT_CAFE.brandText,
          brandLogo: cafe.brandLogo || DEFAULT_CAFE.brandLogo,
        })
      })
      .catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setError('Completa todos los campos'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), cardType: 'cafe' }),
      })
      if (res.ok) {
        const data: Customer = await res.json()
        localStorage.setItem(STORAGE_KEY, data.id)
        setCustomer(data)
        setStep(data.active ? 'card' : 'waiting')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al registrar')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // Pantalla de espera — pollea hasta que el admin active la tarjeta
  useEffect(() => {
    if (step !== 'waiting' || !customer) return
    const id = setInterval(() => {
      fetch(`/api/loyalty/${customer.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.active) { setCustomer(data); setStep('card') } })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, customer?.id])

  if (step === 'loading') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#000' }}>
        <img src={cfg.logo} alt="Logo" className="h-20 w-auto mx-auto mb-4 animate-pulse" />
        <p className="text-sm" style={{ color: '#555' }}>Verificando...</p>
      </div>
    )
  }

  if (step === 'waiting') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#000' }}>
        <img src={cfg.logo} alt="Logo" className="h-20 w-auto mx-auto mb-6" />
        <div className="w-full max-w-sm rounded-3xl p-8 text-center space-y-4" style={{ backgroundColor: '#0d0d0d', border: `1px solid ${cfg.color}` }}>
          <div className="text-5xl animate-pulse">⏳</div>
          <h2 className="text-xl font-black text-white">Registro recibido</h2>
          <p className="text-sm" style={{ color: '#aaa' }}>
            Hola <span className="font-bold text-white">{customer?.name?.split(' ')[0]}</span>, tu solicitud fue enviada.
          </p>
          <p className="text-xs" style={{ color: cfg.color }}>
            El administrador activará tu tarjeta en breve. Esta página se actualizará automáticamente.
          </p>
          <div className="flex justify-center gap-1 pt-2">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: cfg.color, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-5" style={{ backgroundColor: '#000' }}>
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.logo} alt="Logo" className="h-20 w-auto mx-auto mb-3" />
          <p className="text-sm font-medium inline-flex items-center gap-1.5 justify-center" style={{ color: cfg.color }}>
            {cfg.goal} visitas = {cfg.reward}
            <RewardIcon name={cfg.icon} size={16} style={{ color: cfg.iconColor }} />
          </p>
        </div>

        <div className="w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-3" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <p className="text-center text-xs font-bold uppercase tracking-widest pb-1" style={{ color: cfg.color }}>Accede a tu tarjeta</p>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Nombre</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej. María González" autoFocus className={INPUT} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Teléfono</label>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError('') }}
              placeholder="Ej. 55 1234 5678" className={INPUT} />
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm font-medium text-red-300"
              style={{ backgroundColor: '#2d0a0a', border: '1px solid #7f1d1d' }}>{error}</div>
          )}

          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="w-full text-white font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors"
            style={{ backgroundColor: cfg.color }}>
            {submitting ? 'Cargando...' : 'Ver mi tarjeta'}
          </button>
        </div>

        <CustomerNav active="card" />
      </div>
    )
  }

  const visits = customer?.visits ?? 0
  const earned = visits >= cfg.goal
  const lightColor = `color-mix(in srgb, ${cfg.color} 55%, #fff)`
  const cardGradient = `linear-gradient(135deg, color-mix(in srgb, ${cfg.color} 25%, #000) 0%, ${cfg.color} 60%, ${lightColor} 100%)`

  // Estilos compartidos por las dos caras de la tarjeta (flip 3D)
  const faceStyle: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    background: cardGradient,
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#000' }}>
      <div className="flex flex-col items-center px-4 pt-6">
        {/* ── TARJETA QUE GIRA ── */}
        <div className="w-full max-w-sm" style={{ perspective: '1600px' }}>
          <div role="button" tabIndex={0}
            onClick={() => setFlipped(f => !f)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) } }}
            aria-label="Girar tarjeta"
            className="relative w-full transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              height: '460px',
            }}>

            {/* ───────── CARA FRONTAL (diseño original) ───────── */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={faceStyle}>
              {/* Logo + marca */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.logo} alt="Logo" className="h-10 w-auto object-contain" />
                {cfg.brandLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={cfg.brandLogo} alt="Marca" className="h-8 w-auto object-contain" />
                  : <span className="text-white font-black text-base tracking-wide">{cfg.brandText}</span>}
              </div>

              {/* Imagen con sellos superpuestos */}
              <div className="relative" style={{ height: '170px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-3 px-6">
                  {Array.from({ length: cfg.goal }).map((_, i) => {
                    const filled = i < visits
                    return (
                      <div key={i}
                        className="flex-1 aspect-square rounded-full flex items-center justify-center border-2 transition-all"
                        style={{
                          backgroundColor: filled ? cfg.color : 'rgba(255,255,255,0.18)',
                          borderColor: filled ? 'white' : 'rgba(255,255,255,0.45)',
                          backdropFilter: 'blur(3px)',
                          boxShadow: filled ? `0 0 14px ${cfg.color}` : 'none',
                        }}>
                        {filled && <RewardIcon name={cfg.icon} className="w-3/4 h-3/4" style={{ color: cfg.iconColor }} />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Oferta + contador sellos */}
              <div className="flex items-start gap-3 px-5 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: lightColor }}>Oferta de recompensa</p>
                  <p className="text-white text-sm font-semibold mt-0.5 inline-flex items-center gap-1.5">
                    Cada {cfg.goal} visitas: {cfg.reward}
                    <RewardIcon name={cfg.icon} size={15} style={{ color: cfg.iconColor }} />
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: lightColor }}>Sellos · Premios</p>
                  <p className="text-white text-sm font-black mt-0.5">
                    {visits}/{cfg.goal} · {earned ? '1' : '0'}
                  </p>
                </div>
              </div>

              {/* Pista para girar */}
              <div className="flex items-center justify-center gap-1.5 pb-4 mt-auto text-white/80 text-xs font-semibold">
                <span>Toca para ver tu código</span>
                <span aria-hidden className="text-base leading-none">↻</span>
              </div>
            </div>

            {/* ───────── CARA TRASERA: QR + nombre del titular ───────── */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
              {/* Logo centrado arriba */}
              <div className="flex justify-center pt-4 pb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.logo} alt="Logo" className="h-9 w-auto object-contain" />
              </div>

              {/* Cinta magnética (decorativa, sin función) */}
              <div aria-hidden className="w-full h-11" style={{ backgroundColor: '#000' }} />

              {/* Nombre grande pegado a la orilla */}
              <p className="text-white text-3xl font-black leading-tight px-5 pt-4 truncate">{customer?.name}</p>

              {/* QR centrado con el aviso justo encima */}
              <div className="flex-1 flex flex-col items-center justify-center px-5">
                <p className="text-sm font-semibold text-center text-white mb-3">
                  {earned ? `🎉 ¡${cfg.reward}! Muéstraselo al cajero` : 'Muestra este QR al empleado'}
                </p>
                <div className="bg-white rounded-2xl p-4 flex flex-col items-center w-full max-w-[230px]">
                  <QRCode value={customer!.id} size={150} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
                </div>
              </div>

              {/* Pista para girar */}
              <div className="flex items-center justify-center gap-1.5 pb-4 text-white/80 text-xs font-semibold">
                <span aria-hidden className="text-base leading-none">↻</span>
                <span>Toca para volver</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center max-w-sm mt-4" style={{ color: '#666' }}>
          Toca la tarjeta para girarla.
        </p>
      </div>

      <CustomerNav active="card" />
    </div>
  )
}
