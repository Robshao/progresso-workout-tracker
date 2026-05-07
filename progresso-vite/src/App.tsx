import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/nav/BottomNav'
import WorkoutPage from './pages/WorkoutPage'
import ActiveWorkoutPage from './pages/workout/ActiveWorkoutPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ExercisesPage from './pages/ExercisesPage'
import HistoryPage from './pages/HistoryPage'
import ManualEntryPage from './pages/history/ManualEntryPage'
import SettingsPage from './pages/SettingsPage'

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen routes (no bottom nav) */}
        <Route path="/workout/active"  element={<ActiveWorkoutPage />} />
        <Route path="/history/add"     element={<ManualEntryPage />} />

        {/* Main layout routes */}
        <Route path="/workout" element={<MainLayout><WorkoutPage /></MainLayout>} />
        <Route path="/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />
        <Route path="/exercises" element={<MainLayout><ExercisesPage /></MainLayout>} />
        <Route path="/history" element={<MainLayout><HistoryPage /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/workout" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
