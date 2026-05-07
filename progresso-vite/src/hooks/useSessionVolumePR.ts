/**
 * useSessionVolumePR — All-Time Best Session Volume
 *
 * Queries IndexedDB once on mount and returns the highest totalVolume
 * ever recorded in a single completed session. Read-only — does not
 * modify any data.
 *
 * The caller compares their live `totalVolume` to this value:
 *   if (totalVolume > allTimeBest && allTimeBest > 0) → Volume PR!
 *
 * allTimeBest === 0 while loading or if no sessions exist yet.
 * totalVolume === 0 means never exclude from PR check (no PR at zero).
 */

import { useEffect, useState } from 'react'
import { db } from '../lib/db/database'

export function useSessionVolumePR(): number {
  const [allTimeBest, setAllTimeBest] = useState(0)

  useEffect(() => {
    let cancelled = false
    db.workouts.toArray().then(all => {
      if (cancelled) return
      const best = all.reduce((max, w) => Math.max(max, w.totalVolume), 0)
      setAllTimeBest(best)
    })
    return () => { cancelled = true }
  }, [])

  return allTimeBest
}
