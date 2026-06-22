'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { FeatureKey } from '@/lib/features'

// Feature flags (admin + global)
const ROUTE_FEATURE: Record<string, string> = {
  '/admin/analytics':        'analytics',
  '/admin/estadisticas':     'analytics',
  '/admin/marketing':        'marketing',
  '/admin/crm':              'crm',
  '/admin/reservaciones':    'reservaciones',
  '/admin/ventas':           'ventas',
  '/admin/menu':             'menu',
  '/admin/operaciones':      'operaciones',
  '/admin/tv':               'tv',
  '/admin/automatizaciones': 'automatizaciones',
  '/admin/contenido':        'contenido',
  '/admin/produccion':       'produccion',
  '/admin/reportes':         'reportes',
  '/admin/configuracion':    'configuracion',
  '/admin/reviews':          'reviews',
  '/admin/sellar':           'loyaltyCard',
  '/admin/tarjetas':         'loyaltyCard',
}

// Employee module permissions
const EMPLOYEE_ROUTE_MODULE: Record<string, string> = {
  '/employee/orders':    'emp_pedidos',
  '/employee/menu':      'emp_menu_ver',
  '/employee/recipes':   'emp_recetario',
  '/employee/customers': 'emp_clientes_ver',
  '/employee/tv':        'emp_pantalla_tv',
}


// Componente invisible que corre en el cliente después de cada navegación.
// Si el SuperAdmin desactivó el módulo al que se intenta acceder, redirige al inicio.
export default function FeatureGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Verificar feature flags del admin
    const feature = ROUTE_FEATURE[pathname]
    if (feature) {
      fetch('/api/features')
        .then(r => r.json())
        .then((flags: Record<FeatureKey, boolean>) => {
          if (flags[feature as FeatureKey] === false) router.replace('/admin')
        })
        .catch(() => {})
      return
    }

    // Verificar permisos del empleado
    const empModule = EMPLOYEE_ROUTE_MODULE[pathname]
    if (empModule) {
      fetch('/api/permissions')
        .then(r => r.json())
        .then((perms: { employee: Record<string, boolean>; user: Record<string, boolean> }) => {
          if (perms.employee[empModule] === false) router.replace('/employee')
        })
        .catch(() => {})
      return
    }

    // Verificar features de Resta3 (el segment de la URL coincide con el sufijo del flag)
    if (pathname.startsWith('/resta3/')) {
      const segment = pathname.split('/')[2] // tpv, mesas, cocina, etc.
      if (segment) {
        const fid = `r3_${segment}`
        fetch('/api/resta3/features')
          .then(r => r.json())
          .then((f: Record<string, boolean>) => {
            if (f[fid] === false) router.replace('/resta3')
          })
          .catch(() => {})
      }
      return
    }

    // Rutas de usuario/cliente: la visibilidad se maneja en CustomerNav, no con redirecciones.
  }, [pathname, router])

  return null
}
