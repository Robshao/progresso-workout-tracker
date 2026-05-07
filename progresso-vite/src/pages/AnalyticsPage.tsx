import { useEffect, useState } from 'react'
import { TrendingUp, Dumbbell, Zap, Calendar } from 'lucide-react'
import { db, type SavedWorkout } from '../lib/db/database'

function weekLabel(date: Date) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function AnalyticsPage() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([])

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(setWorkouts)
  }, [])

  // Compute per-week volume for last 6 weeks
  const weeklyData = (() => {
    const weeks: { label: string; volume: number; count: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now)
      const dow = (weekStart.getDay() + 6) % 7
      weekStart.setDate(weekStart.getDate() - dow - i * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      const inWeek = workouts.filter(w => w.startedAt >= weekStart.getTime() && w.startedAt < weekEnd.getTime())
      weeks.push({
        label: weekLabel(weekStart),
        volume: inWeek.reduce((s, w) => s + w.totalVolume, 0),
        count: inWeek.length,
      })
    }
    return weeks
  })()

  const maxVol = Math.max(...weeklyData.map(w => w.volume), 1)

  // Group breakdown
  const groupMap: Record<string, number> = {}
  workouts.forEach(w => w.exercises.forEach(ex => {
    groupMap[ex.group] = (groupMap[ex.group] || 0) + ex.sets.filter(s => s.done).length
  }))
  const groups = Object.entries(groupMap).sort((a, b) => b[1] - a[1])
  const totalGroupSets = groups.reduce((s, [, v]) => s + v, 0)

  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0)
  const totalSets = workouts.reduce((s, w) => s + w.totalSets, 0)
  const avgDuration = workouts.length ? Math.round(workouts.reduce((s, w) => s + w.durationSec, 0) / workouts.length / 60) : 0

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>訓練分析</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>全部時間總覽</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Calendar size={18}/>, label: '訓練次數', value: `${workouts.length} 次` },
          { icon: <Zap size={18}/>, label: '總訓練量', value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)} t` : '—' },
          { icon: <Dumbbell size={18}/>, label: '總組數', value: `${totalSets} 組` },
          { icon: <TrendingUp size={18}/>, label: '平均時長', value: avgDuration ? `${avgDuration} 分` : '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--primary)' }}>{icon}</span>
            <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly volume chart */}
      <section>
        <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--text)' }}>每週訓練量</h2>
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max((w.volume / maxVol) * 100, w.volume > 0 ? 4 : 0)}%`,
                      background: i === 5 ? 'var(--primary)' : 'var(--surface-variant)',
                      minHeight: w.volume > 0 ? '4px' : '0',
                    }}/>
                </div>
                <span className="text-xs" style={{ color: i === 5 ? 'var(--primary)' : 'var(--text-muted)' }}>{w.label}</span>
              </div>
            ))}
          </div>
          {workouts.length === 0 && (
            <p className="text-center text-sm mt-2" style={{ color: 'var(--text-muted)' }}>尚無資料</p>
          )}
        </div>
      </section>

      {/* Muscle group breakdown */}
      {groups.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--text)' }}>肌群分佈</h2>
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {groups.map(([group, sets], i) => (
              <div key={group} className="px-4 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{group}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sets} 組</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-variant)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(sets / totalGroupSets) * 100}%`, background: 'var(--primary)' }}/>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
