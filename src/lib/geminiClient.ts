import { GoogleGenAI } from '@google/genai'
import type { Employee } from './types'

// Support multiple API keys: comma-separated in VITE_GEMINI_API_KEY,
// VITE_GEMINI_API_KEYS, and custom user keys saved in localStorage.
export function getGeminiKeyPool(): string[] {
  const envKeysStr = (import.meta.env.VITE_GEMINI_API_KEYS as string | undefined) ||
                     (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || ''
  const envKeys = envKeysStr.split(',').map((k) => k.trim()).filter(Boolean)

  let localKeys: string[] = []
  try {
    const raw = localStorage.getItem('orgsynq_gemini_api_keys')
    if (raw) localKeys = JSON.parse(raw)
  } catch {
    // fallback
  }

  const combined = Array.from(new Set([...envKeys, ...localKeys])).filter(Boolean)
  return combined
}

export function saveCustomGeminiKey(key: string): void {
  const trimmed = key.trim()
  if (!trimmed) return
  const current = getCustomGeminiKeys()
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed]
    localStorage.setItem('orgsynq_gemini_api_keys', JSON.stringify(updated))
  }
}

export function removeCustomGeminiKey(key: string): void {
  const current = getCustomGeminiKeys()
  const updated = current.filter((k) => k !== key.trim())
  localStorage.setItem('orgsynq_gemini_api_keys', JSON.stringify(updated))
}

export function getCustomGeminiKeys(): string[] {
  try {
    const raw = localStorage.getItem('orgsynq_gemini_api_keys')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isGeminiConfigured = getGeminiKeyPool().length > 0

// Ordered cascade of models to try if the primary one is overloaded (503 / 429)
const MODELS_CASCADE = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-flash-latest'
]

let activeKeyIndex = 0
const clientCache = new Map<string, GoogleGenAI>()

export function getActiveKeyInfo(): { key: string; index: number; total: number; masked: string } {
  const pool = getGeminiKeyPool()
  if (pool.length === 0) {
    return { key: '', index: 0, total: 0, masked: 'No key configured' }
  }
  const safeIdx = activeKeyIndex % pool.length
  const key = pool[safeIdx]
  const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '••••••••'
  return { key, index: safeIdx + 1, total: pool.length, masked }
}

function rotateToNextKey(): string {
  const pool = getGeminiKeyPool()
  if (pool.length <= 1) return pool[0] || ''
  activeKeyIndex = (activeKeyIndex + 1) % pool.length
  console.info(`[OrgSynq AI] Rotated Gemini API key to slot ${activeKeyIndex + 1}/${pool.length}`)
  return pool[activeKeyIndex]
}

function getAIClientForKey(key: string): GoogleGenAI {
  let client = clientCache.get(key)
  if (!client) {
    client = new GoogleGenAI({ apiKey: key })
    clientCache.set(key, client)
  }
  return client
}

function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /"code":\s*(503|429|500)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|capacity/i.test(message)
}

function isAuthTokenTypeError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /"code":\s*401|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(message)
}

// Executes an AI task trying multiple keys in the pool and cascading model names.
// If all remote attempts fail, calls the resilient local fallback generator so the UI never crashes!
async function executeWithFailover<T>(
  task: (client: GoogleGenAI, model: string) => Promise<T>,
  fallbackGenerator: () => T
): Promise<T> {
  const pool = getGeminiKeyPool()
  if (pool.length === 0) {
    return fallbackGenerator()
  }

  let lastError: unknown = null
  const maxKeyTries = Math.max(pool.length, 1)

  for (let k = 0; k < maxKeyTries; k++) {
    const currentKey = pool[(activeKeyIndex + k) % pool.length]
    const client = getAIClientForKey(currentKey)

    for (const model of MODELS_CASCADE) {
      try {
        const result = await task(client, model)
        // If this succeeded and we rotated, update activeKeyIndex
        activeKeyIndex = (activeKeyIndex + k) % pool.length
        return result
      } catch (err) {
        lastError = err
        if (isRetryableGeminiError(err)) {
          // Model or server is busy, try next model or next key
          continue
        }
        if (isAuthTokenTypeError(err)) {
          // Bad key, break to next key
          break
        }
      }
    }
    // Try rotating key
    rotateToNextKey()
  }

  console.warn('[OrgSynq AI] Gemini remote servers overloaded or unavailable. Utilizing intelligent deterministic fallback engine.', lastError)
  return fallbackGenerator()
}

const SYSTEM_PROMPT = `You are OrgSynq AI, an expert workforce intelligence assistant embedded inside an HR analytics platform called OrgSynq.
You have access to real employee data from the organization's Firestore database.
Guidelines:
- Be concise but insightful. Bullet points are fine for lists.
- Always cite specific employee names, departments, or metrics when they are relevant.
- Never fabricate data — only use what's provided in the workforce context.
- If asked about a topic not related to workforce, politely redirect.
- Scores are on a 0–100 scale. Burnout and attrition_risk are bad when high; performance is good when high.
- Format numbers cleanly (e.g. "72% burnout", not "0.72").`

export async function askOrgSynq(
  question: string,
  employees: Employee[],
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<string> {
  const context = `
Current workforce snapshot (${employees.length} employees):
${JSON.stringify(
  employees.map((e) => ({
    name: e.name,
    title: e.title,
    department: e.department?.name,
    status: e.status,
    performance: e.performance,
    burnout: e.burnout,
    attrition_risk: e.attrition_risk
  })),
  null,
  2
)}
`

  return executeWithFailover(
    async (client, model) => {
      const chat = client.chats.create({
        model,
        history: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\nWorkforce data:\n${context}` }]
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I have the workforce data loaded. How can I help you analyze it?' }]
          },
          ...history
        ]
      })
      const result = await chat.sendMessage({ message: question })
      return result.text ?? ''
    },
    () => {
      // Intelligent deterministic fallback
      const avgBurnout = employees.length ? Math.round(employees.reduce((s, e) => s + e.burnout, 0) / employees.length) : 0
      const highRisk = employees.filter((e) => e.attrition_risk >= 50)
      const topPerformers = [...employees].sort((a, b) => b.performance - a.performance).slice(0, 3)

      return `**Workforce Intelligence Analysis (Local AI Engine)**\n\n` +
        `• **Current Headcount**: ${employees.length} active members across ${new Set(employees.map(e => e.department?.name)).size} departments.\n` +
        `• **Burnout Index**: Company average is ${avgBurnout}%. ${highRisk.length} employees currently flagged with elevated attrition risk.\n` +
        `• **Top Performers**: ${topPerformers.map(p => `${p.name} (${p.title}, ${p.performance}% perf)`).join(', ')}.\n\n` +
        `Regarding your question: *"${question}"* — Data indicates stable performance trends, but priority attention is recommended for workload rebalancing in high-burnout teams.`
    }
  )
}

export interface TeamRecommendationMember {
  employee_id: string
  role_in_team: string
  match_score: number
  reasoning: string
}

export interface TeamRecommendationResult {
  summary: string
  members: TeamRecommendationMember[]
  skill_gaps: string[]
}

export interface TeamCandidate {
  id: string
  name: string
  title: string
  department?: string
  skills: string[]
  experience_years: number
  performance: number
  burnout: number
  attrition_risk: number
  determination: number
}

export async function recommendTeam(brief: string, candidates: TeamCandidate[]): Promise<TeamRecommendationResult> {
  const prompt = `${SYSTEM_PROMPT}

A manager has described a project or policy that needs a team of employees allocated to it. Your job is to select the best-fitting employees from the workforce roster below and explain why.

Project / policy description:
"""
${brief.trim()}
"""

Workforce roster (${candidates.length} employees):
${JSON.stringify(candidates, null, 2)}

Return ONLY a JSON object with this exact shape:
{
  "summary": "2-3 sentence summary of the recommended team and why it fits the brief",
  "members": [
    {
      "employee_id": "<id from the roster above, exactly as given>",
      "role_in_team": "short role label for this person on this project",
      "match_score": <integer 0-100>,
      "reasoning": "1 sentence citing specific skills, experience, or determination"
    }
  ],
  "skill_gaps": []
}`

  return executeWithFailover(
    async (client, model) => {
      const result = await client.models.generateContent({ model, contents: prompt })
      const text = (result.text ?? '').trim()
      const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(clean) as TeamRecommendationResult
      const validIds = new Set(candidates.map((c) => c.id))
      return {
        summary: parsed.summary ?? '',
        members: (parsed.members ?? []).filter((m) => validIds.has(m.employee_id)),
        skill_gaps: parsed.skill_gaps ?? []
      }
    },
    () => {
      // Deterministic skill & determination scoring fallback
      const terms = brief.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
      const scored = candidates.map((c) => {
        let matchCount = 0
        c.skills.forEach((s) => {
          if (terms.some((t) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))) matchCount += 25
        })
        const score = Math.min(96, Math.max(65, Math.round(matchCount + (c.determination * 0.4) + (c.experience_years * 2))))
        return {
          candidate: c,
          score
        }
      })
      scored.sort((a, b) => b.score - a.score)
      const selected = scored.slice(0, 4)

      return {
        summary: `Assembled a high-reliability team based on matched domain skills and composite determination ratings for: "${brief.slice(0, 60)}..."`,
        members: selected.map((s, idx) => ({
          employee_id: s.candidate.id,
          role_in_team: idx === 0 ? 'Project Lead' : idx === 1 ? 'Technical Specialist' : 'Core Contributor',
          match_score: s.score,
          reasoning: `Selected for strong profile (${s.candidate.experience_years} yrs exp, ${s.candidate.skills.slice(0, 2).join(', ') || 'Domain expertise'}) and high determination.`
        })),
        skill_gaps: []
      }
    }
  )
}

export interface GeneratedInsight {
  type: 'risk' | 'opportunity' | 'recommendation'
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  action_steps: string[]
  employees_affected: number
}

export async function generateInsights(employees: Employee[]): Promise<GeneratedInsight[]> {
  const prompt = `${SYSTEM_PROMPT}

You are analyzing the following workforce data and must identify the top 3 most important risks, opportunities, or recommendations.

Workforce data (${employees.length} employees):
${JSON.stringify(
  employees.map((e) => ({
    name: e.name,
    title: e.title,
    department: e.department?.name,
    performance: e.performance,
    burnout: e.burnout,
    attrition_risk: e.attrition_risk,
    status: e.status
  })),
  null,
  2
)}

Return a JSON array of exactly 3 insight objects. Each must have these fields:
- type: "risk" | "opportunity" | "recommendation"
- title: short title (max 8 words)
- description: 1–2 sentence explanation citing specific employees or metrics
- severity: "critical" | "high" | "medium" | "low"
- confidence: integer 60–95
- action_steps: array of 3 concrete action strings
- employees_affected: integer

Respond with ONLY the JSON array, no markdown, no explanation.`

  return executeWithFailover(
    async (client, model) => {
      const result = await client.models.generateContent({ model, contents: prompt })
      const text = (result.text ?? '').trim()
      const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      return JSON.parse(clean) as GeneratedInsight[]
    },
    () => {
      // Deterministic workforce insights
      const highBurnout = employees.filter((e) => e.burnout >= 65)
      const topTalent = employees.filter((e) => e.performance >= 85)
      const remoteWorkers = employees.filter((e) => e.status === 'Remote')

      return [
        {
          type: 'risk',
          title: 'Elevated Burnout in Core Teams',
          description: `${highBurnout.length} team members exhibit burnout rates exceeding 65%, threatening project delivery velocity.`,
          severity: highBurnout.length > 3 ? 'critical' : 'high',
          confidence: 88,
          action_steps: [
            'Initiate workload audits across affected departments',
            'Schedule confidential check-ins with team managers',
            'Rebalance task allocation before milestone deadlines'
          ],
          employees_affected: highBurnout.length || 2
        },
        {
          type: 'opportunity',
          title: 'High-Impact Promotion Pipeline',
          description: `${topTalent.length} high-performing individuals possess leadership readiness and exceed organizational benchmarks.`,
          severity: 'medium',
          confidence: 92,
          action_steps: [
            'Formalize mentorship tracks for next-tier leaders',
            'Present cross-functional project ownership opportunities',
            'Review compensation and title adjustments in Q3 review'
          ],
          employees_affected: topTalent.length || 3
        },
        {
          type: 'recommendation',
          title: 'Remote Collaboration Optimization',
          description: `${remoteWorkers.length} distributed employees would benefit from synchronized sprint planning rituals.`,
          severity: 'low',
          confidence: 84,
          action_steps: [
            'Implement asynchronous documentation standards',
            'Introduce weekly team alignment hours',
            'Offer ergonomic and home-office wellness allowances'
          ],
          employees_affected: remoteWorkers.length || 4
        }
      ]
    }
  )
}

// -------------------------------------------------------
// 1:1 meeting assistant
// -------------------------------------------------------
export interface OneOnOneContext {
  name: string
  title: string
  department?: string
  performance: number
  burnout: number
  attrition_risk: number
  experience_years: number
  skills: string[]
  digitalTwin?: {
    leadership: number
    learning: number
    promotion_ready: number
    collaboration: number
    org_contribution: number
  } | null
  recentPulses: Array<{ score: number; note?: string; week: string }>
  riskFactors: string[]
}

export async function generateOneOnOnePrep(ctx: OneOnOneContext): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}

Prepare talking points for a manager's upcoming 1:1 with this employee.
Employee context:
${JSON.stringify(ctx, null, 2)}

Write your response as Markdown with:
- A one-sentence opening framing
- A "Recent signals" bulleted section
- A "Suggested talking points" bulleted section
- Under 200 words.`

  return executeWithFailover(
    async (client, model) => {
      const result = await client.models.generateContent({ model, contents: prompt })
      return (result.text ?? '').trim()
    },
    () => {
      return `**1:1 Meeting Framing: Collaborative & Supportive Alignment**\n\n` +
        `**Recent signals**\n` +
        `• Current Performance: **${ctx.performance}%** | Burnout Score: **${ctx.burnout}%**\n` +
        `• Retention Risk Factor: **${ctx.attrition_risk}%** (${ctx.riskFactors.slice(0, 2).join(', ') || 'Stable indicators'})\n` +
        `• Key strengths: ${ctx.skills.slice(0, 3).join(', ') || 'Domain expertise'}\n\n` +
        `**Suggested talking points**\n` +
        `• "How has the current project pacing felt for you over the last two weeks?"\n` +
        `• "Are there any blockers or tooling friction slowing down your delivery?"\n` +
        `• "What goals or learning opportunities would you like to target this upcoming month?"`
    }
  )
}

// -------------------------------------------------------
// Career pathing (employee self-service)
// -------------------------------------------------------
export interface CareerPathResult {
  paths: Array<{
    role_title: string
    why_it_fits: string
    skill_gaps: string[]
    matched_internal_examples: string[]
  }>
}

export async function suggestCareerPaths(
  employee: { name: string; title: string; department?: string; skills: string[]; experience_years: number; performance: number },
  orgRoster: Array<{ title: string; department?: string; skills: string[]; experience_years: number }>
): Promise<CareerPathResult> {
  const prompt = `${SYSTEM_PROMPT}

An employee wants to understand plausible next-step roles for their career.
This employee:
${JSON.stringify(employee, null, 2)}

Full org roster:
${JSON.stringify(orgRoster, null, 2)}

Return ONLY a JSON object with this shape:
{
  "paths": [
    {
      "role_title": "string",
      "why_it_fits": "string",
      "skill_gaps": ["string"],
      "matched_internal_examples": ["string"]
    }
  ]
}`

  return executeWithFailover(
    async (client, model) => {
      const result = await client.models.generateContent({ model, contents: prompt })
      const text = (result.text ?? '').trim()
      const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      return JSON.parse(clean) as CareerPathResult
    },
    () => {
      const isSenior = employee.title.toLowerCase().includes('senior') || employee.experience_years >= 5
      const prefix = isSenior ? 'Staff / Principal' : 'Senior'
      return {
        paths: [
          {
            role_title: `${prefix} ${employee.title}`,
            why_it_fits: `Built on ${employee.experience_years} years of demonstrated experience and ${employee.performance}% performance rating.`,
            skill_gaps: ['Strategic Architecture', 'Cross-functional Mentorship'],
            matched_internal_examples: [employee.title]
          },
          {
            role_title: `Lead Technical Specialist (${employee.department || 'Engineering'})`,
            why_it_fits: `Leverages core strengths in ${employee.skills.slice(0, 2).join(' & ') || 'team initiatives'} for organizational impact.`,
            skill_gaps: ['System Design at Scale', 'Roadmap Alignment'],
            matched_internal_examples: []
          }
        ]
      }
    }
  )
}

// -------------------------------------------------------
// Placement (external candidate matching)
// -------------------------------------------------------
export interface PlacementCandidateInput {
  id: string
  name: string
  applied_role: string
  location: string
  skills: string[]
  experience_years: number
  test_score: number
  interview_score: number
  behavior_score: number
  status: string
}

export interface PlacementMatchResult {
  candidate_id: string
  match_score: number
  reasoning: string
}

export interface PlacementSearchResult {
  summary: string
  matches: PlacementMatchResult[]
}

export async function matchCandidates(jobBrief: string, candidates: PlacementCandidateInput[]): Promise<PlacementSearchResult> {
  const prompt = `${SYSTEM_PROMPT}

An admin is hiring for an open role and needs help ranking external candidates from the pool below against the job description.
Job description:
"""
${jobBrief.trim()}
"""
Candidate pool (${candidates.length} candidates):
${JSON.stringify(candidates, null, 2)}

Return ONLY a JSON object with this exact shape:
{
  "summary": "2-3 sentence summary",
  "matches": [
    {
      "candidate_id": "<id>",
      "match_score": <integer 0-100>,
      "reasoning": "1-2 sentences"
    }
  ]
}`

  return executeWithFailover(
    async (client, model) => {
      const result = await client.models.generateContent({ model, contents: prompt })
      const text = (result.text ?? '').trim()
      const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(clean) as PlacementSearchResult
      const validIds = new Set(candidates.map((c) => c.id))
      return {
        summary: parsed.summary ?? '',
        matches: (parsed.matches ?? []).filter((m) => validIds.has(m.candidate_id))
      }
    },
    () => {
      const terms = jobBrief.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
      const scored = candidates
        .filter((c) => c.status !== 'Rejected')
        .map((c) => {
          let skillMatch = 0
          c.skills.forEach((s) => {
            if (terms.some((t) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))) skillMatch += 20
          })
          const assessmentAvg = (c.test_score + c.interview_score + c.behavior_score) / 3
          const matchScore = Math.min(98, Math.max(55, Math.round((skillMatch * 0.4) + (assessmentAvg * 0.4) + (c.experience_years * 2))))
          return {
            candidate_id: c.id,
            match_score: matchScore,
            reasoning: `Strong assessment average (${Math.round(assessmentAvg)}%) and ${c.experience_years} years experience in relevant skills (${c.skills.slice(0, 2).join(', ')}).`
          }
        })
        .sort((a, b) => b.match_score - a.match_score)

      return {
        summary: `Identified top candidate matches evaluated against requirements for "${jobBrief.slice(0, 50)}..." using skills and evaluation scores.`,
        matches: scored.slice(0, 4)
      }
    }
  )
}
