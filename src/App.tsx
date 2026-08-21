import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import CommandCenter from './pages/CommandCenter'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import DigitalTwins from './pages/DigitalTwins'
import SimulationEngine from './pages/SimulationEngine'
import Prediction from './pages/Prediction'
import Placement from './pages/Placement'
import AnalyticsHub from './pages/AnalyticsHub'
import OrgNetwork from './pages/OrgNetwork'
import AIDecisionSupport from './pages/AIDecisionSupport'
import Settings from './pages/Settings'
import Login from './pages/Login'
import MyProfile from './pages/MyProfile'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<CommandCenter />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="digital-twins" element={<DigitalTwins />} />
          <Route path="simulation-engine" element={<SimulationEngine />} />
          <Route path="prediction" element={<Prediction />} />
          <Route path="placement" element={<Placement />} />
          <Route path="analytics-hub" element={<AnalyticsHub />} />
          <Route path="org-network" element={<OrgNetwork />} />
          <Route path="ai-decision-support" element={<AIDecisionSupport />} />
          <Route path="settings" element={<Settings />} />
          <Route path="my-profile" element={<MyProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
