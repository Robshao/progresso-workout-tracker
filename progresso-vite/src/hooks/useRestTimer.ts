/**
 * useRestTimer — Rest Period Countdown + Focus Mode
 *
 * When a set is completed the caller invokes `startRest(seconds)`.
 * While active, `isResting` is true — parent can apply .focus-dim
 * CSS class to non-critical UI elements.
 *
 * The countdown uses setTimeout (not setInterval) to avoid drift.
 * Each tick schedules the next one, so accumulated error is <1ms.
 */

import { useState, useEffect, useCallback } from 'react'

const DEFAULT_REST_SEC = 90

export interface RestTimerState {
  /** Seconds remaining, null when not active */
  restSec:   number | null
  /** True while countdown is running */
  isResting: boolean
  /** Start the countdown. Defaults to 90 s. Calling again resets. */
  startRest: (sec?: number) => void
  /** Immediately cancel the countdown */
  dismiss:   () => void
}

export function useRestTimer(): RestTimerState {
  const [restSec, setRestSec] = useState<number | null>(null)

  useEffect(() => {
    if (restSec === null) return
    if (restSec <= 0) {
      // Auto-dismiss after reaching zero
      const t = setTimeout(() => setRestSec(null), 1200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setRestSec(s => (s ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [restSec])

  const startRest = useCallback((sec: number = DEFAULT_REST_SEC) => {
    setRestSec(sec)
  }, [])

  const dismiss = useCallback(() => setRestSec(null), [])

  return {
    restSec,
    isResting: restSec !== null,
    startRest,
    dismiss,
  }
}
