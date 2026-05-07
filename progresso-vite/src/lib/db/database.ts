import Dexie, { type Table } from 'dexie'

export interface SavedSet {
  weight: string
  reps: string
  repsUnit: string
  done: boolean
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

class ProgressoDB extends Dexie {
  workouts!: Table<SavedWorkout>
  constructor() {
    super('ProgressoDB')
    this.version(1).stores({ workouts: 'id, startedAt, endedAt' })
  }
}

export const db = new ProgressoDB()
