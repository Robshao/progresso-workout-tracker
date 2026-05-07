import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, CheckCircle, ChevronDown, Search, Trash2 } from 'lucide-react'
import { db } from '../../lib/db/database'

const EXERCISES = [
  { id: 1, name: '槓鈴臥推', equipment: '槓鈴', group: '胸' },
  { id: 2, name: '上斜臥推', equipment: '啞鈴', group: '胸' },
  { id: 3, name: '槓鈴深蹲', equipment: '槓鈴', group: '腿' },
  { id: 4, name: '腿推機', equipment: '機械', group: '腿' },
  { id: 5, name: '硬舉', equipment: '槓鈴', group: '背' },
  { id: 6, name: '引體向上', equipment: '自體重量', group: '背' },
  { id: 7, name: '坐姿划船', equipment: '機械', group: '背' },
  { id: 8, name: '肩推', equipment: '啞鈴', group: '肩' },
  { id: 9, name: '側平舉', equipment: '啞鈴', group: '肩' },
  { id: 10, name: '二頭彎舉', equipment: '啞鈴', group: '手臂' },
  { id: 11, name: '三頭下壓', equipment: '繩索', group: '手臂' },
  { id: 12, name: '平板支撐', equipment: '自體重量', group: '核心' },
]

type RepsUnit = '次' | '秒' | '分' | '時'
const REPS_UNITS: RepsUnit[] = ['次', '秒', '分', '時']

interface SetEntry { weight: string; reps: string; done: boolean }
interface ExerciseBlock { exercise: typeof EXERCISES[0]; sets: SetEntry[]; repsUnit: RepsUnit }

export default function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  const fmt = (s: number) => [Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')

  const totalSets = blocks.reduce((s,b) => s + b.sets.filter(x=>x.done).length, 0)
  const totalVolume = blocks.reduce((s,b) => s + b.sets.filter(x=>x.done && b.repsUnit==='次').reduce((s2,x) => s2+(parseFloat(x.weight)||0)*(parseFloat(x.reps)||0),0), 0)

  async function handleFinish() {
    if (!confirm('完成訓練？記錄將被儲存。')) return
    const endedAt = Date.now()
    await db.workouts.add({
      id: crypto.randomUUID(),
      startedAt: startTime,
      endedAt,
      durationSec: Math.floor((endedAt - startTime) / 1000),
      exercises: blocks.map(b => ({
        name: b.exercise.name, group: b.exercise.group, equipment: b.exercise.equipment, repsUnit: b.repsUnit,
        sets: b.sets.map(s => ({ weight: s.weight, reps: s.reps, repsUnit: b.repsUnit, done: s.done })),
      })),
      totalVolume,
      totalSets,
    })
    navigate('/workout')
  }

  function addExercise(ex: typeof EXERCISES[0]) {
    setBlocks(p => [...p, { exercise: ex, sets: [{ weight:'', reps:'', done:false }], repsUnit: '次' }])
    setShowPicker(false); setQuery('')
  }

  function addSet(bi: number) {
    setBlocks(p => p.map((b,i) => i!==bi ? b : { ...b, sets: [...b.sets, { weight: b.sets.at(-1)!.weight, reps: b.sets.at(-1)!.reps, done: false }] }))
  }

  function updateSet(bi: number, si: number, field: keyof SetEntry, val: string|boolean) {
    setBlocks(p => p.map((b,i) => i!==bi ? b : { ...b, sets: b.sets.map((s,j) => j!==si ? s : { ...s, [field]: val }) }))
  }

  const filtered = EXERCISES.filter(e => e.name.includes(query)||e.group.includes(query))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
        <button onClick={() => { if(confirm('放棄訓練？')) navigate('/workout') }} style={{ color:'var(--text-muted)' }}><X size={22}/></button>
        <div className="text-center">
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>訓練進行中</p>
          <p className="text-xl font-bold tabular-nums" style={{ color:'var(--primary)' }}>{fmt(elapsed)}</p>
        </div>
        <button onClick={handleFinish} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background:'var(--primary)', color:'#000' }}>
          <CheckCircle size={16}/>完成
        </button>
      </div>

      {/* Stats */}
      <div className="flex justify-around py-2 border-b shrink-0" style={{ background:'var(--surface-variant)', borderColor:'var(--border)' }}>
        {[['總容量', totalVolume>0?`${totalVolume.toFixed(0)} kg`:'— kg'],['完成組數',String(totalSets)],['動作數',String(blocks.length)]].map(([l,v])=>(
          <div key={l} className="text-center">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>{l}</p>
            <p className="text-sm font-bold" style={{ color:'var(--text)' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {blocks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
            <p className="text-sm text-center" style={{ color:'var(--text-muted)' }}>尚無動作<br/>點擊下方按鈕新增</p>
          </div>
        ) : blocks.map((block, bi) => (
          <div key={bi} className="rounded-xl border overflow-hidden" style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:'var(--border)' }}>
              <div>
                <p className="font-semibold" style={{ color:'var(--text)' }}>{block.exercise.name}</p>
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>{block.exercise.equipment} · {block.exercise.group}</p>
              </div>
              <button onClick={() => setBlocks(p=>p.filter((_,i)=>i!==bi))} style={{ color:'var(--text-muted)' }}><Trash2 size={18}/></button>
            </div>

            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-medium items-center" style={{ color:'var(--text-muted)' }}>
              <span>組</span>
              <span className="col-span-2 text-center">重量 (kg)</span>
              <div className="relative flex items-center justify-center">
                <select value={block.repsUnit} onChange={e=>setBlocks(p=>p.map((b,i)=>i===bi?{...b,repsUnit:e.target.value as RepsUnit}:b))}
                  className="appearance-none rounded-md px-2 py-1 text-xs font-semibold pr-5 outline-none cursor-pointer w-full"
                  style={{ background:'var(--surface-variant)', color:'var(--primary)', border:'1px solid var(--border)' }}>
                  {REPS_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-1 pointer-events-none" style={{ color:'var(--primary)' }}/>
              </div>
              <span className="text-center">✓</span>
            </div>

            {block.sets.map((set, si) => (
              <div key={si} className="grid grid-cols-5 gap-2 px-4 py-2 items-center border-t"
                style={{ borderColor:'var(--border)', background: set.done?'rgba(0,230,118,0.06)':undefined }}>
                <span className="text-sm font-medium" style={{ color:'var(--text-muted)' }}>{si+1}</span>
                <input type="number" inputMode="decimal" placeholder="0" value={set.weight}
                  onChange={e=>updateSet(bi,si,'weight',e.target.value)}
                  className="col-span-2 rounded-lg px-3 py-2 text-center text-sm outline-none"
                  style={{ background:'var(--surface-variant)', color:'var(--text)' }}/>
                <input type="number" inputMode="decimal" placeholder={block.repsUnit} value={set.reps}
                  onChange={e=>updateSet(bi,si,'reps',e.target.value)}
                  className="rounded-lg px-2 py-2 text-center text-sm outline-none"
                  style={{ background:'var(--surface-variant)', color:'var(--text)' }}/>
                <button onClick={()=>updateSet(bi,si,'done',!set.done)}
                  className="flex items-center justify-center rounded-lg py-2"
                  style={{ background:set.done?'var(--primary)':'var(--surface-variant)', color:set.done?'#000':'var(--text-muted)' }}>
                  <CheckCircle size={18}/>
                </button>
              </div>
            ))}

            <button onClick={()=>addSet(bi)} className="flex w-full items-center justify-center gap-1 py-3 text-sm border-t"
              style={{ color:'var(--primary)', borderColor:'var(--border)' }}>
              <Plus size={16}/>新增組數
            </button>
          </div>
        ))}
      </div>

      {/* Add exercise button */}
      <div className="shrink-0 p-4 border-t" style={{ borderColor:'var(--border)' }}>
        <button onClick={()=>setShowPicker(true)} className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold"
          style={{ background:'var(--primary)', color:'#000' }}>
          <Plus size={20}/>新增動作
        </button>
      </div>

      {/* Exercise picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowPicker(false)}/>
          <div className="relative flex flex-col rounded-t-2xl max-h-[80vh]" style={{ background:'var(--surface)' }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background:'var(--border)' }}/></div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-base font-semibold" style={{ color:'var(--text)' }}>選擇動作</p>
              <button onClick={()=>setShowPicker(false)} style={{ color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div className="flex items-center gap-3 mx-4 mb-3 rounded-xl px-4 py-3" style={{ background:'var(--surface-variant)' }}>
              <Search size={16} style={{ color:'var(--text-muted)' }}/>
              <input type="text" placeholder="搜尋動作..." value={query} onChange={e=>setQuery(e.target.value)} autoFocus
                className="flex-1 bg-transparent text-sm outline-none" style={{ color:'var(--text)' }}/>
            </div>
            <div className="overflow-y-auto pb-6">
              {filtered.map(ex => (
                <button key={ex.id} onClick={()=>addExercise(ex)} className="flex w-full items-center justify-between px-4 py-3 text-left border-t"
                  style={{ borderColor:'var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color:'var(--text)' }}>{ex.name}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{ex.equipment} · {ex.group}</p>
                  </div>
                  <Plus size={18} style={{ color:'var(--primary)' }}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
