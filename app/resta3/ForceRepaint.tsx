'use client'
import { useEffect } from 'react'

// Samsung Internet GPU corruption fix.
// Runs two display:none flushes:
//  rAF (~16ms)  — before Samsung Internet commits the initial tile cache
//  1500ms       — after API fetches complete and React re-renders data
export default function ForceRepaint() {
  useEffect(() => {
    const flush = () => {
      const b = document.body
      b.style.display = 'none'
      void b.offsetHeight
      b.style.display = ''
    }
    const id = requestAnimationFrame(flush)
    const t  = setTimeout(flush, 1500)
    return () => { cancelAnimationFrame(id); clearTimeout(t) }
  }, [])
  return null
}
