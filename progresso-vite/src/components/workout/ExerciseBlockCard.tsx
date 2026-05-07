/**
 * ExerciseBlockCard — NFGU Edition
 *
 * New in this version:
 *   • JaggedEdgeOverlay — SVG zigzag lines along all 4 borders, appear at RPE ≥ 9
 *   • kEdgePulse — crimson inset halo animation when any set reaches RPE ≥ 9 (RIR ≤ 1)
 *   • kShakeHeavy — amplified screen shake at RPE 10 (RIR = 0)
 *   • isVolumePR — overrides accent colors to neon green (#00ff41)
 *
 * RPE is derived from RIR: RPE = 10 - RIR.
 *   RIR 0 → RPE 10 (maximum effort / failure)
 *   RIR 1 → RPE 9  (one rep left)
 *   RIR ≥ 2 → normal intensity
 *
 * The edge glow and lightning decoration are purely cosmetic CSS/SVG —
 * they do not affect layout or persistence logic.
 */

import React, { useState } from 'react'
import type { SetType } from '../../lib/db/database'
import type { ExerciseBlock, SetEntry, RepsUnit } from '../../types/workout'
import { REPS_UNITS, SET_TYPE_META, SET_TYPES } from '../../types/workout'
import { useHaptics } from '../../hooks/useHaptics'
import { usePrevRecord } from '../../hooks/usePrevRecord'
import type { Locale } from '../../locales'

/* ── Wolf-teeth / lightning edge SVG ────────────────────────────
   Renders 4 polyline zigzag paths along the inner perimeter.
   Uses viewBox="0 0 100 100" + preserveAspectRatio="none" so it
   scales to any container size without JavaScript measurement.
   teeth=24 gives ~2.4px pitch per unit on a 240px-wide block.
──────────────────────────────────────────────────────────────── */
function JaggedEdgeOverlay({ color, visible }: { color: string; visible: boolean }) {
  if (!visible) return null
  const T   = 24          // number of teeth per edge
  const JAG = 3           // amplitude (in viewBox units, 0–100)

  function hEdge(flip: boolean) {
    return Array.from({ length: T + 1 }, (_, i) => {
      const x = (i / T) * 100
      const y = i % 2 === 0 ? 0 : JAG
      return `${x},${flip ? 100 - y : y}`
    }).join(' ')
  }
  function vEdge(flip: boolean) {
    return Array.from({ length: T + 1 }, (_, i) => {
      const y = (i / T) * 100
      const x = i % 2 === 0 ? 0 : JAG
      return `${flip ? 100 - x : x},${y}`
    }).join(' ')
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 4,
        opacity: 0.75,
      }}
    >
      <polyline points={hEdge(false)} stroke={color} strokeWidth="0.8" fill="none"/>
      <polyline points={hEdge(true)}  stroke={color} strokeWidth="0.8" fill="none"/>
      <polyline points={vEdge(false)} stroke={color} strokeWidth="0.8" fill="none"/>
      <polyline points={vEdge(true)}  stroke={color} strokeWidth="0.8" fill="none"/>
    </svg>
  )
}

/* ── Screen shake ────────────────────────────────────────────── */
function triggerShake(heavy = false) {
  const root = document.getElementById('root')
  if (!root) return
  const cls = heavy ? 'kShakeHeavy' : 'kShake'
  root.classList.remove('kShake', 'kShakeHeavy')
  void root.offsetWidth
  root.classList.add(cls)
  setTimeout(() => root.classList.remove(cls), heavy ? 500 : 400)
}

/* ── Shared input styles ────────────────────────────────────── */
const kInputBase: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--text)', fontFamily: 'var(--font-mono)',
  fontSize: '18px', fontWeight: 700, textAlign: 'center',
  padding: '10px 4px', width: '100%', outline: 'none',
}
const kRirBase: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  fontFamily: 'var(--font-mono)',
  fontSize: '14px', fontWeight: 700, textAlign: 'center',
  padding: '4px 2px', width: '36px', outline: 'none',
}

/* ── Props ──────────────────────────────────────────────────── */
interface Props {
  block:          ExerciseBlock
  blockIndex:     number
  loc:            Locale
  isVolumePR:     boolean          // activates fluorescent green mode
  onUpdateSet:    (si: number, field: keyof SetEntry, val: string | boolean | SetType) => void
  onAddSet:       () => void
  onRemoveBlock:  () => void
  onSetCompleted: () => void
}

export function ExerciseBlockCard({
  block, blockIndex: _bi, loc,
  isVolumePR,
  onUpdateSet, onAddSet, onRemoveBlock, onSetCompleted,
}: Props) {
  const haptic     = useHaptics()
  const prevRecord = usePrevRecord(block.exercise.name)

  const [flashKey, setFlashKey] = useState<string | null>(null)
  const [prKey,    setPrKey]    = useState<string | null>(null)

  /* ── Dynamic accent — neon green in Volume PR mode ─────────── */
  const accent     = isVolumePR ? '#00ff41' : 'var(--primary)'
  const accentDark = isVolumePR ? '#00882a' : 'var(--primary-dark)'
  const accentBg   = isVolumePR ? 'rgba(0,255,65,0.09)'   : 'rgba(204,17,17,0.09)'
  const accentMeta = isVolumePR ? 'rgba(0,255,65,0.05)'   : 'rgba(204,17,17,0.05)'
  const accentRir  = isVolumePR ? '#00ff41' : 'var(--primary)'

  /* ── High-RPE detection (derives RPE from RIR) ─────────────── */
  const doneSets = block.sets.filter(s => s.done && s.setType !== 'warmup')
  const isHighIntensity = doneSets.some(s => s.rir !== '' && parseInt(s.rir) <= 1) // RPE ≥ 9
  const isMaxIntensity  = doneSets.some(s => s.rir === '0')                        // RPE 10

  /* ── Edge decoration colors ─────────────────────────────────── */
  // Normal high-RPE: dark steel gray zigzag + crimson edge pulse
  // Volume PR mode: neon green zigzag
  const jagColor = isVolumePR ? 'rgba(0,255,65,0.6)' : 'rgba(70,70,70,0.9)'

  /* ── Completion handler ─────────────────────────────────────── */
  function handleDoneToggle(si: number) {
    const set     = block.sets[si]
    const newDone = !set.done

    if (newDone) {
      const currentKg = parseFloat(set.weight) || 0
      const isSetPR   =
        prevRecord !== null &&
        currentKg > prevRecord.bestWeightKg &&
        set.setType !== 'warmup' &&
        currentKg > 0

      const rirVal = set.rir !== '' ? parseInt(set.rir) : null
      const isRpe10 = rirVal === 0

      if (isSetPR) {
        haptic.pr()
        setPrKey(String(si))
        setTimeout(() => setPrKey(null), 900)
        triggerShake(isRpe10)
      } else {
        haptic.setDone()
        setFlashKey(String(si))
        setTimeout(() => setFlashKey(null), 450)
        if (isRpe10) triggerShake(true)  // heavy shake at RPE 10 even without PR
        else         triggerShake(false)
      }

      onSetCompleted()
    } else {
      haptic.keypress()
    }

    onUpdateSet(si, 'done', newDone)
  }

  return (
    <div
      className={isHighIntensity ? 'kEdgePulse' : undefined}
      style={{
        position: 'relative',
        border: `2px solid ${isHighIntensity ? accent : 'var(--border)'}`,
        borderTop: `3px solid ${accent}`,
        background: 'var(--surface)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* ── Wolf-teeth edge decoration (RPE ≥ 9) ──────────────── */}
      <JaggedEdgeOverlay color={jagColor} visible={isHighIntensity} />

      {/* ── Exercise header ─────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:5, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`2px solid var(--border)`, background:'var(--surface-variant)' }}>
        <div>
          <p style={{ fontFamily:'var(--font-brutal)', fontSize:'16px', color:'var(--text)', letterSpacing:'0.05em' }}>
            {block.exercise.name}
          </p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
            {block.exercise.equipment} ╱ {block.exercise.group}
            {prevRecord && (
              <span style={{ color: accent, marginLeft:'8px' }}>
                ▸ PR {prevRecord.bestWeightKg}kg
              </span>
            )}
            {isMaxIntensity && (
              <span style={{ color:'#cc1111', marginLeft:'8px', fontFamily:'var(--font-brutal)', fontSize:'9px', letterSpacing:'0.2em' }}>
                ◆ RPE 10
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onRemoveBlock}
          style={{ background:'transparent', border:`2px solid var(--border-heavy)`, color:accent, fontFamily:'var(--font-mono)', fontSize:'14px', padding:'6px 10px', cursor:'pointer' }}>
          ✕
        </button>
      </div>

      {/* ── Column headers ──────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:5, display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'8px 14px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.1em' }}>#</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.1em' }}>KG</span>
        <div style={{ position:'relative' }}>
          <select
            value={block.repsUnit}
            onChange={e => onUpdateSet(-1, 'repsUnit' as keyof SetEntry, e.target.value as RepsUnit)}
            style={{ width:'100%', background:'var(--bg)', border:`2px solid ${accent}`, color:accent, fontFamily:'var(--font-brutal)', fontSize:'11px', letterSpacing:'0.08em', padding:'3px 18px 3px 6px', cursor:'pointer', textAlign:'center' }}>
            {REPS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span style={{ position:'absolute', right:'4px', top:'50%', transform:'translateY(-50%)', color:accent, fontSize:'8px', pointerEvents:'none' }}>▼</span>
        </div>
        <span style={{ fontFamily:'var(--font-brutal)', fontSize:'8px', color:accent, textAlign:'center', letterSpacing:'0.08em' }}>
          {loc.active.doneColHeader}
        </span>
      </div>

      {/* ── Set rows ────────────────────────────────────────────── */}
      {block.sets.map((set, si) => {
        const isWarmup = set.setType === 'warmup'
        const isSetPR  = prKey    === String(si)
        const isFlash  = flashKey === String(si)

        const rirVal     = set.rir !== '' ? parseInt(set.rir) : null
        const setIsHighR = set.done && rirVal !== null && rirVal <= 1 && !isWarmup

        const showSuggestion = prevRecord !== null && set.weight === '' && !isWarmup

        /* Per-set done button colors */
        const btnBg = set.done
          ? (isSetPR ? 'linear-gradient(135deg,#cc1111,#ffb400)' : accent)
          : 'linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%)'
        const btnBorder = set.done
          ? (isSetPR ? '#ffb400' : accent)
          : 'var(--border-heavy)'
        const btnShadow = set.done
          ? (isSetPR
            ? '0 0 16px rgba(255,180,0,0.6), 3px 3px 0 #993300'
            : `0 0 12px ${isVolumePR ? 'rgba(0,255,65,0.4)' : 'rgba(204,17,17,0.4)'}, 3px 3px 0 ${accentDark}`)
          : '2px 2px 0 #000'

        return (
          <div key={si} style={{ position:'relative', zIndex:5 }}>
            {/* Main input row */}
            <div style={{
              display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px',
              gap:'4px', padding:'4px 14px 0',
              background: set.done ? accentBg : undefined,
              /* Extra crimson tint on high-RPE done rows */
              boxShadow: setIsHighR && !isVolumePR
                ? 'inset 3px 0 0 rgba(204,17,17,0.5)'
                : undefined,
              alignItems:'stretch', minHeight:'54px',
            }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color:isWarmup?'var(--text-dim)':'var(--text-muted)', display:'flex', alignItems:'center' }}>
                {si + 1}
              </span>

              <div style={{ position:'relative' }}>
                <input
                  type="number" inputMode="decimal" placeholder="0"
                  value={set.weight}
                  onChange={e => onUpdateSet(si, 'weight', e.target.value)}
                  style={{ ...kInputBase, opacity:isWarmup?0.6:1 }}
                />
                {showSuggestion && (
                  <span style={{
                    position:'absolute', bottom:'-16px', left:0, right:0,
                    fontFamily:'var(--font-mono)', fontSize:'9px',
                    color: isVolumePR ? 'rgba(0,255,65,0.5)' : 'var(--text-dim)',
                    textAlign:'center', letterSpacing:'0.05em',
                    pointerEvents:'none', whiteSpace:'nowrap',
                  }}>
                    ↑ {prevRecord!.suggestedKg}
                  </span>
                )}
              </div>

              <input
                type="number" inputMode="decimal" placeholder={block.repsUnit}
                value={set.reps}
                onChange={e => onUpdateSet(si, 'reps', e.target.value)}
                style={{ ...kInputBase, opacity:isWarmup?0.6:1 }}
              />

              <button
                className={isSetPR ? 'kPRFlash' : isFlash ? 'kDoneFlash' : undefined}
                onClick={() => handleDoneToggle(si)}
                style={{
                  minHeight:'54px', background:btnBg,
                  border:`3px solid ${btnBorder}`, color:set.done?'#000':'var(--text-muted)',
                  fontFamily:'var(--font-brutal)', fontSize:set.done?'22px':'18px',
                  fontWeight:900, cursor:'pointer', boxShadow:btnShadow,
                  transition:'background 0.12s,box-shadow 0.12s,color 0.12s',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                {set.done ? (isSetPR ? '★' : '✓') : '■'}
              </button>
            </div>

            {/* Meta row: set type pills + RIR */}
            <div style={{
              display:'flex', alignItems:'center', gap:'4px',
              padding:'6px 14px 8px',
              marginTop: showSuggestion ? '14px' : '0',
              background: set.done ? accentMeta : undefined,
              borderBottom:'1px solid var(--border)',
            }}>
              {SET_TYPES.map(type => {
                const m      = SET_TYPE_META[type]
                const active = set.setType === type
                return (
                  <button
                    key={type}
                    onClick={() => { haptic.keypress(); onUpdateSet(si, 'setType', type) }}
                    style={{
                      padding:'3px 7px',
                      background: active ? m.bg : 'transparent',
                      border:`2px solid ${active ? m.color : 'var(--border-heavy)'}`,
                      color: active ? m.color : 'var(--text-dim)',
                      fontFamily:'var(--font-brutal)', fontSize:'9px',
                      fontWeight:700, letterSpacing:'0.06em', cursor:'pointer',
                      transition:'border-color 0.1s,color 0.1s,background 0.1s',
                      boxShadow: active ? `0 0 6px ${m.color}44` : 'none',
                    }}>
                    {m.label}
                  </button>
                )
              })}

              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ fontFamily:'var(--font-brutal)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>RIR</span>
                <input
                  type="number" inputMode="numeric"
                  min={0} max={5} placeholder="—"
                  value={set.rir}
                  onChange={e => {
                    const v = e.target.value
                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 5))
                      onUpdateSet(si, 'rir', v)
                  }}
                  style={{ ...kRirBase, color: accentRir }}
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        onClick={() => { haptic.keypress(); onAddSet() }}
        style={{ position:'relative', zIndex:5, width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:'2px dashed var(--border-heavy)', color:accent, fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.1em', cursor:'pointer' }}>
        {loc.active.addSetBtn}
      </button>
    </div>
  )
}
