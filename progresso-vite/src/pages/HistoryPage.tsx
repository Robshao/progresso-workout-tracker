import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type SavedWorkout } from '../lib/db/database'
import { useLanguage } from '../contexts/LanguageContext'

function fmtDuration(sec: number, minUnit: string, hourUnit: string) {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m}${minUnit}` : `${Math.floor(m/60)}${hourUnit}${m%60}${minUnit}`
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', weekday: 'short' }).toUpperCase()
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { loc } = useLanguage()
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(setWorkouts)
  }, [])

  const sessionCountLabel = workouts.length === 1
    ? `${workouts.length} ${loc.history.recordedOne}`
    : `${workouts.length} ${loc.history.recordedMany}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="steel" style={{ padding: '20px 16px 14px', borderBottom: '3px solid var(--primary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-brutal)', fontSize: '30px', color: 'var(--primary)', letterSpacing: '0.06em' }}>
              {loc.history.title}
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
              // {sessionCountLabel}
            </p>
          </div>
          {/* Manual add entry button */}
          <button
            onClick={() => navigate('/history/add')}
            style={{
              background: 'var(--primary)', border: '2px solid var(--primary)',
              boxShadow: '3px 3px 0 var(--primary-dark)',
              color: '#000', fontFamily: 'var(--font-brutal)',
              fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em',
              padding: '10px 14px', cursor: 'pointer', flexShrink: 0,
            }}>
            {loc.history.forgeBtn}
          </button>
        </div>
      </div>

      <div className="brutal-rule" />

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {workouts.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 20px', textAlign: 'center',
            border: '2px solid var(--border)', borderLeft: '4px solid var(--text-dim)',
          }}>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '48px', color: 'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '18px', color: 'var(--text-muted)', marginTop: '12px' }}>
              {loc.history.noSessionsTitle}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {loc.history.noSessionsSub}
            </p>
          </div>
        ) : workouts.map(w => (
          <div key={w.id} style={{ border: '2px solid var(--border)', borderLeft: '4px solid var(--primary)', background: 'var(--surface)' }}>
            {/* Summary row */}
            <button
              onClick={() => setExpanded(e => e === w.id ? null : w.id)}
              aria-expanded={expanded === w.id}
              aria-label={`${w.exercises.map(e => e.name).join(', ') || loc.history.emptySession} — ${expanded === w.id ? 'collapse' : 'expand'} details`}
              style={{
                display: 'flex', width: '100%', alignItems: 'center',
                justifyContent: 'space-between', padding: '12px 14px',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-brutal)', fontSize: '15px',
                  color: 'var(--text)', letterSpacing: '0.04em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {/* Exercise names are user-stored DB data — NOT translated */}
                  {w.exercises.map(e => e.name).join(' · ') || loc.history.emptySession}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {fmtDate(w.startedAt)} ╱ {fmtTime(w.startedAt)} ╱ {fmtDuration(w.durationSec, loc.workout.minUnit, loc.workout.hourUnit)}
                </p>
              </div>
              <div style={{ marginLeft: '12px', textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>
                  {w.totalVolume > 0 ? w.totalVolume.toFixed(0) : '—'}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
                  {loc.history.kgLabel} ╱ {w.totalSets} {loc.history.setsLabel}
                </p>
              </div>
              <span style={{
                marginLeft: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px',
                color: 'var(--primary)',
                transform: expanded === w.id ? 'rotate(180deg)' : 'none',
                display: 'inline-block', transition: 'transform 0.15s',
              }}>▼</span>
            </button>

            {/* Expanded detail */}
            {expanded === w.id && (
              <div style={{ borderTop: '2px solid var(--border)' }}>
                {w.exercises.map((ex, ei) => (
                  <div key={ei} style={{ padding: '12px 14px', borderTop: ei > 0 ? '1px solid var(--border)' : undefined }}>
                    <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: '8px' }}>
                      ▸ {ex.name}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        [{ex.equipment} ╱ {ex.group}]
                      </span>
                    </p>
                    {ex.sets.map((s, si) => (
                      <div key={si} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '4px 0',
                        fontFamily: 'var(--font-mono)', fontSize: '13px',
                        borderBottom: '1px solid var(--border)',
                        color: s.done ? 'var(--text)' : 'var(--text-muted)',
                      }}>
                        <span style={{ width: '20px', color: 'var(--text-muted)', fontSize: '11px' }}>{si+1}</span>
                        <span>{s.weight || '—'} {loc.history.kgLabel}</span>
                        <span style={{ color: 'var(--text-dim)' }}>×</span>
                        <span>{s.reps || '—'} {s.repsUnit}</span>
                        {s.done && <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: '11px' }}>■ DONE</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
