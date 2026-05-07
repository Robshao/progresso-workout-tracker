/**
 * Shared types and constants for the active-workout feature.
 * Imported by ActiveWorkoutPage, ExerciseBlockCard, and hooks.
 * DB-layer types live in src/lib/db/database.ts — do not duplicate them here.
 */

import type { SetType } from '../lib/db/database'
export type { SetType }

/* ── Reps units ──────────────────────────────────────────────── */
export type RepsUnit = '次' | '秒' | '分' | '時'
export const REPS_UNITS: RepsUnit[] = ['次', '秒', '分', '時']

/* ── Exercise catalogue (static seed data) ───────────────────── */
export const EXERCISES = [
  { id: 1,  name: '槓鈴臥推', equipment: '槓鈴',    group: '胸'   },
  { id: 2,  name: '上斜臥推', equipment: '啞鈴',    group: '胸'   },
  { id: 3,  name: '槓鈴深蹲', equipment: '槓鈴',    group: '腿'   },
  { id: 4,  name: '腿推機',   equipment: '機械',    group: '腿'   },
  { id: 5,  name: '硬舉',     equipment: '槓鈴',    group: '背'   },
  { id: 6,  name: '引體向上', equipment: '自體重量', group: '背'  },
  { id: 7,  name: '坐姿划船', equipment: '機械',    group: '背'   },
  { id: 8,  name: '肩推',     equipment: '啞鈴',    group: '肩'   },
  { id: 9,  name: '側平舉',   equipment: '啞鈴',    group: '肩'   },
  { id: 10, name: '二頭彎舉', equipment: '啞鈴',    group: '手臂' },
  { id: 11, name: '三頭下壓', equipment: '繩索',    group: '手臂' },
  { id: 12, name: '平板支撐', equipment: '自體重量', group: '核心'},
]
export type Exercise = typeof EXERCISES[number]

/* ── Set type color / label metadata ─────────────────────────── */
export const SET_TYPE_META: Record<SetType, { label: string; color: string; bg: string }> = {
  warmup:   { label: 'WU',   color: '#888888', bg: 'rgba(136,136,136,0.15)' },
  top_set:  { label: 'TOP',  color: '#cc1111', bg: 'rgba(204,17,17,0.18)'  },
  back_off: { label: 'BO',   color: '#cc8800', bg: 'rgba(204,136,0,0.18)'  },
  failure:  { label: 'FAIL', color: '#880000', bg: 'rgba(136,0,0,0.22)'    },
  drop_set: { label: 'DROP', color: '#aa2288', bg: 'rgba(170,34,136,0.18)' },
}
export const SET_TYPES = Object.keys(SET_TYPE_META) as SetType[]

/* ── In-session state types ───────────────────────────────────── */
export interface SetEntry {
  weight:  string
  reps:    string
  done:    boolean
  setType: SetType
  rir:     string   // '' | '0'–'5'
}
export interface ExerciseBlock {
  exercise: Exercise
  sets:     SetEntry[]
  repsUnit: RepsUnit
}

/** Default blank set — always starts as top_set */
export const kBlankSet = (): SetEntry => ({
  weight: '', reps: '', done: false, setType: 'top_set', rir: '',
})
