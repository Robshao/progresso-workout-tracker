/**
 * RestTimerOverlay — NFGU Edition
 *
 * New systems:
 *   1. NFGU Lock: when user taps SKIP with >30s remaining, show
 *      "READY TO QUIT? OR READY TO GROW?" — must long-press 1.5s to confirm.
 *      Uses requestAnimationFrame (not setInterval) for smooth progress.
 *      Haptic feedback escalates during the hold (simulates muscle loading).
 *
 *   2. Micro-copy: last 10 seconds + hasHighRPE → rotating NFGU quote in
 *      Impact-style brutalist font. Cycles deterministically from a curated list.
 *
 * The inner content wrapper carries kIronDropUp on mount.
 * The NFGU lock panel uses kIronDropDown (top-to-bottom settle).
 */

import React, { useState, useRef, useCallback, useMemo } from 'react'

/* ── NFGU quote pool ────────────────────────────────────────────
   Shown when restSec ≤ 10 AND hasHighRPE.
   Rotates by session-elapsed seconds to avoid repeating.
──────────────────────────────────────────────────────────────── */
const NFGU_QUOTES = [
  'ONE MORE REP.',
  'EARN YOUR REST.',
  'THE PUMP IS TEMPORARY.\nPRIDE IS FOREVER.',
  'PAIN IS WEAKNESS\nLEAVING THE BODY.',
  "DON'T COUNT THE REPS.\nMAKE THE REPS COUNT.",
  'SUFFER NOW.\nDOMINATE LATER.',
  'WHEN YOUR MIND QUITS,\nYOUR BODY HAS MORE.',
] as const

const LONG_PRESS_MS   = 1500   // ms to hold before skip is confirmed
const NFGU_LOCK_SEC   = 20     // seconds remaining threshold to trigger lock

/* ── Props ──────────────────────────────────────────────────── */
interface Props {
  restSec:     number
  totalSec?:   number
  hasHighRPE?: boolean    // drives micro-copy display
  onDismiss:   () => void // only called after NFGU lock confirmation (or restSec ≤ 30)
}

export function RestTimerOverlay({ restSec, totalSec = 90, hasHighRPE = false, onDismiss }: Props) {
  const mins   = Math.floor(restSec / 60)
  const secs   = restSec % 60
  const pct    = Math.max(0, (restSec / totalSec) * 100)
  const isDone = restSec <= 0

  /* ── Lock screen state ─────────────────────────────────────── */
  const [showLock, setShowLock]         = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)   // 0–1
  const holdStartRef  = useRef<number | null>(null)
  const rafRef        = useRef<number | null>(null)

  /* ── Micro-copy: randomised on mount, stable during countdown ── */
  // useMemo with no deps → runs once per component instance (each rest period)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quoteIndex    = useMemo(() => Math.floor(Math.random() * NFGU_QUOTES.length), [])
  const showMicrocopy = !isDone && restSec <= 10 && hasHighRPE

  /* ── Skip button handler ────────────────────────────────────── */
  function handleSkipAttempt() {
    if (restSec > NFGU_LOCK_SEC) {
      setShowLock(true)   // intercept — show NFGU lock
    } else {
      onDismiss()         // allowed — rest is almost done
    }
  }

  /* ── Long-press via requestAnimationFrame ───────────────────── */
  const startHold = useCallback(() => {
    holdStartRef.current = performance.now()

    function tick() {
      if (holdStartRef.current === null) return
      const elapsed  = performance.now() - holdStartRef.current
      const progress = Math.min(elapsed / LONG_PRESS_MS, 1)

      setHoldProgress(progress)

      // Escalating haptic: 15ms at start → 80ms at full hold
      const vibMs = Math.floor(15 + progress * 65)
      try { navigator.vibrate(vibMs) } catch (_) {}

      if (progress >= 1) {
        holdStartRef.current = null
        setHoldProgress(0)
        setShowLock(false)
        onDismiss()
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onDismiss])

  const endHold = useCallback(() => {
    holdStartRef.current = null
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    try { navigator.vibrate(0) } catch (_) {}  // cancel any ongoing vibration
    setHoldProgress(0)
  }, [])

  /* ── NFGU Lock screen ───────────────────────────────────────── */
  if (showLock) {
    return (
      <div style={{
        position:'fixed', inset:0, zIndex:110,
        background:'rgba(4,4,4,0.98)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <div
          className="kIronDropDown"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'28px', padding:'0 32px', width:'100%' }}>

          {/* Skull divider */}
          <p style={{ fontFamily:'var(--font-brutal)', fontSize:'44px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>
            ☠
          </p>

          {/* Challenge copy — Impact-style maximum-weight feeling */}
          <div style={{ textAlign:'center' }}>
            <p style={{
              fontFamily: "'Impact', 'Arial Narrow', var(--font-brutal)",
              fontSize: '28px',
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '0.06em',
              lineHeight: 1.15,
              textTransform: 'uppercase',
            }}>
              READY TO QUIT?
            </p>
            <p style={{
              fontFamily: "'Impact', 'Arial Narrow', var(--font-brutal)",
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--primary)',
              letterSpacing: '0.08em',
              marginTop: '8px',
              textTransform: 'uppercase',
            }}>
              OR READY TO GROW?
            </p>
          </div>

          {/* Remaining time reminder */}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
          }}>
            {`${String(mins).padStart(1,'0')}:${String(secs).padStart(2,'0')} REMAINING`}
          </p>

          {/* Long-press hold button */}
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{
              fontFamily:'var(--font-mono)', fontSize:'10px',
              color:'var(--text-dim)', textAlign:'center', letterSpacing:'0.15em',
            }}>
              HOLD TO CONFIRM SKIP
            </p>

            {/* Progress track */}
            <div style={{
              width:'100%', height:'4px',
              background:'var(--surface-variant)',
              border:'1px solid var(--border-heavy)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', left:0, top:0, bottom:0,
                width:`${holdProgress * 100}%`,
                background:`linear-gradient(90deg, var(--primary) 0%, #ff4400 100%)`,
                boxShadow:`0 0 8px var(--primary)`,
                transition:'none',
              }}/>
            </div>

            {/* The hold button */}
            <button
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              style={{
                width:'100%', padding:'20px 0',
                background: holdProgress > 0
                  ? `rgba(204,17,17,${0.06 + holdProgress * 0.2})`
                  : 'transparent',
                border:`2px solid ${holdProgress > 0 ? 'var(--primary)' : 'var(--border-heavy)'}`,
                color: holdProgress > 0 ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily:"'Impact', 'Arial Narrow', var(--font-brutal)",
                fontSize:'15px', letterSpacing:'0.25em',
                cursor:'pointer', userSelect:'none',
                touchAction:'none',
                transition:'background 0.1s, border-color 0.1s, color 0.1s',
              }}>
              {holdProgress > 0.95 ? 'RELEASING...' : 'SKIP REST'}
            </button>
          </div>

          {/* Cancel — go back to rest */}
          {/* padding: 14px vertical → 28px+ touch height (content ~16px) = 44px ✓ */}
          <button
            onClick={() => { endHold(); setShowLock(false) }}
            style={{
              background:'transparent', border:'none',
              color:'var(--text-muted)', fontFamily:'var(--font-mono)',
              fontSize:'11px', letterSpacing:'0.12em', cursor:'pointer',
              textDecoration:'underline', padding:'14px 24px',
              minHeight:'44px',
            }}>
            continue resting
          </button>
        </div>
      </div>
    )
  }

  /* ── Normal rest overlay ─────────────────────────────────────── */
  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:100,
        background:'rgba(8,8,8,0.96)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:'32px',
      }}
      onClick={() => handleSkipAttempt()}
    >
      <div
        className="kIronDropUp"
        onClick={e => e.stopPropagation()}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'24px', width:'100%', padding:'0 32px' }}
      >
        {/* Label */}
        <p style={{ fontFamily:'var(--font-brutal)', fontSize:'12px', letterSpacing:'0.3em', color:'var(--text-muted)', textTransform:'uppercase' }}>
          {isDone ? '▸ GO' : '// REST'}
        </p>

        {/* Giant countdown */}
        <div style={{ textAlign:'center' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: isDone ? '80px' : '96px',
            fontWeight: 700,
            color: isDone ? 'var(--primary)' : restSec <= 10 ? '#ff5555' : 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            transition: `font-size 0.2s var(--ease-iron-drop), color 0.3s`,
            animation: isDone ? 'kDoneFlash 0.5s ease-out forwards' : undefined,
          }}>
            {isDone ? 'NOW' : `${String(mins).padStart(1,'0')}:${String(secs).padStart(2,'0')}`}
          </p>
          {!isDone && (
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'11px', color:'var(--text-dim)', letterSpacing:'0.15em', marginTop:'8px' }}>
              {restSec <= 10 ? '⚠ ALMOST TIME' : restSec > NFGU_LOCK_SEC ? 'HOLD — REST IS EARNED' : 'SECONDS REMAINING'}
            </p>
          )}
        </div>

        {/* Rebar progress drain */}
        <div style={{ width:'100%', height:'8px', background:'var(--surface-variant)', border:'2px solid var(--border-heavy)', position:'relative', overflow:'hidden' }}>
          <div style={{
            position:'absolute', left:0, top:0, bottom:0,
            width:`${pct}%`,
            background: restSec <= 10
              ? 'var(--primary)'
              : 'repeating-linear-gradient(90deg,var(--border-heavy) 0px,var(--border-heavy) 6px,var(--primary) 6px,var(--primary) 8px)',
            boxShadow: restSec <= 10 ? '0 0 8px var(--primary)' : 'none',
            transition:'width 1s linear, background 0.3s',
          }}/>
        </div>

        {/* ── NFGU Micro-copy (last 10s + high RPE) ─────────────── */}
        {showMicrocopy && (
          <div style={{
            padding: '16px 20px',
            border: '2px solid var(--border-heavy)',
            borderLeft: '4px solid var(--primary)',
            background: 'rgba(204,17,17,0.05)',
            width: '100%',
          }}>
            <p style={{
              fontFamily: "'Impact', 'Arial Narrow', var(--font-brutal)",
              fontSize: '18px',
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.3,
              whiteSpace: 'pre-line',
              textAlign: 'center',
            }}>
              {NFGU_QUOTES[quoteIndex]}
            </p>
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={e => { e.stopPropagation(); handleSkipAttempt() }}
          style={{
            marginTop:'8px', background:'transparent',
            border:'2px solid var(--border-heavy)', color:'var(--text-muted)',
            fontFamily:'var(--font-brutal)', fontSize:'12px',
            letterSpacing:'0.2em', padding:'10px 28px', cursor:'pointer',
          }}>
          {restSec > NFGU_LOCK_SEC ? '⚔ OVERRIDE' : 'SKIP REST'}
        </button>
      </div>

      <p style={{ position:'absolute', bottom:'24px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>
        {restSec > NFGU_LOCK_SEC ? 'tap anywhere · long hold to override' : 'tap anywhere to dismiss'}
      </p>
    </div>
  )
}
