import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

/* ── Brutalist Angular SVG Icons (all rectangles, zero curves) ── */
const IconTrain = ({ active }: { active: boolean }) => (
  <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <rect x="0" y="6" width="3" height="10" fill="currentColor"/>
    <rect x="1" y="4" width="2" height="14" fill="currentColor" opacity="0.6"/>
    <rect x="3" y="10" width="18" height="2" fill="currentColor"/>
    <rect x="21" y="6" width="3" height="10" fill="currentColor"/>
    <rect x="21" y="4" width="2" height="14" fill="currentColor" opacity="0.6"/>
    <rect x="10" y="9" width="1" height="4" fill={active ? '#000' : 'currentColor'} opacity="0.5"/>
    <rect x="12" y="9" width="1" height="4" fill={active ? '#000' : 'currentColor'} opacity="0.5"/>
    <rect x="14" y="9" width="1" height="4" fill={active ? '#000' : 'currentColor'} opacity="0.5"/>
  </svg>
)
const IconStats = () => (
  <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <rect x="0" y="21" width="24" height="1" fill="currentColor"/>
    <rect x="1"  y="13" width="5" height="8" fill="currentColor"/>
    <rect x="9"  y="7"  width="5" height="14" fill="currentColor"/>
    <rect x="17" y="1"  width="5" height="20" fill="currentColor"/>
  </svg>
)
const IconIron = () => (
  <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <rect x="4"  y="0"  width="16" height="22" fill="currentColor" opacity="0.15"/>
    <rect x="4"  y="0"  width="16" height="3"  fill="currentColor"/>
    <rect x="4"  y="19" width="16" height="3"  fill="currentColor"/>
    <rect x="4"  y="0"  width="3"  height="22" fill="currentColor"/>
    <rect x="17" y="0"  width="3"  height="22" fill="currentColor"/>
    <rect x="9" y="7" width="6" height="8" fill="var(--bg)"/>
  </svg>
)
const IconLog = () => (
  <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <rect x="0" y="2"  width="24" height="3" fill="currentColor"/>
    <rect x="0" y="9"  width="24" height="3" fill="currentColor"/>
    <rect x="0" y="16" width="16" height="3" fill="currentColor"/>
    <rect x="18" y="14" width="3" height="7" fill="currentColor"/>
    <rect x="18" y="18" width="6" height="3" fill="currentColor"/>
  </svg>
)
const IconSet = () => (
  <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <rect x="9"  y="0"  width="6" height="3"  fill="currentColor"/>
    <rect x="9"  y="19" width="6" height="3"  fill="currentColor"/>
    <rect x="0"  y="9"  width="3" height="6"  fill="currentColor"/>
    <rect x="21" y="9"  width="3" height="6"  fill="currentColor"/>
    <rect x="2"  y="2"  width="3" height="3"  fill="currentColor"/>
    <rect x="19" y="2"  width="3" height="3"  fill="currentColor"/>
    <rect x="2"  y="17" width="3" height="3"  fill="currentColor"/>
    <rect x="19" y="17" width="3" height="3"  fill="currentColor"/>
    <rect x="8" y="8" width="8" height="8" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="4" fill="var(--bg)"/>
  </svg>
)

export default function BottomNav() {
  const { loc } = useLanguage()

  const tabs = [
    { to: '/workout',   label: loc.nav.train, Icon: IconTrain },
    { to: '/analytics', label: loc.nav.stats, Icon: IconStats },
    { to: '/exercises', label: loc.nav.iron,  Icon: IconIron  },
    { to: '/history',   label: loc.nav.log,   Icon: IconLog   },
    { to: '/settings',  label: loc.nav.set,   Icon: IconSet   },
  ]

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: 'flex', flexDirection: 'row', width: '100%', flexShrink: 0,
        borderTop: '3px solid var(--primary)', background: 'var(--surface)',
        position: 'relative',
      }}>
      <div className="brutal-rule" style={{ position: 'absolute', top: -2, left: 0, right: 0, height: '2px' }}/>
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={label}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '5px',
            /* Minimum 44px touch target: 10px top + ~24px content + 10px bottom = 44px */
            paddingTop: '10px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
            minHeight: '44px',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            borderTop: isActive ? '3px solid var(--primary)' : '3px solid transparent',
            borderLeft: '1px solid var(--border)',
            background: isActive ? 'var(--primary-dim)' : 'transparent',
            transition: 'color 0.1s, background 0.1s',
          })}>
          {({ isActive }) => (
            <>
              {/* aria-hidden — the NavLink aria-label carries the accessible name */}
              <Icon active={isActive} aria-hidden="true" />
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-brutal)', fontSize: '10px',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
