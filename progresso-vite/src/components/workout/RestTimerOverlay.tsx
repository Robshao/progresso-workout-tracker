/**
 * RestTimerOverlay — Contextual Focus Mode
 *
 * Full-screen overlay triggered when a set is completed.
 * Displays only the countdown — everything else is behind a dim.
 * Uses kIronDropUp entrance animation (physics-based, heavy settle).
 *
 * The overlay itself carries z-index:100 so it sits above the grain
 * texture (z-index:9998) — wait, grain is fixed pointer-events:none,
 * so 100 is fine for interaction blocking.
 *
 * Countdown bar: a brutalist "rebar drain" — left-to-right fill that
 * depletes as seconds tick down. No circles (border-radius: 0 !important).
 */

import React from 'react'

interface Props {
  restSec:   number         // current seconds remaining (0 triggers pulsing DONE state)
  totalSec?: number         // denominator for progress bar (default 90)
  onDismiss: () => void
}

export function RestTimerOverlay({ restSec, totalSec = 90, onDismiss }: Props) {
  const mins = Math.floor(restSec / 60)
  const secs = restSec % 60
  const pct  = Math.max(0, (restSec / totalSec) * 100)
  const isDone = restSec <= 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(8,8,8,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '32px',
      }}
      onClick={onDismiss}
    >
      {/* ── Entrance animation wrapper ─────────────────────── */}
      <div
        className="kIronDropUp"
        onClick={e => e.stopPropagation()} // prevent dismiss on inner tap
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '24px',
          width: '100%', padding: '0 32px',
        }}
      >
        {/* Label */}
        <p style={{
          fontFamily: 'var(--font-brutal)',
          fontSize: '12px',
          letterSpacing: '0.3em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          {isDone ? '▸ GO' : '// REST'}
        </p>

        {/* Giant countdown — the ONLY thing that matters */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: isDone ? '80px' : '96px',
            fontWeight: 700,
            color: isDone ? 'var(--primary)' : 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            transition: 'font-size 0.2s var(--ease-iron-drop), color 0.2s',
            animation: isDone ? 'kDoneFlash 0.5s ease-out forwards' : undefined,
          }}>
            {isDone
              ? 'NOW'
              : `${String(mins).padStart(1,'0')}:${String(secs).padStart(2,'0')}`
            }
          </p>
          {!isDone && (
            <p style={{
              fontFamily: 'var(--font-brutal)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              letterSpacing: '0.15em',
              marginTop: '8px',
            }}>
              {restSec <= 10 ? '⚠ ALMOST' : 'SECONDS REMAINING'}
            </p>
          )}
        </div>

        {/* Rebar progress drain */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--surface-variant)',
          border: '2px solid var(--border-heavy)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: restSec <= 10
              ? 'var(--primary)'
              : 'repeating-linear-gradient(90deg, var(--border-heavy) 0px, var(--border-heavy) 6px, var(--primary) 6px, var(--primary) 8px)',
            boxShadow: restSec <= 10 ? '0 0 8px var(--primary)' : 'none',
            transition: 'width 1s linear, background 0.3s',
          }}/>
        </div>

        {/* Dismiss hint */}
        <button
          onClick={onDismiss}
          style={{
            marginTop: '8px',
            background: 'transparent',
            border: '2px solid var(--border-heavy)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-brutal)',
            fontSize: '12px',
            letterSpacing: '0.2em',
            padding: '10px 28px',
            cursor: 'pointer',
          }}>
          SKIP REST
        </button>
      </div>

      {/* Tap-anywhere hint */}
      <p style={{
        position: 'absolute', bottom: '24px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
      }}>
        tap anywhere to dismiss
      </p>
    </div>
  )
}
