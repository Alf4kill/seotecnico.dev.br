'use client'

import { useEffect } from 'react'
import { initRum } from '@/lib/rum'

/** Monta o RUM próprio (src/lib/rum.ts) no client. Não renderiza nada. */
export function WebVitalsReporter() {
  useEffect(() => {
    initRum()
  }, [])
  return null
}
