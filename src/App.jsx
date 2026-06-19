import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import LandingPage from './pages/LandingPage'
import SessionPage from './pages/SessionPage'
import ReportPage from './pages/ReportPage'
import DashboardPage from './pages/DashboardPage'
import SafetyPage from './pages/SafetyPage'
import TherapyPage from './pages/TherapyPage'
import BodyPage from './pages/BodyPage'

export default function App() {
  return (
    <Sidebar>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/session/:scenarioId/:levelNum" element={<SessionPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/therapy" element={<TherapyPage />} />
        <Route path="/body" element={<BodyPage />} />
        <Route path="/insights" element={<DashboardPage />} />
      </Routes>
    </Sidebar>
  )
}
