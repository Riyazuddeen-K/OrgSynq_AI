import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import CommandCenter from './pages/CommandCenter'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import DigitalTwins from './pages/DigitalTwins'
import SimulationEngine from './pages/SimulationEngine'
import AnalyticsHub from './pages/AnalyticsHub'
import OrgNetwork from './pages/OrgNetwork'
import AIDecisionSupport from './pages/AIDecisionSupport'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<CommandCenter />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="digital-twins" element={<DigitalTwins />} />
        <Route path="simulation-engine" element={<SimulationEngine />} />
        <Route path="analytics-hub" element={<AnalyticsHub />} />
        <Route path="org-network" element={<OrgNetwork />} />
        <Route path="ai-decision-support" element={<AIDecisionSupport />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
