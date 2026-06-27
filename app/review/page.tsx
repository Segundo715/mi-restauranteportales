'use client'

// Feed público de reseñas aprobadas (rating >= 4). A diferencia de /resena,
// todas las calificaciones se guardan en /api/reviews y se muestran en pantalla.
import { useState, useEffect } from 'react'
import CustomerNav from '../components/CustomerNav'

interface Review {
  id: string; customerName: string; rating: number; comment: string; createdAt: string
}

const RATING_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
const RATING_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400']

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className={`text-4xl transition-all active:scale-90 ${
              i <= active ? 'text-yellow-400 scale-110' : 'text-gray-600'
            }`}>
            ★
          </button>
        ))}
      </div>
      {active > 0 && (
        <p className={`text-sm font-bold ${RATING_COLORS[active]}`}>{RATING_LABELS[active]}</p>
      )}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(rating)}<span className="text-gray-600">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

const AVATAR_BG = '#B90F45'

function avatarColor() {
  return AVATAR_BG
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [rating, setRating] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    setLoadingReviews(true)
    try {
      const r = await fetch('/api/reviews')
      if (r.ok) setReviews(await r.json())
    } finally {
      setLoadingReviews(false)
    }
  }

  async function submitReview() {
    setReviewError('')
    if (rating === 0) { setReviewError('Selecciona una calificación.'); return }
    if (!customerName.trim()) { setReviewError('El nombre es obligatorio.'); return }
    if (!comment.trim()) { setReviewError('El comentario es obligatorio.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, customerName: customerName.trim(), comment: comment.trim() }),
      })
      if (res.ok) {
        setReviewSuccess(true); setRating(0); setCustomerName(''); setComment('')
        loadReviews()
      } else {
        const d = await res.json()
        setReviewError(d.error ?? 'Error al enviar la reseña')
      }
    } catch {
      setReviewError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const INPUT = 'w-full border border-[#B90F45]/40 rounded-2xl px-4 py-3 text-white bg-[#1a1a1a] placeholder-gray-500 focus:outline-none focus:border-[#B90F45] text-sm transition-colors'

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-lg" style={{ backgroundColor: '#000000', borderBottom: '1px solid #B90F45' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-9 w-auto" />
          <h1 className="font-black text-base tracking-tight text-white">Reseñas</h1>
        </div>
      </div>

      {/* Rating summary */}
      {avg && (
        <div style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <span className="text-5xl font-black" style={{ color: '#B90F45' }}>{avg}</span>
            <div>
              <StarDisplay rating={Math.round(Number(avg))} />
              <p className="text-gray-400 text-xs mt-0.5">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* Form */}
        <section className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <div className="px-5 py-4" style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
            <h2 className="text-base font-black text-white">Deja tu reseña</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tu opinión nos ayuda a mejorar</p>
          </div>

          {reviewSuccess ? (
            <div className="p-8 text-center">
              <p className="text-5xl mb-3">🎉</p>
              <p className="font-black text-xl text-white">¡Gracias por tu reseña!</p>
              <p className="text-sm text-gray-400 mt-1">Tu opinión ya fue enviada</p>
              <button type="button" onClick={() => setReviewSuccess(false)}
                className="mt-4 text-sm font-semibold underline" style={{ color: '#B90F45' }}>
                Escribir otra reseña
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Calificación</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Tu nombre</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej. María González" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Comentario</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Cuéntanos tu experiencia..." rows={3}
                  className="w-full border border-[#B90F45]/40 rounded-2xl px-4 py-3 text-sm text-white bg-[#1a1a1a] placeholder-gray-500 focus:outline-none focus:border-[#B90F45] resize-none transition-colors" />
              </div>
              {reviewError && (
                <div className="border rounded-2xl px-4 py-3 text-sm font-medium text-red-300" style={{ backgroundColor: '#2d0a0a', borderColor: '#7f1d1d' }}>{reviewError}</div>
              )}
              <button type="button" onClick={submitReview} disabled={submitting}
                className="w-full text-white font-black py-4 rounded-2xl text-base disabled:opacity-60 transition-colors"
                style={{ backgroundColor: '#B90F45' }}>
                {submitting ? 'Enviando...' : '★ Enviar reseña'}
              </button>
            </div>
          )}
        </section>

        {/* Published reviews */}
        {loadingReviews ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: '#0d0d0d' }}>
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#1a1a1a' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: '#1a1a1a' }} />
                    <div className="h-3 rounded-full w-1/4" style={{ backgroundColor: '#1a1a1a' }} />
                  </div>
                </div>
                <div className="h-3 rounded-full w-full" style={{ backgroundColor: '#1a1a1a' }} />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-semibold text-white">Aún no hay reseñas</p>
            <p className="text-sm mt-1">¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-black text-gray-400 text-sm uppercase tracking-wide px-1">
              Lo que dicen nuestros clientes
            </h3>
            {reviews.map(review => (
              <div key={review.id} className="rounded-2xl p-4" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: avatarColor() }}>
                    {initial(review.customerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-white text-sm truncate">{review.customerName}</p>
                      <p className="text-xs text-gray-500 shrink-0">{fmtDate(review.createdAt)}</p>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pl-13">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerNav active="review" />
    </div>
  )
}
