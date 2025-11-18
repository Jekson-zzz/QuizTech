"use client"

import { useEffect } from "react"

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Service worker registered:', reg.scope)
      }).catch((err) => {
        console.warn('Service worker registration failed:', err)
      })
    }
  }, [])

  return null
}
