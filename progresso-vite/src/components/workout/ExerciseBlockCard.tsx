/**
 * ExerciseBlockCard — Self-Contained Exercise Block
 *
 * Owns per-block logic that requires hooks:
 *   - usePrevRecord: async lookup of historical best for this exercise
 *   - useHaptics:    kinetic feedback with PR detection
 *   - flashKey:      set-completion CSS animation key
 *   - prKey:         PR achievement CSS animation key
 *
 * PR detection: when a set is marked done, current KG is compared to
 * the all-time best. If it exceeds it (and is not a warmup), the PR
 * haptic pattern fires and a gold glow animation plays on the done btn.
 *
 * Smart pre-fill: prevRecord.suggestedKg is shown as ghost text below
 * the KG input on any set row where weight is currently empty.
 *
 * Warmup dimming: when setType === 'warmup', input opacity drops to 0.6
 * to visually signal that this row won't count toward volume — mirroring
 * the "dim if warmup" spec for previous-record badge.
 */

import React, { useState } from 'react'
import type { SetType } from '../../lib/db/database'
import type { ExerciseBlock, SetEntry, RepsUnit } from '../../types/workout'
import { REPS_UNITS, SET_TYPE_META, SET_TYPES } from '../../types/workout'
import { useHaptics } from '../../hooks/useHaptics'
import { usePrevRecord } from '../../hooks/usePrevRecord'
import type { Locale } from '../../locales'

/* ── Shared input styles ────────────────────────────────────── */
const kInputSty: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--text)', fontFamily: 'var(--font-mono)',
  fontSize: '18px', fontWeight: 700, textAlign: 'center',
  padding: '10px 4px', width: '100%', outline: 'none',
}
const kRirSty: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--primary)', fontFamily: 'var(--font-mono)',
  fontSize: '14px', fontWeight: 700, textAlign: 'center',
  padding: '4px 2px', width: '36px', outline: 'none',
}

/* ── Props ──────────────────────────────────────────────────── */
interface Props {
  block:          ExerciseBlock
  blockIndex:     number
  loc:            Locale
  onUpdateSet:    (si: number, field: keyof SetEntry, val: string | boolean | SetType) => void
  onAddSet:       () => void
  onRemoveBlock:  () => void
  onSetCompleted: () => void   // triggers rest timer in parent
}

export function ExerciseBlockCard({
  block, blockIndex: _bi, loc,
  onUpdateSet, onAddSet, onRemoveBlock, onSetCompleted,
}: Props) {
  const haptic    = useHaptics()
  const prevRecord = usePrevRecord(block.exercise.name)

  const [flashKey, setFlashKey] = useState<string | null>(null)  // set-done glow
  const [prKey,    setPrKey]    = useState<string | null>(null)   // PR gold glow

  /* ── Completion handler — PR detection lives here ─────────── */
  function handleDoneToggle(si: number) {
    const set      = block.sets[si]
    const newDone  = !set.done

    if (newDone) {
      const currentKg = parseFloat(set.weight) || 0
      const isPR =
        prevRecord !== null &&
        currentKg > prevRecord.bestWeightKg &&
        set.setType !== 'warmup' &&
        currentKg > 0

      if (isPR) {
        haptic.pr()
        setPrKey(String(si))
        setTimeout(() => setPrKey(null), 900)
      } else {
        haptic.setDone()
        setFlashKey(String(si))
        setTimeout(() => setFlashKey(null), 450)
      }

      // Notify parent to start rest timer
      onSetCompleted()
    } else {
      haptic.keypress()
    }

    onUpdateSet(si, 'done', newDone)
  }

  return (
    <div style={{ border:'2px solid var(--border)', borderTop:'3px solid var(--primary)', background:'var(--surface)' }}>

      {/* ── Exercise header ───────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'2px solid var(--border)', background:'var(--surface-variant)' }}>
        <div>
          <p style={{ fontFamily:'var(--font-brutal)', fontSize:'16px', color:'var(--text)', letterSpacing:'0.05em' }}>
            {block.exercise.name}
          </p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
            {block.exercise.equipment} ╱ {block.exercise.group}
            {prevRecord && (
              <span style={{ color:'var(--primary)', marginLeft:'8px' }}>
                ▸ PR {prevRecord.bestWeightKg}kg
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onRemoveBlock}
          style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-mono)', fontSize:'14px', padding:'6px 10px', cursor:'pointer' }}>
          ✕
        </button>
      </div>

      {/* ── Column headers ────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'8px 14px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.1em' }}>#</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.1em' }}>KG</span>
        {/* Reps-unit selector */}
        <div style={{ position:'relative' }}>
          <select
            value={block.repsUnit}
            onChange={e => onUpdateSet(-1, 'repsUnit' as keyof SetEntry, e.target.value as RepsUnit)}
            style={{ width:'100%', background:'var(--bg)', border:'2px solid var(--primary)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'11px', letterSpacing:'0.08em', padding:'3px 18px 3px 6px', cursor:'pointer', textAlign:'center' }}>
            {REPS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span style={{ position:'absolute', right:'4px', top:'50%', transform:'translateY(-50%)', color:'var(--primary)', fontSize:'8px', pointerEvents:'none' }}>▼</span>
        </div>
        <span style={{ fontFamily:'var(--font-brutal)', fontSize:'8px', color:'var(--primary)', textAlign:'center', letterSpacing:'0.08em' }}>
          {loc.active.doneColHeader}
        </span>
      </div>

      {/* ── Set rows ──────────────────────────────────────────── */}
      {block.sets.map((set, si) => {
        const meta      = SET_TYPE_META[set.setType]
        const isWarmup  = set.setType === 'warmup'
        const isFlasPR  = prKey === String(si)
        const isFlash   = flashKey === String(si)

        /* Show suggestion only when weight is empty and we have a record */
        const showSuggestion = prevRecord !== null && set.weight === '' && !isWarmup

        return (
          <div key={si}>
            {/* Main input row */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'4px 14px 0', background:set.done?'rgba(204,17,17,0.09)':undefined, alignItems:'stretch', minHeight:'54px' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color:isWarmup?'var(--text-dim)':'var(--text-muted)', display:'flex', alignItems:'center' }}>
                {si + 1}
              </span>

              {/* KG input — with ghost suggestion below */}
              <div style={{ position:'relative' }}>
                <input
                  type="number" inputMode="decimal" placeholder="0"
                  value={set.weight}
                  onChange={e => onUpdateSet(si, 'weight', e.target.value)}
                  style={{ ...kInputSty, opacity:isWarmup?0.6:1 }}
                />
                {showSuggestion && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-16px', left: 0, right: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    ↑ {prevRecord!.suggestedKg}
                  </span>
                )}
              </div>

              <input
                type="number" inputMode="decimal" placeholder={block.repsUnit}
                value={set.reps}
                onChange={e => onUpdateSet(si, 'reps', e.target.value)}
                style={{ ...kInputSty, opacity:isWarmup?0.6:1 }}
              />

              {/* Done button — PR gets gold glow, normal gets crimson flash */}
              <button
                className={isFlasPR ? 'kPRFlash' : isFlash ? 'kDoneFlash' : undefined}
                onClick={() => handleDoneToggle(si)}
                style={{
                  minHeight: '54px',
                  background: set.done
                    ? (isFlasPR ? 'linear-gradient(135deg,#cc1111,#ffb400)' : 'var(--primary)')
                    : 'linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%)',
                  border: `3px solid ${set.done?(isFlasPR?'#ffb400':'var(--primary)'):'var(--border-heavy)'}`,
                  color: set.done ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-brutal)',
                  fontSize: set.done ? '22px' : '18px',
                  fontWeight: 900, cursor: 'pointer',
                  boxShadow: set.done
                    ? (isFlasPR
                      ? '0 0 16px rgba(255,180,0,0.6), 3px 3px 0 #993300'
                      : '0 0 12px rgba(204,17,17,0.4), 3px 3px 0 var(--primary-dark)')
                    : '2px 2px 0 #000',
                  transition: 'background 0.12s, box-shadow 0.12s, color 0.12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {set.done ? (isFlasPR ? '★' : '✓') : '■'}
              </button>
            </div>

            {/* Meta row: set type pills + RIR input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 14px 8px',
              marginTop: showSuggestion ? '12px' : '0',   // space for suggestion text
              background: set.done?'rgba(204,17,17,0.05)':undefined,
              borderBottom: '1px solid var(--border)',
            }}>
              {SET_TYPES.map(type => {
                const m      = SET_TYPE_META[type]
                const active = set.setType === type
                return (
                  <button
                    key={type}
                    onClick={() => { haptic.keypress(); onUpdateSet(si, 'setType', type) }}
                    style={{
                      padding: '3px 7px',
                      background: active ? m.bg : 'transparent',
                      border: `2px solid ${active ? m.color : 'var(--border-heavy)'}`,
                      color: active ? m.color : 'var(--text-dim)',
                      fontFamily: 'var(--font-brutal)',
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'border-color 0.1s, color 0.1s, background 0.1s',
                      boxShadow: active ? `0 0 6px ${m.color}44` : 'none',
                    }}>
                    {m.label}
                  </button>
                )
              })}

              {/* RIR input */}
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ fontFamily:'var(--font-brutal)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>RIR</span>
                <input
                  type="number" inputMode="numeric"
                  min={0} max={5} placeholder="—"
                  value={set.rir}
                  onChange={e => {
                    const v = e.target.value
                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 5)) {
                      onUpdateSet(si, 'rir', v)
                    }
                  }}
                  style={kRirSty}
                />
              </div>
            </div>
          </div>
        )
      })}

      {/* Add set */}
      <button
        onClick={() => { haptic.keypress(); onAddSet() }}
        style={{ width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:'2px dashed var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.1em', cursor:'pointer' }}>
        {loc.active.addSetBtn}
      </button>
    </div>
  )
}
