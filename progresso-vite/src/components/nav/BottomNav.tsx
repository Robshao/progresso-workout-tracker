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
    <nav style={{
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            paddingTop: '10px',
            paddingBottom: '10px',
            fontSize: '11px',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: isActive ? 600 : 400,
            transition: 'color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
