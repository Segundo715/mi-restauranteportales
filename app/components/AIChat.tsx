'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export type AIRole = 'cook' | 'staff' | 'customer' | 'admin' | 'recipe' | 'resta3' | 'employee'
export interface QuickAction { label: string; message: string; emoji?: string }
interface MenuItem { id: string; name: string; price: number; imageUrl?: string; description: string; available: boolean }
interface Msg { role: 'user' | 'assistant'; content: string; cards?: MenuItem[]; isError?: boolean }

const CFG: Record<AIRole, { title: string; icon: string; placeholder: string; greeting: string; accent: string }> = {
  cook:     { title: 'Chef Asistente',  icon: '👨‍🍳', placeholder: '¿Pasos de receta? ¿Pedidos activos?',   greeting: '¡Hola chef! Tengo el recetario completo y pedidos en tiempo real. Toca una receta o pregúntame algo.',            accent: '#f97316' },
  staff:    { title: 'Asistente',       icon: '🤖',   placeholder: '¿Pedidos pendientes? ¿Estado de mesa?', greeting: '¡Hola! Puedo darte info de pedidos, tiempos y menú. ¿En qué te ayudo?',                                        accent: '#06b6d4' },
  customer: { title: 'Asistente',       icon: '✨',   placeholder: '¿Qué se te antoja hoy?',               greeting: '¡Hola! Puedo recomendarte platillos, darte el estado de tu pedido o el tiempo estimado.\n\nToca 🎤 para hablar.', accent: '#ec4899' },
  admin:    { title: 'Admin IA',        icon: '📊',   placeholder: 'Ventas, pedidos, tendencias…',          greeting: '¡Hola! Tengo acceso completo: ventas, pedidos, reseñas, menú, tarjetas de lealtad. ¿Qué analizamos?',             accent: '#a78bfa' },
  recipe:   { title: 'Chef Virtual',    icon: '📖',   placeholder: '¿Cómo se prepara…? ¿Puedo sustituir…?', greeting: '¡Hola! Soy tu chef virtual. Explico recetas paso a paso y sugiero variaciones. ¿En qué te ayudo?',                accent: '#22d3ee' },
  resta3:   { title: 'Operaciones',     icon: '🏪',   placeholder: 'Mesas, inventario, pedidos, ventas…',   greeting: '¡Hola! Tengo el estado en tiempo real: mesas, pedidos activos, inventario y ventas del día. ¿Qué necesitas?',    accent: '#00e676' },
  employee: { title: 'Asistente',       icon: '🛎️',   placeholder: '¿Receta? ¿Pedidos? ¿Tarjetas?',         greeting: '¡Hola! Tengo el recetario completo, pedidos activos y tarjetas de lealtad. Toca una receta o pregúntame algo.',  accent: '#38bdf8' },
}

function getRoleFromPath(path: string): AIRole {
  if (path.includes('/resta3/cocina'))                       return 'cook'
  if (path.includes('/resta3'))                              return 'resta3'
  if (path.includes('/employee'))                            return 'employee'
  if (path.includes('/admin'))                               return 'admin'
  if (path.includes('/reseta') || path.includes('/receta'))  return 'recipe'
  return 'customer'
}

function findMentioned(text: string, items: MenuItem[]): MenuItem[] {
  const lower = text.toLowerCase()
  return items.filter(item => item.name.length > 4 && lower.includes(item.name.toLowerCase()))
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: 'currentColor', animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  )
}

function DishCard({ item, accent, onAdd }: { item: MenuItem; accent: string; onAdd: (item: MenuItem) => void }) {
  const [added, setAdded] = useState(false)
  function handle() {
    setAdded(true); onAdd(item); setTimeout(() => setAdded(false), 2500)
  }
  return (
    <div className="rounded-2xl overflow-hidden shrink-0 w-40 flex flex-col transition-transform hover:scale-[1.03]"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} className="w-full h-20 object-cover" />
        : <div className="w-full h-16 flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.04)' }}>🍽️</div>}
      <div className="p-2 flex flex-col flex-1 gap-0.5">
        <p className="text-xs font-black leading-tight text-white">{item.name}</p>
        {item.description && <p className="text-[10px] leading-tight opacity-55 text-white line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-auto pt-1.5">
          <span className="text-xs font-black text-white">${item.price}</span>
          <button onClick={handle}
            className="text-[11px] font-black px-2.5 py-1 rounded-xl transition-all"
            style={added ? { background: '#22c55e', color: '#fff' } : { background: accent, color: '#fff' }}>
            {added ? '✓' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AIChat({
  role: roleProp,
  quickActions,
  position = 'bottom-right',
}: {
  role?: AIRole
  quickActions?: QuickAction[]
  position?: 'bottom-right' | 'bottom-left'
}) {
  const pathname = usePathname()
  const role     = roleProp ?? getRoleFromPath(pathname)
  const cfg      = CFG[role]
  const accent   = cfg.accent

  const [open,        setOpen]        = useState(false)
  const [msgs,        setMsgs]        = useState<Msg[]>([{ role: 'assistant', content: cfg.greeting }])
  const [input,       setInput]       = useState('')
  const [busy,        setBusy]        = useState(false)
  const [actionsUsed, setActionsUsed] = useState(false)
  const [autoActions, setAutoActions] = useState<QuickAction[]>([])
  const [menuItems,   setMenuItems]   = useState<MenuItem[]>([])
  const [listening,   setListening]   = useState(false)
  const [voiceOn,     setVoiceOn]     = useState(false)
  const [hasVoice,    setHasVoice]    = useState(false)
  const [toast,       setToast]       = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const recogRef  = useRef<any>(null)
  const abortRef  = useRef<AbortController | null>(null)

  useEffect(() => {
    setHasVoice(!!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    ))
  }, [])

  useEffect(() => {
    if (role !== 'cook' && role !== 'employee') return
    fetch('/api/recipes').then(r => r.json()).then((d: { name: string }[]) => {
      if (!Array.isArray(d)) return
      setAutoActions(d.map(r => ({
        emoji: '📖', label: r.name,
        message: `Explícame paso a paso cómo preparar "${r.name}". Primero ingredientes, luego pasos numerados.`,
      })))
    }).catch(() => {})
  }, [role])

  useEffect(() => {
    if (role !== 'customer') return
    fetch('/api/menu').then(r => r.json())
      .then((d: MenuItem[]) => { if (Array.isArray(d)) setMenuItems(d.filter(m => m.available)) })
      .catch(() => {})
  }, [role])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120) }, [open])

  const speak = useCallback((text: string) => {
    if (!voiceOn) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text.replace(/[*_`#[\]]/g, '').slice(0, 500))
    utter.lang = 'es-MX'; utter.rate = 1.05
    window.speechSynthesis.speak(utter)
  }, [voiceOn])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2800) }

  function addToCart(item: MenuItem) {
    window.dispatchEvent(new CustomEvent('ai-add-to-cart', { detail: item }))
    showToast(`✅ "${item.name}" agregado al carrito`)
  }

  function toggleVoiceInput() {
    if (listening) { recogRef.current?.stop(); setListening(false); return }
    if (!hasVoice) { showToast('Tu navegador no soporta voz. Usa Chrome o Edge.'); return }
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new R()
    rec.lang = 'es-MX'; rec.continuous = false; rec.interimResults = false

    let handled = false

    rec.onresult = (e: any) => {
      handled = true
      const text: string = (e.results[0][0].transcript ?? '').trim()
      setListening(false)
      if (!text) { showToast('No se entendió. Intenta de nuevo.'); return }
      if (busy) {
        setInput(text)
        showToast('Escrito en el campo — espera a que termine la respuesta.')
        return
      }
      sendMessage(text)
    }
    rec.onerror = (e: any) => {
      if (handled) return
      handled = true
      setListening(false)
      if (e.error === 'no-speech')   showToast('No se detectó voz. Habla más cerca del micrófono.')
      else if (e.error === 'network') showToast('Sin conexión para reconocimiento de voz.')
      else if (e.error !== 'aborted') showToast('Error de micrófono. Intenta de nuevo.')
    }
    rec.onend = () => {
      if (!handled) showToast('No se detectó voz. Intenta de nuevo.')
      setListening(false)
    }
    recogRef.current = rec; rec.start(); setListening(true)
  }

  function reset() {
    abortRef.current?.abort(); setBusy(false)
    setMsgs([{ role: 'assistant', content: cfg.greeting }])
    setActionsUsed(false)
  }

  async function sendMessage(text: string) {
    const txt = text.trim()
    if (!txt || busy) return
    setInput(''); setActionsUsed(true)

    const history: Msg[] = [...msgs, { role: 'user', content: txt }]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setBusy(true)

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timer = setTimeout(() => ctrl.abort(), 28000)

    try {
      // Para cliente: envía menú ya cargado → evita llamada extra a Supabase en el servidor
      const body: Record<string, unknown> = {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        role,
      }
      if (role === 'customer' && menuItems.length > 0) {
        body.menuContext = menuItems.slice(0, 40).map(m => ({
          id: m.id, name: m.name, price: m.price,
          category: (m as any).category ?? '', description: m.description,
        }))
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const dec    = new TextDecoder()
      let acc      = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        const snap = acc
        setMsgs(prev => {
          const u = [...prev]
          u[u.length - 1] = { role: 'assistant', content: snap }
          return u
        })
      }

      if (!acc.trim()) {
        setMsgs(prev => {
          const u = [...prev]
          u[u.length - 1] = { role: 'assistant', content: 'No recibí respuesta. ¿Puedes intentarlo de nuevo?', isError: true }
          return u
        })
        setBusy(false); return
      }

      if (role === 'customer' && menuItems.length > 0) {
        const cards = findMentioned(acc, menuItems).slice(0, 5)
        if (cards.length > 0) {
          setMsgs(prev => {
            const u = [...prev]
            u[u.length - 1] = { ...u[u.length - 1], cards }
            return u
          })
        }
      }

      speak(acc)

    } catch (e: any) {
      clearTimeout(timer)
      const msg = e.name === 'AbortError'
        ? 'La respuesta tardó demasiado. Intenta de nuevo 🔄'
        : `Error de conexión. Intenta de nuevo.`
      setMsgs(prev => {
        const u = [...prev]
        u[u.length - 1] = { role: 'assistant', content: msg, isError: true }
        return u
      })
    }
    setBusy(false)
  }

  const effectiveActions = quickActions ?? ((role === 'cook' || role === 'employee') && autoActions.length > 0 ? autoActions : undefined)
  const posClass = position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6'

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 right-6 z-[300] px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl"
          style={{ background: accent, color: '#fff', boxShadow: `0 4px 24px ${accent}66` }}>
          {toast}
        </div>
      )}

      {/* Botón flotante */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Abrir asistente"
          className={`fixed ${posClass} z-[200] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95`}
          style={{ background: accent, boxShadow: `0 8px 32px ${accent}55` }}>
          {cfg.icon}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className={`fixed ${posClass} z-[200] flex flex-col rounded-3xl overflow-hidden`}
          style={{ width: 360, height: 592, background: 'rgba(8,8,12,0.97)', border: `1px solid ${accent}33`, boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${accent}11` }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 shrink-0"
            style={{ borderBottom: `1px solid ${accent}20`, background: `linear-gradient(135deg, ${accent}12 0%, transparent 60%)` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${accent}20` }}>{cfg.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-white leading-none">{cfg.title}</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: accent }}>
                ● Datos en tiempo real · Llama 3
              </p>
            </div>
            <button onClick={() => setVoiceOn(v => !v)} title={voiceOn ? 'Silenciar respuestas' : 'Activar voz'}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all"
              style={voiceOn
                ? { background: accent, color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
              🔊
            </button>
            <button onClick={reset} title="Nueva conversación"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
              ↺
            </button>
            <button onClick={() => setOpen(false)} aria-label="Cerrar asistente" title="Cerrar"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words"
                  style={m.role === 'user'
                    ? { background: accent, color: '#fff', borderBottomRightRadius: 5 }
                    : m.isError
                      ? { background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', borderBottomLeftRadius: 5 }
                      : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: 5 }}>
                  {busy && i === msgs.length - 1 && !m.content
                    ? <Dots />
                    : m.content || null}
                </div>

                {m.role === 'assistant' && m.isError && (
                  <button onClick={() => {
                    const lastUser = [...msgs].reverse().find(x => x.role === 'user')
                    if (lastUser) { setMsgs(prev => prev.slice(0, -1)); sendMessage(lastUser.content) }
                  }}
                    className="mt-1.5 text-xs px-3 py-1 rounded-xl font-bold transition-all hover:scale-105"
                    style={{ background: `${accent}22`, color: accent }}>
                    🔄 Reintentar
                  </button>
                )}

                {m.cards && m.cards.length > 0 && (
                  <div className="mt-2 w-full max-w-[96%]">
                    <p className="text-[10px] font-bold mb-1.5" style={{ color: accent }}>
                      ✨ Recomendaciones — toca para agregar
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {m.cards.map(item => (
                        <DishCard key={item.id} item={item} accent={accent} onAdd={addToCart} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Acciones rápidas */}
          {effectiveActions && !actionsUsed && (
            <div className="px-3 pb-2 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 px-0.5" style={{ color: accent + '80' }}>
                Acceso rápido
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {effectiveActions.map((a, idx) => (
                  <button key={idx} onClick={() => sendMessage(a.message)}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                    style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                    {a.emoji && <span>{a.emoji}</span>}
                    <span className="truncate max-w-[90px]">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: `1px solid ${accent}18` }}>
            <div className="flex gap-2 items-center">
              {/* Micrófono */}
              <button onClick={toggleVoiceInput} disabled={busy}
                aria-label={listening ? 'Detener escucha de voz' : 'Hablar con el asistente'}
                title={listening ? 'Detener' : 'Hablar'}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-base transition-all shrink-0 disabled:opacity-30"
                style={listening
                  ? { background: '#ef4444', color: '#fff', boxShadow: '0 0 16px #ef444466' }
                  : { background: hasVoice ? `${accent}20` : 'rgba(255,255,255,0.05)', color: hasVoice ? accent : '#475569', border: `1px solid ${hasVoice ? accent + '40' : 'rgba(255,255,255,0.06)'}` }}>
                🎤
              </button>

              <input ref={inputRef}
                id="ai-chat-input" name="ai_chat_input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder={listening ? '🎤 Escuchando…' : cfg.placeholder}
                disabled={busy || listening}
                autoComplete="off"
                className="flex-1 px-3.5 py-2.5 rounded-2xl text-[13px] outline-none disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.09)' }} />

              <button onClick={() => sendMessage(input)} disabled={busy || !input.trim() || listening}
                aria-label="Enviar mensaje" title="Enviar"
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-90 disabled:opacity-30 shrink-0"
                style={{ background: accent, color: '#fff' }}>
                ↑
              </button>
            </div>

            {listening && (
              <p className="text-center text-[10px] mt-1.5 font-bold" style={{ color: '#ef4444' }}>
                🔴 Escuchando… toca 🎤 para detener
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
