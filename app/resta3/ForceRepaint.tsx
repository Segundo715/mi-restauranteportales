'use client'
import { useEffect } from 'react'

// Samsung Internet GPU tile corruption fix.
// The first paint on Samsung Internet corrupts GPU tiles (a browser-level bug).
// Forcing a full relayout+repaint on the SECOND frame causes a fresh render
// that bypasses the initialization bug.
export default function ForceRepaint() {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const b = document.body
      b.style.display = 'none'
      void b.offsetHeight
      b.style.display = ''
    })
    return () => cancelAnimationFrame(id)
  }, [])
  return null
}
