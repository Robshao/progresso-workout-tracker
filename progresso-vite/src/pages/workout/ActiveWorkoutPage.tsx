import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db/database'
import { useLanguage } from '../../contexts/LanguageContext'

/* Exercise catalogue — names are UI-defined labels, NOT user DB data */
const EXERCISES = [
  { id: 1,  name: '槓鈴臥推', equipment: '槓鈴',    group: '胸'   },
  { id: 2,  name: '上斜臥推', equipment: '啞鈴',    group: '胸'   },
  { id: 3,  name: '槓鈴深蹲', equipment: '槓鈴',    group: '腿'   },
  { id: 4,  name: '腿推機',   equipment: '機械',    group: '腿'   },
  { id: 5,  name: '硬舉',     equipment: '槓鈴',    group: '背'   },
  { id: 6,  name: '引體向上', equipment: '自體重量', group: '背'  },
  { id: 7,  name: '坐姿划船', equipment: '機械',    group: '背'   },
  { id: 8,  name: '肩推',     equipment: '啞鈴',    group: '肩'   },
  { id: 9,  name: '側平舉',   equipment: '啞鈴',    group: '肩'   },
  { id: 10, name: '二頭彎舉', equipment: '啞鈴',    group: '手臂' },
  { id: 11, name: '三頭下壓', equipment: '繩索',    group: '手臂' },
  { id: 12, name: '平板支撐', equipment: '自體重量', group: '核心'},
]

type RepsUnit = '次' | '秒' | '分' | '時'
const REPS_UNITS: RepsUnit[] = ['次', '秒', '分', '時']

interface SetEntry     { weight: string; reps: string; done: boolean }
interface ExerciseBlock { exercise: typeof EXERCISES[0]; sets: SetEntry[]; repsUnit: RepsUnit }

const kInputSty: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--text)', fontFamily: 'var(--font-mono)',
  fontSize: '18px', fontWeight: 700, textAlign: 'center',
  padding: '10px 4px', width: '100%', outline: 'none',
}

/* ── Haptic helpers ─────────────────────────────────────────── */
const kHapticLight  = () => { try { navigator.vibrate(10) }        catch(_) {} }
const kHapticMedium = () => { try { navigator.vibrate(25) }        catch(_) {} }
const kHapticDone   = () => { try { navigator.vibrate([15,8,30]) } catch(_) {} }

/* ── Shake helper ───────────────────────────────────────────── */
function triggerShake() {
  const root = document.getElementById('root')
  if (!root) return
  root.classList.remove('kShake')
  void root.offsetWidth
  root.classList.add('kShake')
  setTimeout(() => root.classList.remove('kShake'), 420)
}

export default function ActiveWorkoutPage() {
  const navigate  = useNavigate()
  const { loc }   = useLanguage()
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(() => Date.now()) /* ← startedAt: NEVER modified */
  const [blocks, setBlocks]   = useState<ExerciseBlock[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery]     = useState('')
  const [flashKey, setFlashKey] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  const fmt = (s: number) =>
    [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')

  const totalSets   = blocks.reduce((s, b) => s + b.sets.filter(x => x.done).length, 0)
  const totalVolume = blocks.reduce((s, b) =>
    s + b.sets.filter(x => x.done && b.repsUnit==='次')
      .reduce((s2, x) => s2+(parseFloat(x.weight)||0)*(parseFloat(x.reps)||0), 0), 0)

  async function handleFinish() {
    kHapticMedium()
    if (!confirm(loc.active.finalizeConfirm)) return
    const endedAt = Date.now()
    await db.workouts.add({
      id: crypto.randomUUID(), startedAt: startTime, endedAt,
      durationSec: Math.floor((endedAt - startTime) / 1000),
      exercises: blocks.map(b => ({
        name: b.exercise.name, group: b.exercise.group,
        equipment: b.exercise.equipment, repsUnit: b.repsUnit,
        sets: b.sets.map(s => ({ ...s, repsUnit: b.repsUnit })),
      })),
      totalVolume, totalSets,
    })
    navigate('/workout')
  }

  function addExercise(ex: typeof EXERCISES[0]) {
    kHapticLight()
    setBlocks(p => [...p, { exercise: ex, sets: [{ weight:'', reps:'', done:false }], repsUnit: '次' }])
    setShowPicker(false); setQuery('')
  }
  function addSet(bi: number) {
    kHapticLight()
    setBlocks(p => p.map((b,i) => i!==bi ? b : {
      ...b, sets: [...b.sets, { weight: b.sets.at(-1)!.weight, reps: b.sets.at(-1)!.reps, done: false }],
    }))
  }
  function updateSet(bi: number, si: number, field: keyof SetEntry, val: string|boolean) {
    if (field === 'done' && val === true) {
      kHapticDone(); triggerShake()
      const key = `${bi}-${si}`
      setFlashKey(key)
      setTimeout(() => setFlashKey(null), 450)
    }
    setBlocks(p => p.map((b,i) => i!==bi ? b : {
      ...b, sets: b.sets.map((s,j) => j!==si ? s : { ...s, [field]: val }),
    }))
  }

  const filtered = EXERCISES.filter(e => e.name.includes(query) || e.group.includes(query))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Header */}
      <div className="steel" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'3px solid var(--primary)', flexShrink:0 }}>
        <button onClick={() => { if(confirm(loc.active.abortConfirm)) navigate('/workout') }}
          style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--text-muted)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.08em', padding:'8px 12px', cursor:'pointer' }}>
          ✕ {loc.active.abortBtn}
        </button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.12em' }}>{loc.active.statusLabel}</p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'28px', color:'var(--primary)', letterSpacing:'0.05em', lineHeight:1.1 }}>{fmt(elapsed)}</p>
        </div>
        <button onClick={handleFinish} style={{ background:'var(--primary)', border:'2px solid var(--primary)', boxShadow:'3px 3px 0 var(--primary-dark)', color:'#000', fontFamily:'var(--font-brutal)', fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', padding:'10px 14px', cursor:'pointer' }}>
          ■ {loc.active.lockInBtn}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'var(--border)', borderBottom:'2px solid var(--border)', flexShrink:0 }}>
        {[
          [loc.active.ironMovedLabel, totalVolume>0 ? `${totalVolume.toFixed(0)} KG` : '— KG'],
          [loc.active.setsDoneLabel,  String(totalSets)],
          [loc.active.movementsLabel, String(blocks.length)],
        ].map(([l, v]) => (
          <div key={l} style={{ background:'var(--surface-variant)', padding:'8px 4px', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'16px', color:'var(--primary)', fontWeight:700 }}>{v}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:'2px' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Exercise blocks */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {blocks.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', border:'2px solid var(--border)', borderLeft:'4px solid var(--text-dim)' }}>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'48px', color:'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'18px', color:'var(--text-muted)', marginTop:'12px' }}>{loc.active.noMovementsTitle}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)', marginTop:'6px' }}>{loc.active.noMovementsSub}</p>
          </div>
        ) : blocks.map((block, bi) => (
          <div key={bi} style={{ border:'2px solid var(--border)', borderTop:'3px solid var(--primary)', background:'var(--surface)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'2px solid var(--border)', background:'var(--surface-variant)' }}>
              <div>
                <p style={{ fontFamily:'var(--font-brutal)', fontSize:'16px', color:'var(--text)', letterSpacing:'0.05em' }}>{block.exercise.name}</p>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>{block.exercise.equipment} ╱ {block.exercise.group}</p>
              </div>
              <button onClick={() => setBlocks(p => p.filter((_,i) => i!==bi))}
                style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-mono)', fontSize:'14px', padding:'6px 10px', cursor:'pointer' }}>✕</button>
            </div>

            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'8px 14px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.1em' }}>#</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.1em' }}>KG</span>
              <div style={{ position:'relative' }}>
                <select value={block.repsUnit} onChange={e => setBlocks(p => p.map((b,i) => i===bi ? {...b, repsUnit:e.target.value as RepsUnit} : b))}
                  style={{ width:'100%', background:'var(--bg)', border:'2px solid var(--primary)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'11px', letterSpacing:'0.08em', padding:'3px 18px 3px 6px', cursor:'pointer', textAlign:'center' }}>
                  {REPS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span style={{ position:'absolute', right:'4px', top:'50%', transform:'translateY(-50%)', color:'var(--primary)', fontSize:'8px', pointerEvents:'none' }}>▼</span>
              </div>
              <span style={{ fontFamily:'var(--font-brutal)', fontSize:'8px', color:'var(--primary)', textAlign:'center', letterSpacing:'0.08em' }}>{loc.active.doneColHeader}</span>
            </div>

            {/* Sets */}
            {block.sets.map((set, si) => (
              <div key={si} style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'4px 14px', borderBottom:'1px solid var(--border)', background:set.done?'rgba(204,17,17,0.09)':undefined, alignItems:'stretch', minHeight:'54px' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{si+1}</span>
                <input type="number" inputMode="decimal" placeholder="0" value={set.weight} onChange={e => updateSet(bi,si,'weight',e.target.value)} style={kInputSty}/>
                <input type="number" inputMode="decimal" placeholder={block.repsUnit} value={set.reps} onChange={e => updateSet(bi,si,'reps',e.target.value)} style={kInputSty}/>
                <button className={flashKey===`${bi}-${si}` ? 'kDoneFlash' : undefined}
                  onClick={() => updateSet(bi,si,'done',!set.done)}
                  style={{ minHeight:'54px', background:set.done?'var(--primary)':'linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%)', border:`3px solid ${set.done?'var(--primary)':'var(--border-heavy)'}`, color:set.done?'#000':'var(--text-muted)', fontFamily:'var(--font-brutal)', fontSize:set.done?'22px':'18px', fontWeight:900, cursor:'pointer', boxShadow:set.done?'0 0 12px rgba(204,17,17,0.4),3px 3px 0 var(--primary-dark)':'2px 2px 0 #000', transition:'background 0.12s,box-shadow 0.12s,color 0.12s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {set.done ? '✓' : '■'}
                </button>
              </div>
            ))}
            <button onClick={() => addSet(bi)} style={{ width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:'2px dashed var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.1em', cursor:'pointer' }}>
              {loc.active.addSetBtn}
            </button>
          </div>
        ))}
      </div>

      {/* Add movement CTA */}
      <div style={{ flexShrink:0, padding:'12px 16px', borderTop:'2px solid var(--border)' }}>
        <button className="btn-brutal" onClick={() => setShowPicker(true)}>{loc.active.addMovementBtn}</button>
      </div>

      {/* Exercise picker */}
      {showPicker && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)' }} onClick={() => setShowPicker(false)}/>
          <div style={{ position:'relative', display:'flex', flexDirection:'column', maxHeight:'80vh', background:'var(--surface)', borderTop:'3px solid var(--primary)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'2px solid var(--border)', background:'var(--surface-variant)' }}>
              <p style={{ fontFamily:'var(--font-brutal)', fontSize:'18px', letterSpacing:'0.08em', color:'var(--text)' }}>▸ {loc.active.pickerTitle}</p>
              <button onClick={() => setShowPicker(false)} style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--text-muted)', fontFamily:'var(--font-mono)', padding:'6px 10px', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'12px 16px', background:'var(--bg)', border:'2px solid var(--border-heavy)', padding:'10px 14px' }}>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--primary)', fontSize:'14px' }}>&gt;</span>
              <input type="text" placeholder={loc.active.pickerSearch} value={query} onChange={e => setQuery(e.target.value)} autoFocus
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:'13px', letterSpacing:'0.05em' }}/>
            </div>
            <div style={{ overflowY:'auto', paddingBottom:'8px' }}>
              {filtered.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex)}
                  style={{ display:'flex', width:'100%', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', borderTop:'1px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
                  <div>
                    <p style={{ fontFamily:'var(--font-brutal)', fontSize:'15px', color:'var(--text)', letterSpacing:'0.04em' }}>{ex.name}</p>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>{ex.equipment} ╱ {ex.group}</p>
                  </div>
                  <span style={{ fontFamily:'var(--font-brutal)', fontSize:'20px', color:'var(--primary)' }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
