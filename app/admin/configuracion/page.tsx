'use client'

// Configuración del sistema: branding del admin, branding de Resta3, colores del empleado,
// textos de registro y perfiles de administrador.
import { useState, useEffect } from 'react'
import AdminNav from '@/app/components/AdminNav'
import { Icon } from '@/app/components/Icon'
import { uploadWebp } from '@/lib/uploadWebp'

const S = {
  bg: 'var(--ad-bg)', card: 'var(--ad-card)', accent: 'var(--ad-accent)',
  text: 'var(--ad-text)', sub: 'var(--ad-sub)', border: 'var(--ad-border)',
}

const TEXT_SETTINGS = [
  { key: 'registro_titulo',    label: 'Título de bienvenida',    placeholder: '¡Bienvenido!',                       hint: 'Aparece en la tarjeta de /registro' },
  { key: 'registro_subtitulo', label: 'Subtítulo de bienvenida', placeholder: 'Completa tus datos para registrarte...', hint: 'Texto debajo del título en /registro' },
]

interface AdminItem    { id: string; name: string; role: string; createdAt: string }
interface EmployeeItem { id: string; name: string; role: string; createdAt: string }

const ROLES     = ['Administrador', 'Gerente', 'Supervisor', 'Encargado', 'Cajero', 'Auditor']
const EMP_ROLES = ['Mesero', 'Capitán', 'Hostess', 'Bartender', 'Barista', 'Cocina', 'Cajero', 'Repartidor']

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  const raw = Array.from(arr).map(b => chars[b % chars.length]).join('')
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`
}

function currentAdminName(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)admin_name=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export default function AdminConfiguracionPage() {
  const [values, setValues]       = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState<string | null>(null)
  const [saved,  setSaved]        = useState<string | null>(null)
  const [uploadingLogo,     setUploadingLogo]     = useState(false)
  const [uploadingMenuLogo, setUploadingMenuLogo] = useState(false)
  const [uploadingRecLogo,  setUploadingRecLogo]  = useState(false)

  // Perfiles
  const [admins, setAdmins]         = useState<AdminItem[]>([])
  const [newName, setNewName]       = useState('')
  const [newRole, setNewRole]       = useState('Administrador')
  const [newPass, setNewPass]       = useState(() => generatePassword())
  const [passCopied, setPassCopied] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [creating, setCreating]     = useState(false)

  const [employees, setEmployees]     = useState<EmployeeItem[]>([])
  const [empName, setEmpName]         = useState('')
  const [empRole, setEmpRole]         = useState('Mesero')
  const [empPass, setEmpPass]         = useState(() => generatePassword())
  const [empPassCopied, setEmpPassCopied] = useState(false)
  const [empError, setEmpError]       = useState('')
  const [creatingEmp, setCreatingEmp] = useState(false)

  const me = currentAdminName()

  useEffect(() => {
    const keys = [
      ...TEXT_SETTINGS.map(s => s.key),
      'restaurant_name', 'restaurant_address', 'restaurant_phone', 'admin_subtitle', 'profile_logo', 'sidebar_accent',
      'menu_logo', 'menu_bg_color', 'menu_btn_color', 'menu_hover_color', 'business_wa',
      'recetario_color', 'recetario_logo',
    ]
    keys.forEach(async key => {
      const r = await fetch(`/api/settings?key=${key}`)
      const d = await r.json()
      if (d.value) setValues(p => ({ ...p, [key]: d.value }))
    })

    loadAdmins()
    loadEmployees()
  }, [])

  async function loadAdmins() {
    const r = await fetch('/api/admins')
    if (!r.ok) return
    setAdmins(await r.json())
  }

  async function loadEmployees() {
    const r = await fetch('/api/employees')
    if (!r.ok) return
    setEmployees(await r.json())
  }

  async function createEmp() {
    setEmpError('')
    if (!empName.trim()) { setEmpError('El nombre es requerido'); return }
    setCreatingEmp(true)
    try {
      const r = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: empName.trim(), password: empPass, role: empRole }),
      })
      const d = await r.json()
      if (!r.ok) { setEmpError(d.error ?? 'Error al crear empleado'); return }
      setEmpName('')
      setEmpRole('Mesero')
      setEmpPass(generatePassword())
      setEmpPassCopied(false)
      await loadEmployees()
    } finally {
      setCreatingEmp(false)
    }
  }

  async function deleteEmp(id: string, name: string) {
    if (!confirm(`¿Eliminar al empleado "${name}"? Esta acción no se puede deshacer.`)) return
    setEmpError('')
    const r = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' })
    if (!r.ok) { const d = await r.json(); setEmpError(d.error ?? 'No se pudo eliminar'); return }
    await loadEmployees()
  }

  async function copyEmpPassword() {
    await navigator.clipboard.writeText(empPass)
    setEmpPassCopied(true)
    setTimeout(() => setEmpPassCopied(false), 2500)
  }

  async function saveSetting(key: string, valueOverride?: string) {
    setSaving(key)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: valueOverride ?? values[key] ?? '' }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  async function uploadLogo(file: File, key: string, setLoading: (v: boolean) => void) {
    setLoading(true)
    try {
      const url = await uploadWebp(file, '/api/settings/upload')
      if (url) {
        setValues(p => ({ ...p, [key]: url }))
        await saveSetting(key, url)
      }
    } finally {
      setLoading(false)
    }
  }

  async function createProfile() {
    setProfileError('')
    if (!newName.trim()) { setProfileError('El nombre es requerido'); return }
    setCreating(true)
    try {
      const r = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), password: newPass, role: newRole }),
      })
      const d = await r.json()
      if (!r.ok) { setProfileError(d.error ?? 'Error al crear el perfil'); return }
      setNewName('')
      setNewRole('Administrador')
      setNewPass(generatePassword())
      setPassCopied(false)
      await loadAdmins()
    } finally {
      setCreating(false)
    }
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPass)
    setPassCopied(true)
    setTimeout(() => setPassCopied(false), 2500)
  }

  async function deleteProfile(id: string, name: string) {
    if (!confirm(`¿Eliminar el perfil "${name}"? Esta acción no se puede deshacer.`)) return
    setProfileError('')
    const r = await fetch(`/api/admins?id=${id}`, { method: 'DELETE' })
    if (!r.ok) {
      const d = await r.json()
      setProfileError(d.error ?? 'No se pudo eliminar')
      return
    }
    await loadAdmins()
  }

  const accent = values.sidebar_accent || '#00e676'

  const renderSaveBtn = (k: string) => (
    <button
      onClick={() => saveSetting(k)}
      disabled={saving === k}
      className="px-4 py-2 rounded-2xl text-sm font-bold shrink-0 transition-all"
      style={{ backgroundColor: saved === k ? 'rgba(0,230,118,.2)' : `${S.accent}22`, color: saved === k ? '#4ade80' : S.accent }}>
      {saving === k ? '...' : saved === k ? <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} /> Guardado</span> : 'Guardar'}
    </button>
  )

  const renderColorRow = (key: string, previewColor: string) => (
    <div className="flex items-center gap-2">
      <input type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(previewColor) ? previewColor : '#00e676'}
        onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))}
        className="w-12 h-11 rounded-2xl cursor-pointer bg-transparent"
        style={{ border: `1px solid ${S.border}` }} />
      <input type="text"
        value={values[key] ?? ''}
        onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))}
        placeholder="#00e676"
        className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none font-mono"
        style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
      {renderSaveBtn(key)}
    </div>
  )

  return (
    <div className="min-h-screen md:ml-[240px] md:pt-16" style={{ backgroundColor: S.bg }}>
      <AdminNav />
      <div className="max-w-[800px] mx-auto p-4 space-y-4">

        <div className="pt-1">
          <h1 className="text-xl font-black" style={{ color: S.text }}>Configuración</h1>
          <p className="text-xs mt-0.5" style={{ color: S.sub }}>Textos, colores, logos y módulos del sistema</p>
        </div>

        {/* ===== Identidad del restaurante (Admin) ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Identidad del restaurante</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Nombre, logo y color — se aplica a todos los paneles (admin, empleados, RESTA3 y clientes)</p>
          </div>
          <div className="p-5 space-y-5">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Nombre del restaurante</label>
              <div className="flex gap-2">
                <input type="text" value={values.restaurant_name ?? ''}
                  onChange={e => setValues(p => ({ ...p, restaurant_name: e.target.value }))}
                  placeholder="NICHO"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                {renderSaveBtn('restaurant_name')}
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Se muestra en el menú lateral del panel</p>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Dirección</label>
              <div className="flex gap-2">
                <input type="text" value={values.restaurant_address ?? ''}
                  onChange={e => setValues(p => ({ ...p, restaurant_address: e.target.value }))}
                  placeholder="Calle Ejemplo 123, Col. Centro"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                {renderSaveBtn('restaurant_address')}
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Se imprime en los tickets de pedido</p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Teléfono</label>
              <div className="flex gap-2">
                <input type="text" value={values.restaurant_phone ?? ''}
                  onChange={e => setValues(p => ({ ...p, restaurant_phone: e.target.value }))}
                  placeholder="(444) 123-4567"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                {renderSaveBtn('restaurant_phone')}
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Se imprime en los tickets de pedido</p>
            </div>

            {/* Subtítulo del sidebar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Subtítulo del panel admin</label>
              <div className="flex gap-2">
                <input type="text" value={values.admin_subtitle ?? ''}
                  onChange={e => setValues(p => ({ ...p, admin_subtitle: e.target.value }))}
                  placeholder="Dirección General"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                {renderSaveBtn('admin_subtitle')}
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Aparece debajo del nombre en el sidebar (ej. "Dirección General")</p>
            </div>

            {/* Logo admin */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Logo de perfil</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: 'linear-gradient(135deg,var(--ad-accent),#06b6d4)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values.profile_logo || '/logo-portales.svg'} alt="logo" className="w-10 h-10 object-contain" />
                </div>
                <label className="px-4 py-2 rounded-2xl text-sm font-bold cursor-pointer transition-all"
                  style={{ backgroundColor: `${S.accent}22`, color: S.accent }}>
                  {uploadingLogo ? 'Subiendo...' : 'Cambiar logo'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f, 'profile_logo', setUploadingLogo) }} />
                </label>
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>PNG o SVG con fondo transparente recomendado</p>
            </div>

            {/* Color admin */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Color del menú lateral (Admin)</label>
              {renderColorRow('sidebar_accent', accent)}
              <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: accent, color: '#000' }}>
                Vista previa del botón activo
              </div>
            </div>

          </div>
        </div>


        {/* ===== Menú del cliente ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Menú del cliente (/menu, /card)</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Logo y colores de las páginas públicas que ven los comensales</p>
          </div>
          <div className="p-5 space-y-5">

            {/* Logo menú */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Logo en el menú del cliente</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: values.menu_bg_color || '#0d0d0d', border: `1px solid ${S.border}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values.menu_logo || values.profile_logo || '/logo-portales.svg'} alt="logo menú" className="w-10 h-10 object-contain" />
                </div>
                <label className="px-4 py-2 rounded-2xl text-sm font-bold cursor-pointer transition-all"
                  style={{ backgroundColor: `${S.accent}22`, color: S.accent }}>
                  {uploadingMenuLogo ? 'Subiendo...' : 'Cambiar logo'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f, 'menu_logo', setUploadingMenuLogo) }} />
                </label>
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Aparece en la barra superior y en el carrito</p>
            </div>

            {/* Fondo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Color de fondo</label>
              {renderColorRow('menu_bg_color', values.menu_bg_color || '#0d0d0d')}
            </div>

            {/* Botón principal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Color del botón principal</label>
              {renderColorRow('menu_btn_color', values.menu_btn_color || '#E8912A')}
            </div>

            {/* Color hover / acento */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Color de acento / hover</label>
              {renderColorRow('menu_hover_color', values.menu_hover_color || '#E8912A')}
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: values.menu_btn_color || '#E8912A', color: '#fff' }}>Botón</span>
                <span className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: values.menu_hover_color || '#E8912A', color: '#fff' }}>Acento</span>
              </div>
            </div>

            {/* WhatsApp del negocio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>WhatsApp del negocio</label>
              <div className="flex gap-2">
                <input type="text" value={values.business_wa ?? ''}
                  onChange={e => setValues(p => ({ ...p, business_wa: e.target.value.replace(/\D/g, '') }))}
                  placeholder="526641234567"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none font-mono"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                {renderSaveBtn('business_wa')}
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Número sin + ni espacios (ej. 526641234567). Los pedidos del menú se envían aquí por WhatsApp.</p>
            </div>

          </div>
        </div>

        {/* ===== Recetario ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Recetario (/resetas, /recetas)</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Branding del recetario público del restaurante</p>
          </div>
          <div className="p-5 space-y-5">

            {/* Logo recetario */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Logo del recetario</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: `linear-gradient(135deg,${values.recetario_color || '#7c3aed'},#4f6ef7)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values.recetario_logo || values.profile_logo || '/logo-portales.svg'} alt="logo recetario" className="w-10 h-10 object-contain" />
                </div>
                <label className="px-4 py-2 rounded-2xl text-sm font-bold cursor-pointer transition-all"
                  style={{ backgroundColor: `${S.accent}22`, color: S.accent }}>
                  {uploadingRecLogo ? 'Subiendo...' : 'Cambiar logo'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f, 'recetario_logo', setUploadingRecLogo) }} />
                </label>
              </div>
              <p className="text-xs mt-1" style={{ color: S.sub }}>Dejar vacío usa el logo del restaurante</p>
            </div>

            {/* Color recetario */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>Color principal del recetario</label>
              {renderColorRow('recetario_color', values.recetario_color || '#7c3aed')}
              <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: values.recetario_color || '#7c3aed', color: '#fff' }}>
                Vista previa Recetario
              </div>
            </div>
          </div>
        </div>

        {/* ===== Textos del formulario de registro ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Formulario de Registro (/registro)</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Texto que ven los clientes al escanear el QR del restaurante</p>
          </div>
          <div className="p-5 space-y-4">
            {TEXT_SETTINGS.map(s => (
              <div key={s.key}>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: S.sub }}>{s.label}</label>
                <div className="flex gap-2">
                  <input type="text" value={values[s.key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                  {renderSaveBtn(s.key)}
                </div>
                <p className="text-xs mt-1" style={{ color: S.sub }}>{s.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Administración de perfiles ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Administración de perfiles</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Usuarios con acceso al panel /admin</p>
          </div>
          <div className="p-5 space-y-4">

            <div className="space-y-2">
              {admins.map(a => {
                const isMe = a.name.toLowerCase() === me.toLowerCase()
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f6ef7)', color: '#fff' }}>
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: S.text }}>
                        {a.name}{isMe && <span className="ml-2 text-xs font-medium" style={{ color: S.accent }}>(tú)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${S.accent}22`, color: S.accent }}>
                          {a.role || 'Administrador'}
                        </span>
                        <span className="text-xs" style={{ color: S.sub }}>Alta: {new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteProfile(a.id, a.name)} disabled={isMe}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent' }}>
                      Eliminar
                    </button>
                  </div>
                )
              })}
              {admins.length === 0 && (
                <p className="text-xs" style={{ color: S.sub }}>Cargando perfiles...</p>
              )}
            </div>

            <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: S.sub }}>Crear nuevo perfil</p>

              {/* Nombre + Rol */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={newName}
                  onChange={e => { setNewName(e.target.value); setProfileError('') }}
                  placeholder="Nombre de usuario"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="px-4 py-3 rounded-2xl text-sm outline-none font-medium"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Contraseña aleatoria */}
              <div className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: S.sub }}>Contraseña generada automáticamente</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono tracking-wider select-all"
                    style={{ backgroundColor: S.card, color: S.text, border: `1px solid ${S.border}` }}>
                    {newPass}
                  </code>
                  <button onClick={copyPassword}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                    style={{ backgroundColor: passCopied ? 'rgba(74,222,128,.2)' : `${S.accent}22`, color: passCopied ? '#4ade80' : S.accent }}>
                    {passCopied ? '✓ Copiada' : 'Copiar'}
                  </button>
                  <button onClick={() => { setNewPass(generatePassword()); setPassCopied(false) }}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                    style={{ backgroundColor: `${S.accent}22`, color: S.accent }}>
                    Nueva
                  </button>
                </div>
                <p className="text-xs" style={{ color: S.sub }}>
                  Copia la contraseña antes de crear el perfil — no se puede recuperar después.
                </p>
              </div>

              <button onClick={createProfile} disabled={creating || !newName.trim()}
                className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: S.accent, color: '#000' }}>
                {creating ? 'Creando...' : '+ Crear perfil'}
              </button>

              {profileError && (
                <p className="text-xs font-medium" style={{ color: '#f87171' }}>{profileError}</p>
              )}
            </div>

          </div>
        </div>

        {/* ===== Administración de empleados ===== */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.card, border: `1px solid ${S.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>Empleados · Meseros y personal</p>
            <p className="text-xs mt-0.5" style={{ color: S.sub }}>Usuarios con acceso al panel /employee</p>
          </div>
          <div className="p-5 space-y-4">

            <div className="space-y-2">
              {employees.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#fff' }}>
                    {e.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: S.text }}>{e.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                        {e.role || 'Mesero'}
                      </span>
                      <span className="text-xs" style={{ color: S.sub }}>Alta: {new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteEmp(e.id, e.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                    style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent' }}>
                    Eliminar
                  </button>
                </div>
              ))}
              {employees.length === 0 && (
                <p className="text-xs" style={{ color: S.sub }}>Sin empleados registrados aún.</p>
              )}
            </div>

            <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: S.sub }}>Agregar empleado</p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={empName}
                  onChange={e => { setEmpName(e.target.value); setEmpError('') }}
                  placeholder="Nombre del empleado"
                  className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }} />
                <select value={empRole} onChange={e => setEmpRole(e.target.value)}
                  className="px-4 py-3 rounded-2xl text-sm outline-none font-medium"
                  style={{ backgroundColor: S.bg, color: S.text, border: `1px solid ${S.border}` }}>
                  {EMP_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: S.sub }}>Contraseña generada automáticamente</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono tracking-wider select-all"
                    style={{ backgroundColor: S.card, color: S.text, border: `1px solid ${S.border}` }}>
                    {empPass}
                  </code>
                  <button onClick={copyEmpPassword}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                    style={{ backgroundColor: empPassCopied ? 'rgba(74,222,128,.2)' : 'rgba(6,182,212,0.15)', color: empPassCopied ? '#4ade80' : '#06b6d4' }}>
                    {empPassCopied ? '✓ Copiada' : 'Copiar'}
                  </button>
                  <button onClick={() => { setEmpPass(generatePassword()); setEmpPassCopied(false) }}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                    style={{ backgroundColor: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                    Nueva
                  </button>
                </div>
                <p className="text-xs" style={{ color: S.sub }}>Copia la contraseña antes de crear — no se puede recuperar después.</p>
              </div>

              <button onClick={createEmp} disabled={creatingEmp || !empName.trim()}
                className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#06b6d4', color: '#000' }}>
                {creatingEmp ? 'Creando...' : '+ Agregar empleado'}
              </button>

              {empError && (
                <p className="text-xs font-medium" style={{ color: '#f87171' }}>{empError}</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
