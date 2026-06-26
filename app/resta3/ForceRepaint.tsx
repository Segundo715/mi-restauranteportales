'use client'
import { useEffect } from 'react'

// Samsung Internet GPU corruption fix.
// The compositor pre-renders tiles at multiple Y offsets (scroll pre-fetch bug).
// Two strategies:
//  1. Disable the scroll compositor entirely on mobile (overflow:hidden)
//  2. Double flush: at 300ms (catches initial render) + at 1500ms (catches
//     post-API-fetch re-renders that happen after the first flush)
export default function ForceRepaint() {
  useEffect(() => {
    const mobile = window.innerWidth < 768

    if (mobile) {
      // Kill scroll compositor — without scrollability the bug cannot trigger
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    }

    const flush = () => {
      const b = document.body
      b.style.display = 'none'
      void b.offsetHeight
      b.style.display = ''
    }

    // Flush 1: cleans initial render corruption (~first paint)
    const t1 = setTimeout(flush, 300)
    // Flush 2: cleans corruption from API-data re-renders (fetch completes ~500ms)
    const t2 = setTimeout(flush, 1500)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return null
}
