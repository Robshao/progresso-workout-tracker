import { useState } from 'react'
import { Search } from 'lucide-react'

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

const GROUPS = ['全部', ...Array.from(new Set(EXERCISES.map(e => e.group)))]

const GROUP_COLORS: Record<string, string> = {
  '胸': '#f06292', '腿': '#7986cb', '背': '#4db6ac',
  '肩': '#ffb74d', '手臂': '#ce93d8', '核心': '#80cbc4',
}

export default function ExercisesPage() {
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('全部')

  const filtered = EXERCISES.filter(e =>
    (activeGroup === '全部' || e.group === activeGroup) &&
    (e.name.includes(query) || e.group.includes(query) || e.equipment.includes(query))
  )

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 pt-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>動作庫</h1>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>共 {EXERCISES.length} 個動作</p>

        {/* Search */}
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ background: 'var(--surface-variant)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }}/>
          <input type="text" placeholder="搜尋動作..." value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text)' }}/>
        </div>

        {/* Group filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {GROUPS.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: activeGroup === g ? 'var(--primary)' : 'var(--surface-variant)',
                color: activeGroup === g ? '#000' : 'var(--text-muted)',
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>找不到符合的動作</p>
            </div>
          ) : filtered.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-4 px-4 py-3 border-t first:border-t-0"
              style={{ borderColor: 'var(--border)' }}>
              <div className="w-2 h-8 rounded-full shrink-0"
                style={{ background: GROUP_COLORS[ex.group] || 'var(--primary)' }}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{ex.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ex.equipment} · {ex.group}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
