'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminResta3Redirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/configuracion') }, [router])
  return null
}
