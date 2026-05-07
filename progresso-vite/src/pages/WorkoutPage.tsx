import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type SavedWorkout } from '../lib/db/database'
import { useLanguage } from '../contexts/LanguageContext'

function fmtDuration(sec: number, minUnit: string, hourUnit: string) {
  const m = Math.floor(sec / 60)
  return m < 60
    ? `${m}${minUnit}`
    : `${Math.floor(m / 60)}${hourUnit}${m % 60}${minUnit}`
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' }).toUpperCase()
}

export default function WorkoutPage() {
  const navigate = useNavigate()
  const { loc } = useLanguage()
  const [recent, setRecent]     = useState<SavedWorkout[]>([])
  const [weekVol, setWeekVol]   = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(all => {
      setRecent(all.slice(0, 5))
      const now = new Date()
      const dow = (now.getDay() + 6) % 7
      const ws  = new Date(now); ws.setHours(0,0,0,0); ws.setDate(now.getDate() - dow)
      const wk  = all.filter(w => w.startedAt >= ws.getTime())
      setWeekCount(wk.length)
      setWeekVol(wk.reduce((s, w) => s + w.totalVolume, 0))
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflowY: 'auto' }}>

      {/* Header */}
      <div className="steel" style={{ padding: '20px 16px 16px', borderBottom: '3px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-brutal)', fontSize: '28px', color: 'var(--primary)', lineHeight: 1 }}>☠</span>
          <h1 style={{ fontFamily: 'var(--font-brutal)', fontSize: '34px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em' }}>
            PROGRESSO
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
          {loc.workout.subtitle}
        </p>
      </div>

      {/* CTA */}
      <div style={{ padding: '16px', background: 'var(--bg)' }}>
        <button className="btn-brutal" onClick={() => navigate('/workout/active')}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>⚡</span>
          <span>{loc.workout.startCta}</span>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>⚡</span>
        </button>
      </div>

      <div className="brutal-rule"/>

      {/* Weekly stats */}
      <div style={{ padding: '16px', background: 'var(--surface-variant)' }}>
        <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          ▸ {loc.workout.weekSection}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {[
            { label: loc.workout.totalIronLabel, val: weekVol > 0 ? weekVol.toFixed(0) : '—', unit: loc.workout.kgUnit },
            { label: loc.workout.sessionsLabel,  val: weekCount > 0 ? String(weekCount) : '—', unit: '' },
            { label: loc.workout.setsLabel,      val: '—', unit: '' },
          ].map(({ label, val, unit }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderTop: '3px solid var(--border-heavy)', padding: '14px 10px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{val}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.1em' }}>
                {unit ? `${unit} // ` : ''}{label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="brutal-rule"/>

      {/* Recent sessions */}
      <div style={{ padding: '16px', flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          ▸ {loc.workout.recentSection}
        </p>
        {recent.length === 0 ? (
          <div style={{ border: '2px solid var(--border)', borderLeft: '4px solid var(--text-dim)', padding: '32px 20px', textAlign: 'center', background: 'var(--surface)' }}>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '32px', color: 'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '16px', color: 'var(--text-muted)', marginTop: '8px' }}>{loc.workout.emptyTitle}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{loc.workout.emptySub}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recent.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface)', border: '2px solid var(--border)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '14px', color: 'var(--text)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {/* Exercise names are user-stored DB data — NOT translated */}
                    {w.exercises.map(e => e.name).join(' · ') || loc.workout.emptySession}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {fmtDate(w.startedAt)} ╱ {fmtDuration(w.durationSec, loc.workout.minUnit, loc.workout.hourUnit)} ╱ {w.totalSets} {loc.workout.setsLabel}
                  </p>
                </div>
                <div style={{ marginLeft: '12px', textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    {w.totalVolume > 0 ? w.totalVolume.toFixed(0) : '—'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>{loc.workout.kgUnit}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
