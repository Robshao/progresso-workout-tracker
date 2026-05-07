/**
 * ActiveWorkoutPage — Orchestration Shell
 *
 * Owns: session state (blocks, timer, totals), exercise picker UI.
 * Delegates: per-exercise block rendering → ExerciseBlockCard
 *            rest timer logic          → useRestTimer
 *            rest timer UI             → RestTimerOverlay
 *            haptics / PR detection    → ExerciseBlockCard (internally)
 *            prev-record lookup        → ExerciseBlockCard (internally via usePrevRecord)
 *
 * Focus mode: when isResting, exercise block list gets .focus-dim class.
 * The RestTimerOverlay (position:fixed) appears above everything.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db/database'
import type { SetType } from '../../lib/db/database'
import { useLanguage } from '../../contexts/LanguageContext'
import { useRestTimer } from '../../hooks/useRestTimer'
import { useHaptics } from '../../hooks/useHaptics'
import { RestTimerOverlay } from '../../components/workout/RestTimerOverlay'
import { ExerciseBlockCard } from '../../components/workout/ExerciseBlockCard'
import {
  EXERCISES, REPS_UNITS, kBlankSet,
  type Exercise, type ExerciseBlock, type SetEntry, type RepsUnit,
} from '../../types/workout'

const DEFAULT_REST_SEC = 90

export default function ActiveWorkoutPage() {
  const navigate   = useNavigate()
  const { loc }    = useLanguage()
  const haptic     = useHaptics()
  const restTimer  = useRestTimer()

  const [elapsed, setElapsed]     = useState(0)
  const [startTime]               = useState(() => Date.now())  /* NEVER modified */
  const [blocks, setBlocks]       = useState<ExerciseBlock[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery]         = useState('')

  /* ── Session clock ──────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  const fmt = (s: number) =>
    [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')

  /* ── Totals — warmup excluded from volume ───────────────────── */
  const totalSets = blocks.reduce(
    (s, b) => s + b.sets.filter(x => x.done && x.setType !== 'warmup').length, 0,
  )
  const totalVolume = blocks.reduce(
    (s, b) => s + b.sets
      .filter(x => x.done && x.setType !== 'warmup' && b.repsUnit === '次')
      .reduce((s2, x) => s2 + (parseFloat(x.weight)||0) * (parseFloat(x.reps)||0), 0),
    0,
  )

  /* ── Save ───────────────────────────────────────────────────── */
  async function handleFinish() {
    haptic.abort()
    if (!confirm(loc.active.finalizeConfirm)) return
    const endedAt = Date.now()
    await db.workouts.add({
      id: crypto.randomUUID(), startedAt: startTime, endedAt,
      durationSec: Math.floor((endedAt - startTime) / 1000),
      exercises: blocks.map(b => ({
        name: b.exercise.name, group: b.exercise.group,
        equipment: b.exercise.equipment, repsUnit: b.repsUnit,
        sets: b.sets.map(s => ({
          weight: s.weight, reps: s.reps, repsUnit: b.repsUnit,
          done: s.done, setType: s.setType,
          rir: s.rir !== '' ? parseInt(s.rir, 10) : undefined,
        })),
      })),
      totalVolume, totalSets,
    })
    navigate('/workout')
  }

  /* ── Block mutations ────────────────────────────────────────── */
  function addExercise(ex: Exercise) {
    haptic.keypress()
    setBlocks(p => [...p, { exercise: ex, sets: [kBlankSet()], repsUnit: '次' }])
    setShowPicker(false); setQuery('')
  }

  function removeBlock(bi: number) {
    haptic.keypress()
    setBlocks(p => p.filter((_, i) => i !== bi))
  }

  function addSet(bi: number) {
    haptic.keypress()
    setBlocks(p => p.map((b, i) => i !== bi ? b : {
      ...b,
      sets: [...b.sets, {
        ...kBlankSet(),
        weight:  b.sets.at(-1)!.weight,
        reps:    b.sets.at(-1)!.reps,
        setType: b.sets.at(-1)!.setType,
      }],
    }))
  }

  /**
   * General-purpose set field updater.
   * field === 'repsUnit' (sentinel value -1 for blockIndex) updates the block's
   * repsUnit rather than a specific set field — this allows ExerciseBlockCard's
   * reps-unit selector to call onUpdateSet without needing a separate prop.
   */
  function updateSet(bi: number, si: number, field: keyof SetEntry | 'repsUnit', val: string | boolean | SetType | RepsUnit) {
    if (field === 'repsUnit') {
      setBlocks(p => p.map((b, i) => i !== bi ? b : { ...b, repsUnit: val as RepsUnit }))
      return
    }
    setBlocks(p => p.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => j !== si ? s : { ...s, [field]: val }),
    }))
  }

  const filtered = EXERCISES.filter(e => e.name.includes(query) || e.group.includes(query))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* ── Focus-mode rest timer overlay ────────────────────── */}
      {restTimer.isResting && restTimer.restSec !== null && (
        <RestTimerOverlay
          restSec={restTimer.restSec}
          totalSec={DEFAULT_REST_SEC}
          onDismiss={restTimer.dismiss}
        />
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className={`steel ${restTimer.isResting ? 'focus-dim' : 'focus-restore'}`}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'3px solid var(--primary)', flexShrink:0 }}>
        <button
          onClick={() => { if (confirm(loc.active.abortConfirm)) { haptic.abort(); navigate('/workout') } }}
          style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--text-muted)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.08em', padding:'8px 12px', cursor:'pointer' }}>
          ✕ {loc.active.abortBtn}
        </button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.12em' }}>{loc.active.statusLabel}</p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'28px', color:'var(--primary)', letterSpacing:'0.05em', lineHeight:1.1 }}>{fmt(elapsed)}</p>
        </div>
        <button
          onClick={handleFinish}
          style={{ background:'var(--primary)', border:'2px solid var(--primary)', boxShadow:'3px 3px 0 var(--primary-dark)', color:'#000', fontFamily:'var(--font-brutal)', fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', padding:'10px 14px', cursor:'pointer' }}>
          ■ {loc.active.lockInBtn}
        </button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div
        className={restTimer.isResting ? 'focus-dim' : 'focus-restore'}
        style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'var(--border)', borderBottom:'2px solid var(--border)', flexShrink:0 }}>
        {[
          [loc.active.ironMovedLabel, totalVolume > 0 ? `${totalVolume.toFixed(0)} KG` : '— KG'],
          [loc.active.setsDoneLabel,  String(totalSets)],
          [loc.active.movementsLabel, String(blocks.length)],
        ].map(([l, v]) => (
          <div key={l} style={{ background:'var(--surface-variant)', padding:'8px 4px', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'16px', color:'var(--primary)', fontWeight:700 }}>{v}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:'2px' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── Exercise blocks (dim during rest) ────────────────── */}
      <div
        className={restTimer.isResting ? 'focus-dim' : 'focus-restore'}
        style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {blocks.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', border:'2px solid var(--border)', borderLeft:'4px solid var(--text-dim)' }}>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'48px', color:'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'18px', color:'var(--text-muted)', marginTop:'12px' }}>{loc.active.noMovementsTitle}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)', marginTop:'6px' }}>{loc.active.noMovementsSub}</p>
          </div>
        ) : blocks.map((block, bi) => (
          <ExerciseBlockCard
            key={bi}
            block={block}
            blockIndex={bi}
            loc={loc}
            onUpdateSet={(si, field, val) => updateSet(bi, si, field as keyof SetEntry | 'repsUnit', val)}
            onAddSet={() => addSet(bi)}
            onRemoveBlock={() => removeBlock(bi)}
            onSetCompleted={() => restTimer.startRest(DEFAULT_REST_SEC)}
          />
        ))}
      </div>

      {/* ── Add movement CTA ─────────────────────────────────── */}
      <div
        className={restTimer.isResting ? 'focus-dim' : 'focus-restore'}
        style={{ flexShrink:0, padding:'12px 16px', borderTop:'2px solid var(--border)' }}>
        <button className="btn-brutal" onClick={() => setShowPicker(true)}>
          {loc.active.addMovementBtn}
        </button>
      </div>

      {/* ── Exercise picker sheet ─────────────────────────────── */}
      {showPicker && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)' }} onClick={() => setShowPicker(false)}/>
          {/* kIronDropUp: physics-based bottom-sheet entrance */}
          <div className="kIronDropUp" style={{ position:'relative', display:'flex', flexDirection:'column', maxHeight:'80vh', background:'var(--surface)', borderTop:'3px solid var(--primary)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'2px solid var(--border)', background:'var(--surface-variant)' }}>
              <p style={{ fontFamily:'var(--font-brutal)', fontSize:'18px', letterSpacing:'0.08em', color:'var(--text)' }}>▸ {loc.active.pickerTitle}</p>
              <button onClick={() => setShowPicker(false)} style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--text-muted)', fontFamily:'var(--font-mono)', padding:'6px 10px', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'12px 16px', background:'var(--bg)', border:'2px solid var(--border-heavy)', padding:'10px 14px' }}>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--primary)', fontSize:'14px' }}>&gt;</span>
              <input type="text" placeholder={loc.active.pickerSearch} value={query} onChange={e => setQuery(e.target.value)} autoFocus
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:'13px', letterSpacing:'0.05em' }}/>
            </div>
            <div style={{ overflowY:'auto', paddingBottom:'8px' }}>
              {filtered.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex)}
                  style={{ display:'flex', width:'100%', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', borderTop:'1px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
                  <div>
                    <p style={{ fontFamily:'var(--font-brutal)', fontSize:'15px', color:'var(--text)', letterSpacing:'0.04em' }}>{ex.name}</p>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>{ex.equipment} ╱ {ex.group}</p>
                  </div>
                  <span style={{ fontFamily:'var(--font-brutal)', fontSize:'20px', color:'var(--primary)' }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
