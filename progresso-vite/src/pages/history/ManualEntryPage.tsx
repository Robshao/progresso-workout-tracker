import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db/database'
import { useLanguage } from '../../contexts/LanguageContext'

/* ── Types ───────────────────────────────────────────────────── */
interface ManualSet      { weight: string; reps: string; done: boolean }
interface ManualExercise { name: string; sets: ManualSet[] }

const EXERCISE_NAMES = [
  '槓鈴臥推','上斜臥推','槓鈴深蹲','腿推機','硬舉',
  '引體向上','坐姿划船','肩推','側平舉','二頭彎舉','三頭下壓','平板支撐',
]
const EXERCISE_META: Record<string, { group: string; equipment: string }> = {
  '槓鈴臥推':{ group:'胸',   equipment:'槓鈴'    },
  '上斜臥推': { group:'胸',   equipment:'啞鈴'    },
  '槓鈴深蹲': { group:'腿',   equipment:'槓鈴'    },
  '腿推機':   { group:'腿',   equipment:'機械'    },
  '硬舉':     { group:'背',   equipment:'槓鈴'    },
  '引體向上': { group:'背',   equipment:'自體重量' },
  '坐姿划船': { group:'背',   equipment:'機械'    },
  '肩推':     { group:'肩',   equipment:'啞鈴'    },
  '側平舉':   { group:'肩',   equipment:'啞鈴'    },
  '二頭彎舉': { group:'手臂', equipment:'啞鈴'    },
  '三頭下壓': { group:'手臂', equipment:'繩索'    },
  '平板支撐': { group:'核心', equipment:'自體重量' },
}

/* ── Shared input style ──────────────────────────────────────── */
const kInputSty: React.CSSProperties = {
  background: 'var(--bg)',
  border: '2px solid var(--border-heavy)',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: '15px',
  padding: '10px 8px',
  width: '100%',
  outline: 'none',
  textAlign: 'center',
}

const todayValue = () => new Date().toISOString().slice(0, 10)

export default function ManualEntryPage() {
  const navigate = useNavigate()
  const { loc } = useLanguage()

  /* ── Form state ─────────────────────────────────────────────── */
  const [date, setDate]           = useState(todayValue())
  const [durationMin, setDur]     = useState('')
  const [exercises, setExercises] = useState<ManualExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)

  /* ── Derived stats ───────────────────────────────────────────── */
  const totalSets = exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0)
  const totalVolume = exercises.reduce((s, ex) =>
    s + ex.sets.filter(x => x.done).reduce((s2, x) =>
      s2 + (parseFloat(x.weight) || 0) * (parseFloat(x.reps) || 0), 0), 0)

  /* ── Helpers ─────────────────────────────────────────────────── */
  function addExercise(name: string) {
    setExercises(p => [...p, { name, sets: [{ weight:'', reps:'', done: false }] }])
    setShowPicker(false); setPickerQuery('')
  }
  function addSet(ei: number) {
    setExercises(p => p.map((ex, i) => i !== ei ? ex : {
      ...ex,
      sets: [...ex.sets, { weight: ex.sets.at(-1)!.weight, reps: ex.sets.at(-1)!.reps, done: false }],
    }))
  }
  function updateSet(ei: number, si: number, field: keyof ManualSet, val: string | boolean) {
    setExercises(p => p.map((ex, i) => i !== ei ? ex : {
      ...ex,
      sets: ex.sets.map((s, j) => j !== si ? s : { ...s, [field]: val }),
    }))
  }
  function removeExercise(ei: number) {
    setExercises(p => p.filter((_, i) => i !== ei))
  }

  /* ── Save ────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!date)               { setError(loc.manualEntry.errorDate);     return }
    if (exercises.length === 0) { setError(loc.manualEntry.errorMovement); return }
    setError(''); setSaving(true)

    const startedAt   = new Date(date).getTime()
    const durationSec = Math.max((parseFloat(durationMin) || 0) * 60, 0)
    const endedAt     = startedAt + durationSec * 1000

    await db.workouts.add({
      id: crypto.randomUUID(),
      startedAt,
      endedAt,
      durationSec,
      exercises: exercises.map(ex => {
        const meta = EXERCISE_META[ex.name] ?? { group: '其他', equipment: '未知' }
        return {
          name: ex.name,
          group: meta.group,
          equipment: meta.equipment,
          repsUnit: '次',
          sets: ex.sets.map(s => ({ ...s, repsUnit: '次' })),
        }
      }),
      totalVolume,
      totalSets,
    })

    navigate('/history')
  }

  const filteredNames = EXERCISE_NAMES.filter(n => n.includes(pickerQuery))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="steel" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '3px solid var(--primary)', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/history')}
          style={{
            background: 'transparent', border: '2px solid var(--border-heavy)',
            color: 'var(--text-muted)', fontFamily: 'var(--font-brutal)',
            fontSize: '13px', letterSpacing: '0.08em', padding: '8px 12px', cursor: 'pointer',
          }}>
          ← {loc.manualEntry.backBtn}
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            {loc.manualEntry.entryLabel}
          </p>
          <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '20px', color: 'var(--primary)', letterSpacing: '0.06em' }}>
            {loc.manualEntry.title}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--primary)', border: '2px solid var(--primary)',
            boxShadow: '3px 3px 0 var(--primary-dark)',
            color: '#000', fontFamily: 'var(--font-brutal)',
            fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em',
            padding: '10px 14px', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? '...' : `■ ${loc.manualEntry.saveBtn}`}
        </button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px', background: 'var(--border)',
        borderBottom: '2px solid var(--border)', flexShrink: 0,
      }}>
        {[
          [loc.manualEntry.volumeLabel, totalVolume > 0 ? `${totalVolume.toFixed(0)} KG` : '— KG'],
          [loc.manualEntry.setsLabel,   String(totalSets)],
          [loc.manualEntry.movesLabel,  String(exercises.length)],
        ].map(([l, v]) => (
          <div key={l} style={{ background: 'var(--surface-variant)', padding: '8px 4px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--primary)', fontWeight: 700 }}>{v}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '2px' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── Scrollable form body ────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(204,17,17,0.12)',
            border: '2px solid var(--primary)', borderLeft: '4px solid var(--primary)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)',
            letterSpacing: '0.05em',
          }}>{error}</div>
        )}

        {/* Date + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-brutal)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '6px' }}>
              ▸ {loc.manualEntry.dateLabel}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...kInputSty, textAlign: 'left', padding: '10px 12px', colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-brutal)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '6px' }}>
              ▸ {loc.manualEntry.durationLabel}
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="60"
              value={durationMin}
              onChange={e => setDur(e.target.value)}
              style={kInputSty}
            />
          </div>
        </div>

        {/* Exercise blocks */}
        {exercises.map((ex, ei) => (
          <div key={ei} style={{
            border: '2px solid var(--border)', borderTop: '3px solid var(--primary)',
            background: 'var(--surface)',
          }}>
            {/* Exercise header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '2px solid var(--border)',
              background: 'var(--surface-variant)',
            }}>
              <div>
                {/* Exercise name is user-selected data — NOT translated */}
                <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '16px', color: 'var(--text)', letterSpacing: '0.05em' }}>
                  {ex.name}
                </p>
                {EXERCISE_META[ex.name] && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {EXERCISE_META[ex.name].equipment} ╱ {EXERCISE_META[ex.name].group}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeExercise(ei)}
                style={{
                  background: 'transparent', border: '2px solid var(--border-heavy)',
                  color: 'var(--primary)', fontFamily: 'var(--font-mono)',
                  fontSize: '14px', padding: '6px 10px', cursor: 'pointer',
                }}>✕</button>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 1fr 44px',
              gap: '4px', padding: '8px 14px', borderBottom: '1px solid var(--border)',
            }}>
              {[loc.manualEntry.colHash, loc.manualEntry.colKg, loc.manualEntry.colReps, loc.manualEntry.colDone].map((h, hi) => (
                <span key={hi} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px',
                  color: 'var(--text-muted)', letterSpacing: '0.1em',
                  textAlign: hi > 0 ? 'center' : 'left',
                }}>{h}</span>
              ))}
            </div>

            {/* Set rows */}
            {ex.sets.map((set, si) => (
              <div key={si} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 1fr 44px',
                gap: '4px', padding: '6px 14px',
                borderBottom: '1px solid var(--border)',
                background: set.done ? 'rgba(204,17,17,0.07)' : undefined,
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{si + 1}</span>
                <input
                  type="number" inputMode="decimal" placeholder="0"
                  value={set.weight}
                  onChange={e => updateSet(ei, si, 'weight', e.target.value)}
                  style={kInputSty}
                />
                <input
                  type="number" inputMode="decimal" placeholder="—"
                  value={set.reps}
                  onChange={e => updateSet(ei, si, 'reps', e.target.value)}
                  style={kInputSty}
                />
                <button
                  onClick={() => updateSet(ei, si, 'done', !set.done)}
                  style={{
                    height: '40px',
                    background: set.done ? 'var(--primary)' : 'var(--bg)',
                    border: `2px solid ${set.done ? 'var(--primary)' : 'var(--border-heavy)'}`,
                    color: set.done ? '#000' : 'var(--text-muted)',
                    fontFamily: 'var(--font-brutal)', fontSize: '16px', cursor: 'pointer',
                    boxShadow: set.done ? '2px 2px 0 var(--primary-dark)' : 'none',
                  }}>■</button>
              </div>
            ))}

            {/* Add set */}
            <button
              onClick={() => addSet(ei)}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: 'none', borderTop: '2px dashed var(--border-heavy)',
                color: 'var(--primary)', fontFamily: 'var(--font-brutal)',
                fontSize: '13px', letterSpacing: '0.1em', cursor: 'pointer',
              }}>{loc.manualEntry.addSetBtn}</button>
          </div>
        ))}

        {/* Empty state prompt */}
        {exercises.length === 0 && (
          <div style={{
            padding: '32px 20px', textAlign: 'center',
            border: '2px solid var(--border)', borderLeft: '4px solid var(--text-dim)',
          }}>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '32px', color: 'var(--text-dim)' }}>☠</p>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px' }}>
              {loc.manualEntry.noMovementsTitle}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {loc.manualEntry.noMovementsSub}
            </p>
          </div>
        )}

        {/* Add exercise CTA */}
        <button
          className="btn-brutal"
          onClick={() => setShowPicker(true)}>
          {loc.manualEntry.addMovementBtn}
        </button>
      </div>

      {/* ── Exercise picker sheet ───────────────────────────── */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setShowPicker(false)}
          />
          <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            maxHeight: '75vh', background: 'var(--surface)',
            borderTop: '3px solid var(--primary)',
          }}>
            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '2px solid var(--border)',
              background: 'var(--surface-variant)',
            }}>
              <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '18px', letterSpacing: '0.08em', color: 'var(--text)' }}>
                ▸ {loc.manualEntry.pickerTitle}
              </p>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  background: 'transparent', border: '2px solid var(--border-heavy)',
                  color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                  padding: '6px 10px', cursor: 'pointer',
                }}>✕</button>
            </div>

            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              margin: '12px 16px',
              background: 'var(--bg)', border: '2px solid var(--border-heavy)',
              padding: '10px 14px',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '14px' }}>&gt;</span>
              <input
                type="text" placeholder={loc.manualEntry.pickerSearch} value={pickerQuery}
                onChange={e => setPickerQuery(e.target.value)} autoFocus
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text)', fontFamily: 'var(--font-mono)',
                  fontSize: '13px', letterSpacing: '0.05em',
                }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', paddingBottom: '8px' }}>
              {filteredNames.map(name => (
                <button
                  key={name}
                  onClick={() => addExercise(name)}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center',
                    justifyContent: 'space-between', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    borderTop: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                  <div>
                    {/* Exercise names are DB data — NOT translated */}
                    <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '15px', color: 'var(--text)', letterSpacing: '0.04em' }}>
                      {name}
                    </p>
                    {EXERCISE_META[name] && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {EXERCISE_META[name].equipment} ╱ {EXERCISE_META[name].group}
                      </p>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-brutal)', fontSize: '20px', color: 'var(--primary)' }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
