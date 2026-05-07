import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type SetType, SET_TYPE_DEFAULT } from '../../lib/db/database'
import { useLanguage } from '../../contexts/LanguageContext'

/* ── Exercise catalogue ─────────────────────────────────────── */
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

/* ── Set type configuration ────────────────────────────────────
   Color palette: all dark / high-contrast to match brutalist theme.
   warmup   → steel gray   (lower intensity — dims prev-record badge)
   top_set  → blood red    (default, max effort)
   back_off → amber        (sub-maximal follow-up)
   failure  → dark crimson (pushed past failure)
   drop_set → magenta      (technique variation)
──────────────────────────────────────────────────────────────── */
const SET_TYPE_META: Record<SetType, { label: string; color: string; bg: string }> = {
  warmup:   { label: 'WU',   color: '#888888', bg: 'rgba(136,136,136,0.15)' },
  top_set:  { label: 'TOP',  color: '#cc1111', bg: 'rgba(204,17,17,0.18)'  },
  back_off: { label: 'BO',   color: '#cc8800', bg: 'rgba(204,136,0,0.18)'  },
  failure:  { label: 'FAIL', color: '#880000', bg: 'rgba(136,0,0,0.22)'    },
  drop_set: { label: 'DROP', color: '#aa2288', bg: 'rgba(170,34,136,0.18)' },
}
const SET_TYPES = Object.keys(SET_TYPE_META) as SetType[]

/* ── Local set state (rir stored as string for input binding) ── */
interface SetEntry {
  weight:  string
  reps:    string
  done:    boolean
  setType: SetType
  rir:     string   // '' = not tracked; '0'–'5' on save
}
interface ExerciseBlock {
  exercise: typeof EXERCISES[0]
  sets:     SetEntry[]
  repsUnit: RepsUnit
}

const kBlankSet = (): SetEntry => ({
  weight: '', reps: '', done: false, setType: SET_TYPE_DEFAULT, rir: '',
})

/* ── Shared input style ─────────────────────────────────────── */
const kInputSty: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--text)', fontFamily: 'var(--font-mono)',
  fontSize: '18px', fontWeight: 700, textAlign: 'center',
  padding: '10px 4px', width: '100%', outline: 'none',
}
const kRirSty: React.CSSProperties = {
  background: 'var(--bg)', border: '2px solid var(--border-heavy)',
  color: 'var(--primary)', fontFamily: 'var(--font-mono)',
  fontSize: '14px', fontWeight: 700, textAlign: 'center',
  padding: '4px 2px', width: '36px', outline: 'none',
}

/* ── Haptic helpers ─────────────────────────────────────────── */
const kHapticLight  = () => { try { navigator.vibrate(10)        } catch(_) {} }
const kHapticMedium = () => { try { navigator.vibrate(25)        } catch(_) {} }
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
  const [elapsed, setElapsed]   = useState(0)
  const [startTime]             = useState(() => Date.now()) /* ← startedAt: NEVER modified */
  const [blocks, setBlocks]     = useState<ExerciseBlock[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery]       = useState('')
  const [flashKey, setFlashKey] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  const fmt = (s: number) =>
    [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')

  /* Only top_set / back_off / failure / drop_set count toward volume — warmup excluded */
  const totalSets = blocks.reduce(
    (s, b) => s + b.sets.filter(x => x.done && x.setType !== 'warmup').length, 0,
  )
  const totalVolume = blocks.reduce(
    (s, b) => s + b.sets
      .filter(x => x.done && x.setType !== 'warmup' && b.repsUnit === '次')
      .reduce((s2, x) => s2 + (parseFloat(x.weight)||0) * (parseFloat(x.reps)||0), 0),
    0,
  )

  /* ── Save ─────────────────────────────────────────────────── */
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
        sets: b.sets.map(s => ({
          weight:  s.weight,
          reps:    s.reps,
          repsUnit: b.repsUnit,
          done:    s.done,
          setType: s.setType,
          rir:     s.rir !== '' ? parseInt(s.rir, 10) : undefined,
        })),
      })),
      totalVolume, totalSets,
    })
    navigate('/workout')
  }

  /* ── Block mutations ──────────────────────────────────────── */
  function addExercise(ex: typeof EXERCISES[0]) {
    kHapticLight()
    setBlocks(p => [...p, { exercise: ex, sets: [kBlankSet()], repsUnit: '次' }])
    setShowPicker(false); setQuery('')
  }
  function addSet(bi: number) {
    kHapticLight()
    setBlocks(p => p.map((b, i) => i !== bi ? b : {
      ...b,
      sets: [...b.sets, {
        ...kBlankSet(),
        weight: b.sets.at(-1)!.weight,
        reps:   b.sets.at(-1)!.reps,
        setType: b.sets.at(-1)!.setType,
      }],
    }))
  }
  function updateSet(bi: number, si: number, field: keyof SetEntry, val: string | boolean | SetType) {
    if (field === 'done' && val === true) {
      kHapticDone(); triggerShake()
      const key = `${bi}-${si}`
      setFlashKey(key)
      setTimeout(() => setFlashKey(null), 450)
    }
    setBlocks(p => p.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => j !== si ? s : { ...s, [field]: val }),
    }))
  }

  const filtered = EXERCISES.filter(e => e.name.includes(query) || e.group.includes(query))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="steel" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'3px solid var(--primary)', flexShrink:0 }}>
        <button
          onClick={() => { if (confirm(loc.active.abortConfirm)) navigate('/workout') }}
          style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--text-muted)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.08em', padding:'8px 12px', cursor:'pointer' }}>
          ✕ {loc.active.abortBtn}
        </button>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.12em' }}>{loc.active.statusLabel}</p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'28px', color:'var(--primary)', letterSpacing:'0.05em', lineHeight:1.1 }}>{fmt(elapsed)}</p>
        </div>
        <button
          onClick={handleFinish}
          style={{ background:'var(--primary)', border:'2px solid var(--primary)', boxShadow:'3px 3px 0 var(--primary-dark)', color:'#000', fontFamily:'var(--font-brutal)', fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', padding:'10px 14px', cursor:'pointer' }}>
          ■ {loc.active.lockInBtn}
        </button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'var(--border)', borderBottom:'2px solid var(--border)', flexShrink:0 }}>
        {[
          [loc.active.ironMovedLabel, totalVolume > 0 ? `${totalVolume.toFixed(0)} KG` : '— KG'],
          [loc.active.setsDoneLabel,  String(totalSets)],
          [loc.active.movementsLabel, String(blocks.length)],
        ].map(([l, v]) => (
          <div key={l} style={{ background:'var(--surface-variant)', padding:'8px 4px', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'16px', color:'var(--primary)', fontWeight:700 }}>{v}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:'2px' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── Exercise blocks ───────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {blocks.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', border:'2px solid var(--border)', borderLeft:'4px solid var(--text-dim)' }}>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'48px', color:'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily:'var(--font-brutal)', fontSize:'18px', color:'var(--text-muted)', marginTop:'12px' }}>{loc.active.noMovementsTitle}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)', marginTop:'6px' }}>{loc.active.noMovementsSub}</p>
          </div>
        ) : blocks.map((block, bi) => (
          <div key={bi} style={{ border:'2px solid var(--border)', borderTop:'3px solid var(--primary)', background:'var(--surface)' }}>

            {/* Exercise header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'2px solid var(--border)', background:'var(--surface-variant)' }}>
              <div>
                <p style={{ fontFamily:'var(--font-brutal)', fontSize:'16px', color:'var(--text)', letterSpacing:'0.05em' }}>{block.exercise.name}</p>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>{block.exercise.equipment} ╱ {block.exercise.group}</p>
              </div>
              <button
                onClick={() => setBlocks(p => p.filter((_, i) => i !== bi))}
                style={{ background:'transparent', border:'2px solid var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-mono)', fontSize:'14px', padding:'6px 10px', cursor:'pointer' }}>✕</button>
            </div>

            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'8px 14px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.1em' }}>#</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.1em' }}>KG</span>
              <div style={{ position:'relative' }}>
                <select
                  value={block.repsUnit}
                  onChange={e => setBlocks(p => p.map((b, i) => i === bi ? { ...b, repsUnit: e.target.value as RepsUnit } : b))}
                  style={{ width:'100%', background:'var(--bg)', border:'2px solid var(--primary)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'11px', letterSpacing:'0.08em', padding:'3px 18px 3px 6px', cursor:'pointer', textAlign:'center' }}>
                  {REPS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span style={{ position:'absolute', right:'4px', top:'50%', transform:'translateY(-50%)', color:'var(--primary)', fontSize:'8px', pointerEvents:'none' }}>▼</span>
              </div>
              <span style={{ fontFamily:'var(--font-brutal)', fontSize:'8px', color:'var(--primary)', textAlign:'center', letterSpacing:'0.08em' }}>{loc.active.doneColHeader}</span>
            </div>

            {/* ── Set rows ─────────────────────────────────── */}
            {block.sets.map((set, si) => {
              const meta       = SET_TYPE_META[set.setType]
              const isWarmup   = set.setType === 'warmup'
              const flashClass = flashKey === `${bi}-${si}` ? 'kDoneFlash' : undefined

              return (
                <div key={si}>
                  {/* Main input row */}
                  <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr 76px', gap:'4px', padding:'4px 14px 0', background: set.done ? 'rgba(204,17,17,0.09)' : undefined, alignItems:'stretch', minHeight:'54px' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color: isWarmup ? 'var(--text-dim)' : 'var(--text-muted)', display:'flex', alignItems:'center' }}>
                      {si + 1}
                    </span>
                    <input
                      type="number" inputMode="decimal" placeholder="0"
                      value={set.weight}
                      onChange={e => updateSet(bi, si, 'weight', e.target.value)}
                      style={{ ...kInputSty, opacity: isWarmup ? 0.6 : 1 }}
                    />
                    <input
                      type="number" inputMode="decimal" placeholder={block.repsUnit}
                      value={set.reps}
                      onChange={e => updateSet(bi, si, 'reps', e.target.value)}
                      style={{ ...kInputSty, opacity: isWarmup ? 0.6 : 1 }}
                    />
                    <button
                      className={flashClass}
                      onClick={() => updateSet(bi, si, 'done', !set.done)}
                      style={{ minHeight:'54px', background: set.done ? 'var(--primary)' : 'linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%)', border:`3px solid ${set.done ? 'var(--primary)' : 'var(--border-heavy)'}`, color: set.done ? '#000' : 'var(--text-muted)', fontFamily:'var(--font-brutal)', fontSize: set.done ? '22px' : '18px', fontWeight:900, cursor:'pointer', boxShadow: set.done ? '0 0 12px rgba(204,17,17,0.4),3px 3px 0 var(--primary-dark)' : '2px 2px 0 #000', transition:'background 0.12s,box-shadow 0.12s,color 0.12s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {set.done ? '✓' : '■'}
                    </button>
                  </div>

                  {/* ── Set type + RIR meta row ─────────────── */}
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 14px 7px', background: set.done ? 'rgba(204,17,17,0.05)' : undefined, borderBottom:'1px solid var(--border)' }}>

                    {/* Set type pill buttons */}
                    {SET_TYPES.map(type => {
                      const m = SET_TYPE_META[type]
                      const active = set.setType === type
                      return (
                        <button
                          key={type}
                          onClick={() => updateSet(bi, si, 'setType', type)}
                          style={{
                            padding: '3px 7px',
                            background: active ? m.bg : 'transparent',
                            border: `2px solid ${active ? m.color : 'var(--border-heavy)'}`,
                            color: active ? m.color : 'var(--text-dim)',
                            fontFamily: 'var(--font-brutal)',
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            transition: 'border-color 0.1s, color 0.1s, background 0.1s',
                            boxShadow: active ? `0 0 6px ${m.color}44` : 'none',
                          }}>
                          {m.label}
                        </button>
                      )
                    })}

                    {/* RIR input — right side */}
                    <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ fontFamily:'var(--font-brutal)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>RIR</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0} max={5}
                        placeholder="—"
                        value={set.rir}
                        onChange={e => {
                          const v = e.target.value
                          if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 5)) {
                            updateSet(bi, si, 'rir', v)
                          }
                        }}
                        style={kRirSty}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => addSet(bi)}
              style={{ width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:'2px dashed var(--border-heavy)', color:'var(--primary)', fontFamily:'var(--font-brutal)', fontSize:'13px', letterSpacing:'0.1em', cursor:'pointer' }}>
              {loc.active.addSetBtn}
            </button>
          </div>
        ))}
      </div>

      {/* ── Add movement CTA ─────────────────────────────────── */}
      <div style={{ flexShrink:0, padding:'12px 16px', borderTop:'2px solid var(--border)' }}>
        <button className="btn-brutal" onClick={() => setShowPicker(true)}>
          {loc.active.addMovementBtn}
        </button>
      </div>

      {/* ── Exercise picker sheet ─────────────────────────────── */}
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
              <input
                type="text" placeholder={loc.active.pickerSearch} value={query}
                onChange={e => setQuery(e.target.value)} autoFocus
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
