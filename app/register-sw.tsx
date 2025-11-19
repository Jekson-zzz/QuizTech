"use client"

import { useEffect } from "react"

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Service worker registered:', reg.scope)

        // Listen for waiting service worker (update found)
        if (reg.waiting) {
          // There's an updated SW waiting to activate
          promptUserToRefresh(reg);
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              promptUserToRefresh(reg)
            }
          })
        })
      }).catch((err) => {
        console.warn('Service worker registration failed:', err)
      })
    }
  }, [])

  return null
}

function promptUserToRefresh(reg: ServiceWorkerRegistration) {
  try {
    // Simple UX: ask user to reload; you can replace with a custom UI
    const shouldReload = confirm('Hay una nueva versión disponible. ¿Deseas recargar para actualizar?')
    if (!shouldReload) return

    if (reg.waiting) {
      // Tell the waiting SW to skip waiting, so it becomes active
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      // After skipWaiting, the page should be reloaded to use the new SW
      reg.waiting.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') window.location.reload()
      })
    }
  } catch (err) {
    console.warn('Error asking user to refresh for SW update', err)
  }
}
