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
