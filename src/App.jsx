import { useState } from 'react'
import AppProvider from './context/AppContext'
import { SpaceProvider, useSpace } from './context/SpaceContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/auth/LoginPage'
import Sidebar, { BottomNav } from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import MoneyDashboard from './components/money/MoneyDashboard'
import TimeManagement from './components/time/TimeManagement'
import TaskBoard from './components/tasks/TaskBoard'
import GoalList from './components/goals/GoalList'
import HealthTracker from './components/health/HealthTracker'
import CelebrationToast from './components/shared/CelebrationToast'
import SpaceSelectionPage from './components/spaces/SpaceSelectionPage'

const SECTIONS = {
  dashboard: Dashboard,
  money: MoneyDashboard,
  time: TimeManagement,
  tasks: TaskBoard,
  goals: GoalList,
  health: HealthTracker,
}

function AppInner() {
  const [section, setSection] = useState('dashboard')
  const Section = SECTIONS[section] || Dashboard

  return (
    <div className="flex min-h-screen">
      <Sidebar active={section} onNavigate={setSection} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header section={section} />
        {/* Bottom padding clears the mobile tab bar (+ the home indicator). */}
        <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Section onNavigate={setSection} />
        </main>
      </div>
      <BottomNav active={section} onNavigate={setSection} />
      <CelebrationToast />
    </div>
  )
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#FFF5F8 0%,#FFF9F0 50%,#F5F0FF 100%)' }}>
      <span className="text-4xl animate-pulse">🌸</span>
    </div>
  )
}

function SpacedApp() {
  const { activeSpace, loading } = useSpace()

  if (loading) return <Splash />

  if (!activeSpace) {
    return <SpaceSelectionPage />
  }

  return (
    <AppProvider key={activeSpace.id} spaceId={activeSpace.id}>
      <AppInner />
    </AppProvider>
  )
}

/** Nothing renders until Google sign-in completes. */
function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) return <Splash />
  if (!user) return <LoginPage />

  return (
    <SpaceProvider>
      <SpacedApp />
    </SpaceProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
