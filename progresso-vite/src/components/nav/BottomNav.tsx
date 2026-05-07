import { NavLink } from 'react-router-dom'
import { Dumbbell, BarChart2, BookOpen, History, Settings } from 'lucide-react'

const tabs = [
  { to: '/workout', icon: Dumbbell, label: '訓練' },
  { to: '/analytics', icon: BarChart2, label: '分析' },
  { to: '/exercises', icon: BookOpen, label: '動作庫' },
  { to: '/history', icon: History, label: '記錄' },
  { to: '/settings', icon: Settings, label: '設定' },
]

export default function BottomNav() {
  return (
    <nav className="flex border-t shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs no-underline transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}>
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
