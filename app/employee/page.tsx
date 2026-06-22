'use client'

// Home del empleado: escanea QR del cliente para sellar su tarjeta de lealtad.
// QRScanner se importa dinámicamente (SSR-unsafe); scanKey bumps el ref para re-montar el scanner.
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { QRScanner } from '../components/QRScanner'
import EmployeeNav from '../components/EmployeeNav'
import { Icon } from '@/app/components/Icon'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

interface LoyaltyCard {
  id: string; name: string; phone: string; visits: number
  registeredAt: string; stamps: { timestamp: string }[]
}

function initial(name: string) { return name.trim().charAt(0).toUpperCase() }

type ScanMode = 'idle' | 'camera' | 'phone'
type ScanState = 'idle' | 'scanning' | 'found' | 'stamping' | 'done'

const STAMPS = 5

const S = {
  bg:     'var(--ad-bg)',
  card:   'var(--ad-card)',
  accent: 'var(--ad-accent)',
  text:   'var(--ad-text)',
  sub:    'var(--ad-sub)',
  border: 'var(--ad-border)',
}

export default function EmployeePage() {
  const [origin, setOrigin] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>('idle')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanned, setScanned] = useState<LoyaltyCard | null>(null)
  const [scanError, setScanError] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([])
  const [cardSearch, setCardSearch] = useState('')
  const scanKey = useRef(0)

  useEffect(() => {
    setOrigin(window.location.origin)
    loadCards()
    const poll = setInterval(loadCards, 8000)
    return () => clearInterval(poll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCards() {
    const res = await fetch('/api/loyalty')
    if (res.ok) setLoyaltyCards(await res.json())
  }

  async function loadCard(id: string) {
    setScanState('found'); setScanError('')
    const res = await fetch(`/api/loyalty/${id}`)
    if (res.ok) setScanned(await res.json())
    else { setScanError('Tarjeta no encontrada.'); setScanState('idle') }
  }

  async function searchByPhone() {
    const q = phoneSearch.replace(/\D/g, '')
    if (q.length < 6) { setScanError('Ingresa al menos 6 dígitos.'); return }
    setSearching(true); setScanError('')
    const match = loyaltyCards.find(c => c.phone.replace(/\D/g, '').includes(q))
    if (match) { setScanned(match); setScanState('found') }
    else setScanError('No se encontró ninguna tarjeta con ese número.')
    setSearching(false)
  }

  async function stampVisit() {
    if (!scanned) return
    setScanState('stamping')
    const res = await fetch(`/api/loyalty/${scanned.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stamp' }),
    })
    if (res.ok) { setScanned(await res.json()); setScanState('done'); loadCards() }
    else { setScanState('found'); setScanError('Error al registrar la visita.') }
  }

  async function redeemCoffee() {
    if (!scanned) return
    setScanState('stamping')
    const res = await fetch(`/api/loyalty/${scanned.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'redeem' }),
    })
    if (res.ok) { setScanned(await res.json()); setScanState('done'); loadCards() }
    else setScanState('found')
  }

  function resetScan() {
    scanKey.current += 1
    setScanMode('idle'); setScanState('idle'); setScanned(null)
    setScanError(''); setPhoneSearch('')
  }

  return (
    <div className="min-h-screen md:ml-[240px]" style={{ backgroundColor: S.bg }}>
      <EmployeeNav />
      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Business QR */}
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <h2 className="font-black text-base mb-1" style={{ color: S.accent }}>QR del negocio</h2>
          <p className="text-xs mb-4" style={{ color: S.sub }}>Los clientes escanean este para registrarse</p>
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-white inline-flex items-center justify-center min-h-[172px] min-w-[172px]">
              {origin ? <QRCode value={`${origin}/loyalty`} size={160} /> : <span className="text-gray-400 text-sm">Cargando…</span>}
            </div>
          </div>
          {origin && <p className="text-xs break-all" style={{ color: S.sub }}>{origin}/loyalty</p>}
        </div>

        {/* Stamp visit */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--ad-accent) 8%, transparent)', borderBottom: `1px solid ${S.border}` }}>
            <h2 className="font-black text-base" style={{ color: S.accent }}>Sellar visita</h2>
          </div>

          <div className="p-5 space-y-3">
            {scanError && (
              <div className="border rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                {scanError}
              </div>
            )}

            {scanMode === 'idle' && scanState === 'idle' && (
              <div className="space-y-3">
                <button type="button"
                  onClick={() => { setScanError(''); setScanMode('camera'); setScanState('scanning') }}
                  className="w-full font-black py-4 rounded-2xl text-base transition-colors"
                  style={{ backgroundColor: S.accent, color: '#000' }}>
                  <span className="inline-flex items-center justify-center gap-2"><Icon name="camera" size={17} /> Escanear QR del cliente</span>
                </button>
                <button type="button"
                  onClick={() => { setScanError(''); setScanMode('phone') }}
                  className="w-full font-bold py-4 rounded-2xl text-base transition-colors"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--ad-accent) 10%, transparent)', color: S.accent, border: '1px solid color-mix(in srgb, var(--ad-accent) 30%, transparent)' }}>
                  <span className="inline-flex items-center justify-center gap-2"><Icon name="search" size={17} /> Buscar por teléfono</span>
                </button>
              </div>
            )}

            {scanMode === 'camera' && scanState === 'scanning' && (
              <div>
                <QRScanner key={scanKey.current} onScan={id => loadCard(id)}
                  onCameraError={() => { setScanError('Cámara no disponible. Usa búsqueda por teléfono.'); setScanMode('idle') }} />
                <button type="button" onClick={resetScan} className="w-full mt-3 text-sm underline py-1" style={{ color: S.sub }}>
                  Cancelar
                </button>
              </div>
            )}

            {scanMode === 'phone' && scanState === 'idle' && (
              <div className="space-y-3">
                <input type="tel" value={phoneSearch}
                  onChange={e => setPhoneSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                  placeholder="Número de teléfono"
                  className="w-full rounded-2xl px-4 py-3 text-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--ad-elevated)', color: S.text, border: '1px solid color-mix(in srgb, var(--ad-accent) 30%, transparent)' }}
                  autoFocus />
                <button type="button" onClick={searchByPhone} disabled={searching}
                  className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60"
                  style={{ backgroundColor: S.accent, color: '#000' }}>
                  {searching ? 'Buscando...' : <span className="inline-flex items-center justify-center gap-2"><Icon name="search" size={17} /> Buscar</span>}
                </button>
                <button type="button" onClick={resetScan} className="w-full text-sm underline py-1" style={{ color: S.sub }}>
                  Cancelar
                </button>
              </div>
            )}

            {scanState !== 'idle' && scanState !== 'scanning' && scanned && (
              <div className="space-y-4">
                <div className="rounded-2xl p-5" style={{ background: 'color-mix(in srgb, var(--ad-accent) 8%, var(--ad-card))', border: '1px solid color-mix(in srgb, var(--ad-accent) 20%, transparent)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-2xl leading-tight" style={{ color: S.text }}>{scanned.name}</p>
                      <p className="text-sm" style={{ color: S.sub }}>{scanned.phone}</p>
                    </div>
                    <span className="text-3xl font-black" style={{ color: scanned.visits >= STAMPS ? S.accent : S.sub }}>
                      {scanned.visits}/{STAMPS}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: STAMPS }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-full flex items-center justify-center text-xl border-2 transition-all"
                        style={{
                          backgroundColor: i < scanned.visits ? 'color-mix(in srgb, var(--ad-accent) 20%, transparent)' : 'var(--ad-overlay)',
                          borderColor: i < scanned.visits ? S.accent : 'rgba(255,255,255,0.1)',
                        }}>
                        {i < scanned.visits ? <span style={{ color: S.accent }}><Icon name="coffee" size={16} /></span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>○</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {scanState === 'done' ? (
                  <div className="rounded-2xl p-4 text-center font-black text-base"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--ad-accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--ad-accent) 40%, transparent)', color: S.accent }}>
                    <span className="inline-flex items-center justify-center gap-2"><Icon name="checkCircle" size={16} /> ¡Visita sellada! — {scanned.visits}/{STAMPS} sellos</span>
                  </div>
                ) : scanned.visits >= STAMPS ? (
                  <button type="button" onClick={redeemCoffee} disabled={scanState === 'stamping'}
                    className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60"
                    style={{ backgroundColor: '#fbbf24', color: '#000' }}>
                    {scanState === 'stamping' ? 'Canjeando...' : <span className="inline-flex items-center justify-center gap-2"><Icon name="gift" size={17} /> Canjear café gratis</span>}
                  </button>
                ) : (
                  <button type="button" onClick={stampVisit} disabled={scanState === 'stamping'}
                    className="w-full font-black py-4 rounded-2xl text-base disabled:opacity-60"
                    style={{ backgroundColor: S.accent, color: '#000' }}>
                    {scanState === 'stamping' ? 'Sellando...' : <span className="inline-flex items-center justify-center gap-2"><Icon name="coffee" size={17} /> Sellar visita</span>}
                  </button>
                )}

                <button type="button" onClick={resetScan} className="w-full text-sm underline py-1" style={{ color: S.sub }}>
                  Buscar otro cliente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active loyalty cards */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
            <h2 className="font-black text-base flex items-center gap-2" style={{ color: S.text }}><Icon name="coffee" size={18} /> Tarjetas activas</h2>
            <span className="text-xs font-bold" style={{ color: S.accent }}>{loyaltyCards.length}</span>
          </div>
          <div className="p-3 space-y-2">
            <input type="text" value={cardSearch} onChange={e => setCardSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ backgroundColor: 'var(--ad-elevated)', color: S.text, border: `1px solid ${S.border}` }} />
            {loyaltyCards
              .filter(c => !cardSearch.trim() || c.name.toLowerCase().includes(cardSearch.toLowerCase()) || c.phone.includes(cardSearch))
              .slice(0, 15)
              .map(c => (
                <button key={c.id} type="button"
                  onClick={() => { loadCard(c.id); setScanMode('camera') }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors active:scale-[0.98]"
                  style={{
                    backgroundColor: c.visits >= STAMPS ? 'rgba(251,191,36,0.08)' : 'var(--ad-overlay)',
                    border: c.visits >= STAMPS ? '2px solid rgba(251,191,36,0.35)' : `1px solid ${S.border}`,
                  }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-base shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f6ef7)' }}>
                    {initial(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: S.text }}>{c.name}</p>
                    <div className="flex gap-1 mt-1">
                      {Array.from({ length: STAMPS }).map((_, i) => (
                        <div key={i} className="w-4 h-1.5 rounded-full"
                          style={{ backgroundColor: i < c.visits ? S.accent : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {c.visits >= STAMPS
                      ? <span style={{ color: '#fbbf24' }}><Icon name="gift" size={17} /></span>
                      : <span className="text-sm font-black" style={{ color: S.accent }}>{c.visits}/{STAMPS}</span>
                    }
                  </div>
                </button>
              ))}
            {loyaltyCards.length === 0 && (
              <p className="text-center text-sm py-4" style={{ color: S.sub }}>Aún no hay tarjetas registradas</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
