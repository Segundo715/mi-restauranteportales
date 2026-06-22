'use client'

// Las reseñas negativas (≤ 3★) tienen bad=true y disparan email al crearse; aquí solo se muestran/eliminan.
// Las buenas (≥ 4★) se pueden publicar/despublicar para que aparezcan en /review.
import { useState, useEffect } from 'react'
import AdminNav from '@/app/components/AdminNav'
import { Icon } from '@/app/components/Icon'

interface Review {
  id: string; customerName: string; rating: number; comment: string
  createdAt: string; published: boolean; bad: boolean
}

const S = {
  bg:     'var(--ad-bg)',
  card:   'var(--ad-card)',
  accent: 'var(--ad-accent)',
  text:   'var(--ad-text)',
  sub:    'var(--ad-sub)',
  border: 'var(--ad-border)',
}

function initial(name: string) { return name.trim().charAt(0).toUpperCase() }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? '#facc15' : 'rgba(255,255,255,0.15)' }}><Icon name="star" size={13} /></span>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'good' | 'bad'>('good')

  useEffect(() => { fetchReviews() }, [])

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews?all=1')
      if (res.ok) setReviews(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function togglePublish(review: Review) {
    await fetch(`/api/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !review.published }),
    })
    fetchReviews()
  }

  async function deleteReview(id: string) {
    if (!confirm('¿Eliminar esta reseña?')) return
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    fetchReviews()
  }

  const goodReviews = reviews.filter(r => !r.bad)
  const badReviews = reviews.filter(r => r.bad)
  const displayed = tab === 'good' ? goodReviews : badReviews

  const avgGood = goodReviews.length
    ? (goodReviews.reduce((s, r) => s + r.rating, 0) / goodReviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen md:ml-[240px] md:pt-16" style={{ backgroundColor: S.bg }}>
      <AdminNav />

      <div className="max-w-3xl mx-auto p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Publicadas', value: goodReviews.filter(r => r.published).length, icon: 'checkCircle' as const, color: 'var(--ad-accent)' },
            { label: 'Promedio', value: avgGood ? `${avgGood}` : '—', icon: 'star' as const, color: '#fbbf24' },
            { label: 'Negativas', value: badReviews.length, icon: 'mail' as const, color: '#f87171' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center flex flex-col items-center" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
              <span style={{ color: s.color }}><Icon name={s.icon} size={20} /></span>
              <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: S.sub }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 gap-1.5 rounded-2xl" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <button type="button" onClick={() => setTab('good')}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={tab === 'good'
              ? { backgroundColor: 'var(--ad-accent)', color: 'var(--ad-accent-text, #000)' }
              : { color: S.sub, backgroundColor: 'transparent' }}>
            <Icon name="check" size={15} /> Buenas
            <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
              style={tab === 'good'
                ? { backgroundColor: 'rgba(0,0,0,0.2)', color: 'inherit' }
                : { backgroundColor: 'color-mix(in srgb, var(--ad-accent) 15%, transparent)', color: 'var(--ad-accent)' }}>
              {goodReviews.length}
            </span>
          </button>
          <button type="button" onClick={() => setTab('bad')}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={tab === 'bad'
              ? { backgroundColor: '#ef4444', color: '#fff' }
              : { color: S.sub, backgroundColor: 'transparent' }}>
            <Icon name="mail" size={15} /> Negativas
            <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
              style={tab === 'bad'
                ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
              {badReviews.length}
            </span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse flex gap-3" style={{ backgroundColor: S.card }}>
                <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-full w-1/3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded-full w-full" style={{ backgroundColor: 'var(--ad-overlay)' }} />
                  <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: 'var(--ad-overlay)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-16" style={{ color: S.sub }}>
            <span className="mb-3"><Icon name={tab === 'good' ? 'message' : 'checkCircle'} size={42} /></span>
            <p className="font-semibold text-lg" style={{ color: S.text }}>
              {tab === 'good' ? 'No hay reseñas buenas aún' : '¡Sin reseñas negativas!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(review => (
              <div key={review.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: S.card,
                  border: `1px solid ${S.border}`,
                  borderLeft: `4px solid ${review.bad ? '#ef4444' : review.published ? 'var(--ad-accent)' : '#f59e0b'}`,
                }}>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f6ef7)' }}>
                      {initial(review.customerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold" style={{ color: S.text }}>{review.customerName}</p>
                        <p className="text-xs shrink-0" style={{ color: S.sub }}>{fmtDate(review.createdAt)}</p>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>

                  <p className="text-sm mb-3 leading-relaxed" style={{ color: '#cbd5e1' }}>{review.comment}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {review.bad && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: '#fb923c' }}><span className="inline-flex items-center gap-1"><Icon name="mail" size={11} /> Enviado por email</span></span>
                    )}
                    {review.published && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--ad-accent) 15%, transparent)', color: 'var(--ad-accent)' }}><span className="inline-flex items-center gap-1"><Icon name="check" size={11} /> Publicada</span></span>
                    )}
                    {!review.bad && !review.published && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: S.sub }}>Oculta</span>
                    )}
                  </div>
                </div>

                <div className="flex" style={{ borderTop: `1px solid ${S.border}` }}>
                  {!review.bad && (
                    <button type="button" onClick={() => togglePublish(review)}
                      className="flex-1 py-3 text-sm font-bold transition-colors"
                      style={{
                        borderRight: `1px solid ${S.border}`,
                        color: review.published ? '#fb923c' : 'var(--ad-accent)',
                        backgroundColor: 'transparent',
                      }}>
                      {review.published ? 'Despublicar' : 'Publicar'}
                    </button>
                  )}
                  <button type="button" onClick={() => deleteReview(review.id)}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={{ color: '#f87171', backgroundColor: 'transparent' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
