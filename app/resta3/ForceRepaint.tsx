'use client'
import { useEffect } from 'react'

// Samsung Internet GPU tile corruption fix.
// The initial paint commits corrupted GPU tiles (browser-level bug).
// Waiting 300ms ensures the GPU commit is done, then two consecutive
// display:none flushes force Samsung Internet to fully discard and
// re-rasterize all tiles cleanly.
export default function ForceRepaint() {
  useEffect(() => {
    const id = setTimeout(() => {
      const b = document.body
      const flush = () => { b.style.display = 'none'; void b.offsetHeight; b.style.display = '' }
      flush()
      setTimeout(flush, 50)
    }, 300)
    return () => clearTimeout(id)
  }, [])
  return null
}
