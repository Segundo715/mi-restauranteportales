// Server component: lee settings en el servidor para pasar nombre/logo/acento a BrandProvider
// sin parpadeo. Inyecta el script de tema y el CSS del scrollbar con el color de sidebar_accent.
import { getSetting } from '@/lib/settingsDb'
import { getFeatureFlags } from '@/lib/features'
import BrandProvider from '@/app/components/BrandProvider'
import FeatureGuard from '@/app/components/FeatureGuard'
import AIChat from '@/app/components/AIChat'

export const dynamic = 'force-dynamic'

// Aplica el tema guardado (data-admin-theme) antes de pintar, para evitar
// el "flash" de tema incorrecto al cargar cualquier vista de /admin.
const THEME_INIT = `try{var t=localStorage.getItem('admin_theme')||'dark';document.documentElement.setAttribute('data-admin-theme',t);}catch(e){}`

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Se leen en el servidor para que el nombre/logo/color del menú lateral
  // estén presentes desde el primer render (sin parpadeo al recargar).
  const [name, logo, accent, features] = await Promise.all([
    getSetting('restaurant_name'),
    getSetting('profile_logo'),
    getSetting('sidebar_accent'),
    getFeatureFlags(),
  ])

  const scroll = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#E8912A'

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      {/* Sobreescribe --ad-accent con el color guardado en settings para que el scrollbar de globals.css lo tome */}
      <style dangerouslySetInnerHTML={{ __html: `:root { --ad-accent: ${scroll}; }` }} />
      <BrandProvider value={{ name, logo, accent, features }}>
        <FeatureGuard />
        {children}
        <AIChat />
      </BrandProvider>
    </>
  )
}
