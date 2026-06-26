// Auth guard de RESTA3 + BrandProvider para que Resta3Nav pueda leer logo/nombre/acento del admin.
// La cookie resta3_session es independiente de admin_session y employee_session.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import { getSetting } from '@/lib/settingsDb'
import { getFeatureFlags } from '@/lib/features'
import BrandProvider from '@/app/components/BrandProvider'
import RightRail, { RightRailProvider, DesktopRail } from '@/app/components/RightRail'
import Resta3Nav from '@/app/components/Resta3Nav'

export const dynamic = 'force-dynamic'

const THEME_INIT = `try{var t=localStorage.getItem('admin_theme')||'dark';document.documentElement.setAttribute('data-admin-theme',t);}catch(e){}`

export default async function Resta3Layout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const session = jar.get('resta3_session')?.value
  if (!verifySession(session)) redirect('/resta3/login')

  const [name, logo, accent, r3Name, r3Logo, r3Accent, features] = await Promise.all([
    getSetting('restaurant_name'),
    getSetting('profile_logo'),
    getSetting('sidebar_accent'),
    getSetting('resta3_name'),
    getSetting('resta3_logo'),
    getSetting('resta3_accent'),
    getFeatureFlags(),
  ])

  const finalAccent = r3Accent || accent
  const accentCss = /^#[0-9a-fA-F]{6}$/.test(finalAccent) ? finalAccent : '#E8912A'

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --ad-accent: ${accentCss}; }
        html, body { overflow: hidden !important; }
      `}} />
      <BrandProvider value={{
        name:    r3Name   || name,
        logo:    r3Logo   || logo,
        accent:  finalAccent,
        features,
      }}>
        <RightRailProvider>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="relative md:flex">
              <Resta3Nav />
              <div className="flex-1 min-w-0">
                <RightRail>
                  {children}
                </RightRail>
              </div>
              <DesktopRail />
            </div>
          </div>
        </RightRailProvider>
      </BrandProvider>
    </>
  )
}
