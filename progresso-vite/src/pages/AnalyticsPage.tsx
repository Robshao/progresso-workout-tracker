import { useEffect, useState } from 'react'
import { db, type SavedWorkout } from '../lib/db/database'

function weekLabel(date: Date) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

export default function AnalyticsPage() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([])

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(setWorkouts)
  }, [])

  /* Weekly data — last 6 weeks */
  const weeklyData = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const ws = new Date(now)
      const dow = (ws.getDay() + 6) % 7
      ws.setDate(ws.getDate() - dow - (5 - i) * 7)
      ws.setHours(0,0,0,0)
      const we = new Date(ws); we.setDate(ws.getDate() + 7)
      const wk = workouts.filter(w => w.startedAt >= ws.getTime() && w.startedAt < we.getTime())
      return {
        label: weekLabel(ws),
        volume: wk.reduce((s,w) => s + w.totalVolume, 0),
        count: wk.length,
        isCurrent: i === 5,
      }
    })
  })()
  const maxVol = Math.max(...weeklyData.map(w => w.volume), 1)

  /* Muscle group breakdown */
  const groupMap: Record<string, number> = {}
  workouts.forEach(w => w.exercises.forEach(ex => {
    groupMap[ex.group] = (groupMap[ex.group] || 0) + ex.sets.filter(s => s.done).length
  }))
  const groups = Object.entries(groupMap).sort((a,b) => b[1]-a[1])
  const totalGroupSets = groups.reduce((s,[,v]) => s+v, 0)

  const totalVolume = workouts.reduce((s,w) => s+w.totalVolume, 0)
  const totalSets   = workouts.reduce((s,w) => s+w.totalSets, 0)
  const avgDuration = workouts.length
    ? Math.round(workouts.reduce((s,w) => s+w.durationSec, 0) / workouts.length / 60)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Header */}
      <div className="steel" style={{ padding: '20px 16px 16px', borderBottom: '3px solid var(--primary)', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-brutal)', fontSize: '30px', color: 'var(--primary)', letterSpacing: '0.06em' }}>
          IRON STATS
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
          // ALL-TIME PERFORMANCE DATA
        </p>
      </div>

      <div className="brutal-rule"/>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
          {[
            { label: 'SESSIONS',    val: `${workouts.length}` },
            { label: 'TOTAL IRON',  val: totalVolume > 0 ? `${(totalVolume/1000).toFixed(1)}T` : '—' },
            { label: 'TOTAL SETS',  val: `${totalSets}` },
            { label: 'AVG SESSION', val: avgDuration ? `${avgDuration}M` : '—' },
          ].map(({ label, val }) => (
            <div key={label} style={{
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderTop: '3px solid var(--border-heavy)',
              padding: '14px 12px',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', color: 'var(--primary)', fontWeight: 700, lineHeight: 1 }}>{val}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.1em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Weekly volume chart */}
        <div>
          <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px' }}>
            ▸ WEEKLY VOLUME
          </p>
          <div style={{
            border: '2px solid var(--border)',
            borderLeft: '3px solid var(--primary)',
            background: 'var(--surface)',
            padding: '16px 12px 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
              {weeklyData.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${Math.max((w.volume / maxVol) * 100, w.volume > 0 ? 6 : 0)}%`,
                      background: w.isCurrent ? 'var(--primary)' : 'var(--border-heavy)',
                      minHeight: w.volume > 0 ? '4px' : '2px',
                      borderTop: w.isCurrent ? '2px solid #ff4444' : '2px solid var(--border-heavy)',
                      boxShadow: w.isCurrent ? '0 0 8px var(--primary-dim)' : 'none',
                    }}/>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    color: w.isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                    letterSpacing: '0.05em',
                  }}>{w.label}</span>
                </div>
              ))}
            </div>
            {workouts.length === 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                &gt; NO DATA_
              </p>
            )}
          </div>
        </div>

        {/* Muscle group breakdown */}
        {groups.length > 0 && (
          <div>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              ▸ MUSCLE LOAD DISTRIBUTION
            </p>
            <div style={{ border: '2px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {groups.map(([group, sets], i) => (
                <div key={group} style={{
                  padding: '10px 14px',
                  borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', color: 'var(--text)', letterSpacing: '0.06em' }}>{group}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>{sets} SETS</span>
                  </div>
                  {/* Rebar progress bar */}
                  <div style={{ height: '6px', background: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
                    <div style={{
                      height: '100%',
                      width: `${(sets / totalGroupSets) * 100}%`,
                      background: 'var(--primary)',
                      boxShadow: '0 0 6px var(--primary-dim)',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
