import Dexie, { type Table } from 'dexie'

/* ── Set type taxonomy ──────────────────────────────────────────
   Exported so Analytics module can import and use for filtering.
   Default is 'top_set'; all values are persisted as-is in IndexedDB.
──────────────────────────────────────────────────────────────── */
export type SetType = 'warmup' | 'top_set' | 'back_off' | 'failure' | 'drop_set'

export const SET_TYPE_DEFAULT: SetType = 'top_set'

export interface SavedSet {
  weight: string
  reps: string
  repsUnit: string
  done: boolean
  /** Set classification — optional for backward compat with v1 records */
  setType?: SetType
  /** Reps In Reserve: 0–5 intensity marker, undefined = not tracked */
  rir?: number
}

export interface SavedExercise {
  name: string
  group: string
  equipment: string
  repsUnit: string
  sets: SavedSet[]
}

export interface SavedWorkout {
  id: string
  startedAt: number
  endedAt: number
  durationSec: number
  exercises: SavedExercise[]
  totalVolume: number
  totalSets: number
}

/* ── Dexie DB ────────────────────────────────────────────────────
   sets/exercises are stored as JSON blobs inside the workout row —
   no separate tables, so no schema version bump is required when
   adding new fields to SavedSet or SavedExercise.
──────────────────────────────────────────────────────────────── */
class ProgressoDB extends Dexie {
  workouts!: Table<SavedWorkout>
  constructor() {
    super('ProgressoDB')
    this.version(1).stores({ workouts: 'id, startedAt, endedAt' })
  }
}

export const db = new ProgressoDB()
