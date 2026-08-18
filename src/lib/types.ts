export interface Department {
  id: string
  name: string
  color: string
}

export type EmploymentStatus = 'Active' | 'Remote' | 'On Leave'

export interface Employee {
  id: string
  name: string
  email: string
  title: string
  department_id: string
  manager_id: string | null
  location: string
  status: EmploymentStatus
  performance: number
  burnout: number
  attrition_risk: number
  avatar_seed: string
  created_at: string
  department?: Department
}

export interface DigitalTwin {
  id: string
  employee_id: string
  performance: number
  skills: number
  leadership: number
  learning: number
  burnout: number
  attrition_risk: number
  promotion_ready: number
  collaboration: number
  org_contribution: number
  overall: number
  updated_at: string
  employee?: Employee
}

export type InsightType = 'risk' | 'opportunity' | 'recommendation' | 'prediction'
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low'
export type InsightStatus = 'open' | 'resolved'

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  severity: InsightSeverity
  confidence: number
  employees_affected: number
  status: InsightStatus
  action_steps: string[]
  created_at: string
  ai_generated?: boolean
}

export interface Simulation {
  id: string
  name: string
  scenario_type: string
  target_department_id: string | null
  affected_employees: number
  productivity_change: number
  financial_impact: number
  project_delay_risk: number
  recovery_time_months: number
  attrition_risk: number
  morale_impact: number
  confidence: number
  recommendations: string[]
  created_at: string
  target_department?: Department
}

export interface HealthTrendPoint {
  id: string
  month: string
  health: number
  sort_order: number
}

export interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface PulseResponse {
  id: string
  employee_id: string
  score: number          // 1–5
  note?: string
  week: string           // ISO week key e.g. "2026-W33"
  created_at: string
}

export type ActivityFeedAction =
  | 'employee_added'
  | 'employee_deleted'
  | 'simulation_run'
  | 'insight_resolved'
  | 'insight_generated'
  | 'pulse_submitted'
  | 'burnout_alert'

export interface ActivityFeedEntry {
  id: string
  action: ActivityFeedAction
  message: string
  actor?: string          // display name of who triggered it
  target?: string         // employee name or simulation name
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type UserRole = 'admin' | 'employee'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  employee_id?: string   // links to employees collection if role = 'employee'
}
