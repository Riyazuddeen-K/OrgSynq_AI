import { GoogleGenAI } from '@google/genai'
import type { Employee } from './types'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(apiKey)

// Google retires specific Flash model versions frequently (gemini-1.5-flash,
// then gemini-2.5-flash, were both retired within months of each other).
// Using the "latest" alias instead of a pinned version means Google
// automatically points this at whatever their current stable fast model
// is, so this shouldn't need manual updates every time they ship a new
// one. If Google ever retires the alias itself, check
// ai.google.dev/gemini-api/docs/models for the current alias name.
const MODEL = 'gemini-flash-latest'

let ai: GoogleGenAI | null = null

function getAI(): GoogleGenAI {
  if (!ai) {
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')
    ai = new GoogleGenAI({ apiKey })
  }
  return ai
}

// Google's Gemini API occasionally returns 503/UNAVAILABLE or 429/
// RESOURCE_EXHAUSTED when their servers are under heavy load — this is
// transient and usually clears within a few seconds, not a bug in this
// app. Retry a few times with increasing delay before giving up.
function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /"code":\s*(503|429)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(message)
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isRetryableGeminiError(err) || i === attempts - 1) break
      await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** i))
    }
  }
  throw new Error(
    isRetryableGeminiError(lastErr)
      ? "Gemini is temporarily overloaded on Google's side. This usually clears within a minute — please try again shortly."
      : lastErr instanceof Error
        ? lastErr.message
        : 'Something went wrong talking to Gemini.'
  )
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
  const client = getAI()

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

  const chat = client.chats.create({
    model: MODEL,
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

  const result = await withRetry(() => chat.sendMessage({ message: question }))
  return result.text ?? ''
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
  const client = getAI()

  const prompt = `${SYSTEM_PROMPT}

A manager has described a project or policy that needs a team of employees allocated to it. Your job is to select the best-fitting employees from the workforce roster below and explain why.

Selection criteria, in priority order:
1. Skill match — do the employee's listed skills match what the project/policy requires?
2. Experience — years of relevant experience (experience_years).
3. Determination — a 0–100 composite score already computed for you (higher performance, lower burnout, lower attrition risk = higher determination/reliability). Prefer higher determination when skill match is similar between candidates.

Project / policy description:
"""
${brief.trim()}
"""

Workforce roster (${candidates.length} employees, each with an id you MUST use to reference them):
${JSON.stringify(candidates, null, 2)}

Return ONLY a JSON object with this exact shape, no markdown, no explanation:
{
  "summary": "2-3 sentence summary of the recommended team and why it fits the brief",
  "members": [
    {
      "employee_id": "<id from the roster above, exactly as given>",
      "role_in_team": "short role label for this person on this project, e.g. 'Lead Engineer'",
      "match_score": <integer 0-100>,
      "reasoning": "1 sentence citing specific skills, experience, or determination"
    }
  ],
  "skill_gaps": ["short phrase for a skill the brief needs that no one in the roster covers well — omit the array entry entirely if there are no gaps"]
}

Select between 2 and 8 members — only include people who are a genuine fit, not padding to hit a number. Every "employee_id" MUST be copied exactly from the roster's "id" field — never invent an id or use a name.`

  const result = await withRetry(() => client.models.generateContent({ model: MODEL, contents: prompt }))
  const text = (result.text ?? '').trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(clean) as TeamRecommendationResult

  // Defensive: drop any member whose id doesn't actually exist in the
  // roster we sent, so a hallucinated id never renders as a real person.
  const validIds = new Set(candidates.map((c) => c.id))
  return {
    summary: parsed.summary ?? '',
    members: (parsed.members ?? []).filter((m) => validIds.has(m.employee_id)),
    skill_gaps: parsed.skill_gaps ?? []
  }
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
  const client = getAI()

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

  const result = await withRetry(() => client.models.generateContent({ model: MODEL, contents: prompt }))
  const text = (result.text ?? '').trim()

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as GeneratedInsight[]
}
