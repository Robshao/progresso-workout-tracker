/**
 * usePrevRecord — Historical Personal Record Lookup
 *
 * Queries IndexedDB (via Dexie) for the highest weight ever logged
 * on a given exercise across all completed sets. Runs once on mount
 * and whenever exerciseName changes.
 *
 * Returns null while loading or if no record exists.
 * Does NOT modify any data — read-only, offline-first.
 *
 * suggestedKg = bestWeightKg + 2.5 (standard progressive overload increment).
 * The Analytics module can import PrevRecord type for its own use.
 */

import { useEffect, useState } from 'react'
import { db } from '../lib/db/database'

export interface PrevRecord {
  /** All-time best completed weight for this exercise (kg) */
  bestWeightKg: number
  /** Progressive overload suggestion: bestWeightKg + 2.5 */
  suggestedKg:  number
  /** When that PR was set */
  sessionDate:  Date
}

export function usePrevRecord(exerciseName: string): PrevRecord | null {
  const [record, setRecord] = useState<PrevRecord | null>(null)

  useEffect(() => {
    if (!exerciseName) return
    let cancelled = false

    db.workouts
      .orderBy('startedAt')
      .reverse()
      .toArray()
      .then(workouts => {
        if (cancelled) return

        let bestKg   = 0
        let bestDate = 0

        for (const w of workouts) {
          for (const ex of w.exercises) {
            if (ex.name !== exerciseName) continue
            for (const s of ex.sets) {
              if (!s.done) continue
              // Warmup sets are excluded from PR tracking
              if (s.setType === 'warmup') continue
              const kg = parseFloat(s.weight)
              if (!isNaN(kg) && kg > bestKg) {
                bestKg   = kg
                bestDate = w.startedAt
              }
            }
          }
        }

        setRecord(bestKg > 0
          ? { bestWeightKg: bestKg, suggestedKg: bestKg + 2.5, sessionDate: new Date(bestDate) }
          : null
        )
      })

    return () => { cancelled = true }
  }, [exerciseName])

  return record
}
