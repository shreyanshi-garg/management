import { useState } from 'react'
import AppProvider from './context/AppContext'
import { SpaceProvider, useSpace } from './context/SpaceContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import MoneyDashboard from './components/money/MoneyDashboard'
import TimeManagement from './components/time/TimeManagement'
import TaskBoard from './components/tasks/TaskBoard'
import GoalList from './components/goals/GoalList'
import HealthTracker from './components/health/HealthTracker'
import CelebrationToast from './components/shared/CelebrationToast'

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
        <main className="flex-1 overflow-y-auto">
          <Section onNavigate={setSection} />
        </main>
      </div>
      <CelebrationToast />
    </div>
  )
}

function SpacedApp() {
  const { activeSpace } = useSpace()
  return (
    <AppProvider key={activeSpace.id} spaceId={activeSpace.id}>
      <AppInner />
    </AppProvider>
  )
}

export default function App() {
  return (
    <SpaceProvider>
      <SpacedApp />
    </SpaceProvider>
  )
}
