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
  skills: string[]
  experience_years: number
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
  // Who this notification is for: 'admin' (admin-only), 'all' (every
  // signed-in user), or a specific employee's id (only that employee,
  // plus admins who see everything regardless). Missing/undefined on
  // older documents is treated as 'admin' for backward compatibility.
  audience_employee_id?: string
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
  | 'employee_updated'
  | 'simulation_run'
  | 'insight_resolved'
  | 'insight_generated'
  | 'pulse_submitted'
  | 'burnout_alert'
  | 'team_formation_generated'
  | 'department_added'
  | 'department_updated'
  | 'department_deleted'
  | 'one_on_one_logged'
  | 'candidate_added'
  | 'candidate_deleted'
  | 'placement_search_generated'
  | 'course_added'
  | 'course_removed'
  | 'project_created'
  | 'project_deleted'
  | 'project_assigned'
  | 'kudos_given'

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

export interface TeamFormationMember {
  employee_id: string
  role_in_team: string
  match_score: number      // 0–100
  reasoning: string
}

export interface TeamFormation {
  id: string
  brief: string                    // the project/policy description that was entered
  summary: string
  members: TeamFormationMember[]
  skill_gaps: string[]
  created_at: string
}

// -------------------------------------------------------
// One-on-ones (1:1 meeting assistant)
// -------------------------------------------------------
export interface OneOnOne {
  id: string
  employee_id: string
  manager_id: string | null
  talking_points: string   // AI-generated markdown
  created_at: string
}

// -------------------------------------------------------
// Placement (external candidate matching)
// -------------------------------------------------------
export type CandidateStatus = 'New' | 'Screening' | 'Interviewing' | 'Offer' | 'Hired' | 'Rejected'

export interface Candidate {
  id: string
  name: string
  email: string
  applied_role: string
  location: string
  skills: string[]
  experience_years: number
  test_score: number        // 0–100, technical/aptitude test result
  interview_score: number   // 0–100, interview panel score
  behavior_score: number    // 0–100, behavioral/culture-fit assessment
  status: CandidateStatus
  notes?: string
  created_at: string
}

export interface PlacementMatch {
  candidate_id: string
  match_score: number
  reasoning: string
}

export interface PlacementSearch {
  id: string
  job_brief: string
  summary: string
  matches: PlacementMatch[]
  created_at: string
}

// -------------------------------------------------------
// Upskilling (courses, admin-managed / employee-viewed)
// -------------------------------------------------------
export interface Course {
  id: string
  title: string
  description: string
  youtube_url: string
  category?: string
  created_at: string
}

// -------------------------------------------------------
// Project assignment
// -------------------------------------------------------
export type ProjectStatus = 'Planned' | 'Active' | 'Completed'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  member_ids: string[]
  deadline?: string
  created_at: string
}

// -------------------------------------------------------
// Peer recognition (kudos)
// -------------------------------------------------------
export interface Kudos {
  id: string
  from_employee_id: string
  from_name: string
  to_employee_id: string
  to_name: string
  message: string
  created_at: string
}
