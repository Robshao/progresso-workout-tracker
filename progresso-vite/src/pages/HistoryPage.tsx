import { useEffect, useState } from 'react'
import { Dumbbell, Clock, Zap, ChevronDown } from 'lucide-react'
import { db, type SavedWorkout } from '../lib/db/database'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m} 分鐘` : `${Math.floor(m / 60)} 時 ${m % 60} 分`
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(setWorkouts)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>訓練記錄</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>共 {workouts.length} 次訓練</p>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border py-20"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Dumbbell size={48} style={{ color: 'var(--text-muted)' }} />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>尚無訓練記錄</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map(w => (
            <div key={w.id} className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {/* Summary row */}
              <button className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpanded(e => e === w.id ? null : w.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {formatDate(w.startedAt)}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {w.exercises.map(e => e.name).join('、') || '空訓練'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                      {w.totalVolume > 0 ? `${w.totalVolume.toFixed(0)} kg` : '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.totalSets} 組</p>
                  </div>
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: expanded === w.id ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}/>
                </div>
              </button>

              {/* Stats bar */}
              <div className="flex gap-4 px-4 py-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-variant)' }}>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={12}/>{formatTime(w.startedAt)} · {formatDuration(w.durationSec)}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Dumbbell size={12}/>{w.exercises.length} 動作
                </span>
                {w.totalVolume > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Zap size={12}/>{w.totalVolume.toFixed(0)} kg
                  </span>
                )}
              </div>

              {/* Expanded detail */}
              {expanded === w.id && (
                <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                  {w.exercises.map((ex, ei) => (
                    <div key={ei} className="px-4 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                        {ex.name}
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                          {ex.equipment} · {ex.group}
                        </span>
                      </p>
                      <div className="flex flex-col gap-1">
                        {ex.sets.map((s, si) => (
                          <div key={si} className="flex items-center gap-3 text-sm">
                            <span className="w-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{si + 1}</span>
                            <span style={{ color: s.done ? 'var(--text)' : 'var(--text-muted)' }}>
                              {s.weight ? `${s.weight} kg` : '—'}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>×</span>
                            <span style={{ color: s.done ? 'var(--text)' : 'var(--text-muted)' }}>
                              {s.reps || '—'} {s.repsUnit}
                            </span>
                            {s.done && <span className="ml-auto text-xs" style={{ color: 'var(--primary)' }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
