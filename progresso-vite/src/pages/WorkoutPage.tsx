import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Clock, Zap, ChevronRight } from 'lucide-react'
import { db, type SavedWorkout } from '../lib/db/database'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m} 分鐘` : `${Math.floor(m / 60)} 時 ${m % 60} 分`
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
}

export default function WorkoutPage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<SavedWorkout[]>([])
  const [weekVol, setWeekVol] = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  useEffect(() => {
    db.workouts.orderBy('startedAt').reverse().toArray().then(all => {
      setRecent(all.slice(0, 5))
      const now = new Date()
      const dow = (now.getDay() + 6) % 7
      const weekStart = new Date(now)
      weekStart.setHours(0,0,0,0)
      weekStart.setDate(now.getDate() - dow)
      const thisWeek = all.filter(w => w.startedAt >= weekStart.getTime())
      setWeekCount(thisWeek.length)
      setWeekVol(thisWeek.reduce((s, w) => s + w.totalVolume, 0))
    })
  }, [])

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Progresso</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>漸進性超負荷訓練日誌</p>
      </div>

      <button onClick={() => navigate('/workout/active')} className="w-full rounded-2xl p-6 text-left"
        style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))' }}>
        <Dumbbell size={32} color="#000" />
        <h2 className="mt-3 text-xl font-bold text-black">開始訓練</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>點擊立即開始記錄本次訓練</p>
      </button>

      <section>
        <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--text)' }}>本週摘要</h2>
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat icon={<Zap size={18}/>} label="總容量" value={weekVol > 0 ? weekVol.toFixed(0) : '—'} unit="kg"/>
            <Stat icon={<Dumbbell size={18}/>} label="訓練次數" value={weekCount > 0 ? String(weekCount) : '—'} unit="次"/>
            <Stat icon={<Clock size={18}/>} label="本週組數" value="—" unit=""/>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--text)' }}>最近訓練</h2>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border py-12" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <Dumbbell size={48} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>尚無訓練記錄</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>開始第一次訓練吧！</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {recent.map((w, i) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {w.exercises.map(e => e.name).join('、') || '空訓練'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(w.startedAt)} · {formatDuration(w.durationSec)} · {w.totalSets} 組
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    {w.totalVolume > 0 ? `${w.totalVolume.toFixed(0)} kg` : '—'}
                  </p>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{value} {unit}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
