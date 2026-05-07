import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const EXERCISES = [
  { id: 1,  name: '槓鈴臥推', equipment: '槓鈴',    group: '胸'  },
  { id: 2,  name: '上斜臥推', equipment: '啞鈴',    group: '胸'  },
  { id: 3,  name: '槓鈴深蹲', equipment: '槓鈴',    group: '腿'  },
  { id: 4,  name: '腿推機',   equipment: '機械',    group: '腿'  },
  { id: 5,  name: '硬舉',     equipment: '槓鈴',    group: '背'  },
  { id: 6,  name: '引體向上', equipment: '自體重量', group: '背'  },
  { id: 7,  name: '坐姿划船', equipment: '機械',    group: '背'  },
  { id: 8,  name: '肩推',     equipment: '啞鈴',    group: '肩'  },
  { id: 9,  name: '側平舉',   equipment: '啞鈴',    group: '肩'  },
  { id: 10, name: '二頭彎舉', equipment: '啞鈴',    group: '手臂'},
  { id: 11, name: '三頭下壓', equipment: '繩索',    group: '手臂'},
  { id: 12, name: '平板支撐', equipment: '自體重量', group: '核心'},
]

const UNIQUE_GROUPS = Array.from(new Set(EXERCISES.map(e => e.group)))

/* Brutalist color tag per group */
const GROUP_TAG: Record<string, string> = {
  '胸': 'CC', '腿': 'LE', '背': 'BK', '肩': 'SH', '手臂': 'AR', '核心': 'CR',
}

export default function ExercisesPage() {
  const { loc } = useLanguage()
  const [query, setQuery]             = useState('')
  const [activeGroup, setActiveGroup] = useState('ALL')

  /* Translate the "ALL" sentinel for display but keep internal state as 'ALL' */
  const GROUPS = ['ALL', ...UNIQUE_GROUPS]

  const filtered = EXERCISES.filter(e =>
    (activeGroup === 'ALL' || e.group === activeGroup) &&
    (e.name.includes(query) || e.group.includes(query) || e.equipment.includes(query))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div className="steel" style={{ padding: '20px 16px 14px', borderBottom: '3px solid var(--primary)', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-brutal)', fontSize: '30px', color: 'var(--primary)', letterSpacing: '0.06em' }}>
          {loc.exercises.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
          // {EXERCISES.length} {loc.exercises.catalogueSuffix}
        </p>
      </div>

      {/* Search + Filter — fixed below header */}
      <div style={{ flexShrink: 0, background: 'var(--surface-variant)', borderBottom: '2px solid var(--border)', padding: '12px 16px' }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--bg)', border: '2px solid var(--border-heavy)',
          padding: '10px 14px', marginBottom: '10px',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '14px' }}>&gt;</span>
          <input
            type="text"
            placeholder={loc.exercises.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'var(--font-mono)',
              fontSize: '13px', letterSpacing: '0.05em',
            }}
          />
        </div>

        {/* Group filter pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {GROUPS.map(g => {
            const displayLabel = g === 'ALL' ? loc.exercises.allFilter : g
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  background: activeGroup === g ? 'var(--primary)' : 'var(--bg)',
                  border: `2px solid ${activeGroup === g ? 'var(--primary)' : 'var(--border-heavy)'}`,
                  color: activeGroup === g ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-brutal)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  boxShadow: activeGroup === g ? '2px 2px 0 var(--primary-dark)' : 'none',
                }}>
                {displayLabel}
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px solid var(--border)' }}>
            <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '16px', color: 'var(--text-muted)' }}>
              {loc.exercises.notFound}
            </p>
          </div>
        ) : filtered.map(ex => (
          <div key={ex.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px',
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
          }}>
            {/* Group code tag */}
            <div style={{
              flexShrink: 0, width: '32px', height: '32px',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-brutal)',
                fontSize: '10px',
                fontWeight: 700,
                color: '#000',
                letterSpacing: '0',
              }}>{GROUP_TAG[ex.group] || ex.group.slice(0,2).toUpperCase()}</span>
            </div>
            {/* Exercise names and metadata are user data — NOT translated */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '15px', color: 'var(--text)', letterSpacing: '0.04em' }}>
                {ex.name}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {ex.equipment} ╱ {ex.group}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
