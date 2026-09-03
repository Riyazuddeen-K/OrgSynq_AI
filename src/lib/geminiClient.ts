import { GoogleGenAI } from '@google/genai'
import type { Employee } from './types'

// Supports multiple API keys for automatic failover. VITE_GEMINI_API_KEY
// is the primary (required) key; VITE_GEMINI_API_KEY_2 through _5 are
// optional extras. If Google's servers are overloaded (503/429) or one
// specific key is rejected (e.g. the "AQ." key auth issue), the next
// configured key is tried immediately — different keys/projects aren't
// affected by the same rate limit or the same account-level issue.
const API_KEYS: string[] = (() => {
  const env = import.meta.env as Record<string, string | undefined>
  const keys: string[] = []
  if (env.VITE_GEMINI_API_KEY) keys.push(env.VITE_GEMINI_API_KEY)
  for (let i = 2; i <= 5; i++) {
    const extra = env[`VITE_GEMINI_API_KEY_${i}`]
    if (extra) keys.push(extra)
  }
  return keys
})()

export const isGeminiConfigured = API_KEYS.length > 0
export const configuredKeyCount = API_KEYS.length

// Google retires specific Flash model versions frequently (gemini-1.5-flash,
// then gemini-2.5-flash, were both retired within months of each other).
// Using the "latest" alias instead of a pinned version means Google
// automatically points this at whatever their current stable fast model
// is, so this shouldn't need manual updates every time they ship a new
// one. If Google ever retires the alias itself, check
// ai.google.dev/gemini-api/docs/models for the current alias name.
const MODEL = 'gemini-flash-latest'

const clientCache = new Map<string, GoogleGenAI>()

function getClientForKey(key: string): GoogleGenAI {
  let client = clientCache.get(key)
  if (!client) {
    client = new GoogleGenAI({ apiKey: key })
    clientCache.set(key, client)
  }
  return client
}

// Google's Gemini API occasionally returns 503/UNAVAILABLE or 429/
// RESOURCE_EXHAUSTED when their servers are under heavy load, or a
// specific key/project has hit its quota — this is transient (or at
// least isolated to that one key), not a bug in this app.
function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /"code":\s*(503|429)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(message)
}

// As of mid-to-late 2026, Google AI Studio began issuing "AQ."-prefixed
// keys (replacing the older "AIzaSy..." format) that a lot of accounts
// currently cannot authenticate with on generativelanguage.googleapis.com
// — a known, ongoing issue on Google's side (see discuss.ai.google.dev,
// e.g. threads titled "AQ. key returns 401 ACCESS_TOKEN_TYPE_UNSUPPORTED").
// If only some of the configured keys are affected, rotating to another
// key can route around it entirely.
function isAuthTokenTypeError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /"code":\s*401|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(message)
}

// Remembers which key last worked, so subsequent calls try it first
// instead of always starting from the front of the list.
let preferredKeyIndex = 0

/**
 * Runs `fn` against each configured API key in turn (starting from
 * whichever key last succeeded), immediately moving to the next key on
 * any failure — no delay, since a different key/project isn't subject to
 * the same rate limit or auth issue. After a full pass through every key
 * fails, waits briefly and does another pass (up to 2 full passes total)
 * before giving up with a clear, honest error message.
 */
async function withKeyRotation<T>(fn: (client: GoogleGenAI) => Promise<T>): Promise<T> {
  if (API_KEYS.length === 0) throw new Error('VITE_GEMINI_API_KEY is not set')

  const maxPasses = 2
  let lastErr: unknown

  for (let pass = 0; pass < maxPasses; pass++) {
    if (pass > 0) {
      // Every key was tried and failed — wait briefly before a fresh
      // pass, in case it really was transient overload clearing.
      await new Promise((resolve) => setTimeout(resolve, 900 * 2 ** (pass - 1)))
    }

    for (let i = 0; i < API_KEYS.length; i++) {
      const idx = (preferredKeyIndex + i) % API_KEYS.length
      const client = getClientForKey(API_KEYS[idx])
      try {
        const result = await fn(client)
        preferredKeyIndex = idx
        return result
      } catch (err) {
        lastErr = err
        // Try the next key regardless of error type — a different
        // key/project may not share the same overload, quota, or auth issue.
      }
    }
  }

  if (isAuthTokenTypeError(lastErr)) {
    throw new Error(
      API_KEYS.length > 1
        ? `Google is rejecting all ${API_KEYS.length} configured API keys with a 401 (ACCESS_TOKEN_TYPE_UNSUPPORTED). This is a known, ongoing issue on Google's side affecting the newer "AQ."-prefixed AI Studio keys. If you have an older key starting with "AIzaSy", add that as another VITE_GEMINI_API_KEY_n. Otherwise this is currently unresolved on Google's end; track it at discuss.ai.google.dev.`
        : "Google is rejecting this API key with a 401 (ACCESS_TOKEN_TYPE_UNSUPPORTED). This is a known, ongoing issue on Google's side affecting the newer \"AQ.\"-prefixed AI Studio keys — not something wrong in this app, and not fixable by retrying. If you have an older key starting with \"AIzaSy\" (from before mid-2026), that format still works — try that instead, or add it as a second key (see .env.example) so this app can fail over to it automatically. Otherwise this is currently unresolved on Google's end; track it at discuss.ai.google.dev."
    )
  }
  throw new Error(
    isRetryableGeminiError(lastErr)
      ? `Gemini is temporarily overloaded on Google's side${API_KEYS.length > 1 ? ` (tried all ${API_KEYS.length} configured keys)` : ''}. This usually clears within a minute — please try again shortly.${API_KEYS.length === 1 ? ' Adding a second API key (see .env.example) lets this app automatically fail over next time.' : ''}`
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

  const result = await withKeyRotation((client) => {
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
    return chat.sendMessage({ message: question })
  })
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

  const result = await withKeyRotation((client) => client.models.generateContent({ model: MODEL, contents: prompt }))
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

  const result = await withKeyRotation((client) => client.models.generateContent({ model: MODEL, contents: prompt }))
  const text = (result.text ?? '').trim()

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as GeneratedInsight[]
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
  riskFactors: string[]  // plain-language factors from the deterministic attrition breakdown
}

export async function generateOneOnOnePrep(ctx: OneOnOneContext): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}

Prepare talking points for a manager's upcoming 1:1 with this employee. Be specific and useful — not generic management advice.

Employee context:
${JSON.stringify(ctx, null, 2)}

Write your response as Markdown with:
- A one-sentence opening framing (how this 1:1 should feel — celebratory, supportive, corrective, neutral check-in, etc.)
- A "Recent signals" bulleted section citing the specific numbers/factors above
- A "Suggested talking points" bulleted section — 3-5 concrete questions or topics the manager should raise, grounded in the data given
- If recentPulses includes a note field, reference what the employee actually said
- Keep the whole thing under 200 words. No preamble, start directly with the content.`

  const result = await withKeyRotation((client) => client.models.generateContent({ model: MODEL, contents: prompt }))
  return (result.text ?? '').trim()
}

// -------------------------------------------------------
// Career pathing (employee self-service)
// -------------------------------------------------------
export interface CareerPathResult {
  paths: Array<{
    role_title: string
    why_it_fits: string
    skill_gaps: string[]
    matched_internal_examples: string[]  // titles of similar-seniority roles already in the org, if any
  }>
}

export async function suggestCareerPaths(
  employee: { name: string; title: string; department?: string; skills: string[]; experience_years: number; performance: number },
  orgRoster: Array<{ title: string; department?: string; skills: string[]; experience_years: number }>
): Promise<CareerPathResult> {
  const prompt = `${SYSTEM_PROMPT}

An employee wants to understand plausible next-step roles for their career, based on their current skills/experience and the roles that actually exist in this organization today (there's no historical promotion-transition data available, so ground your suggestions in what roles/skills currently exist in the org roster below, not invented history).

This employee:
${JSON.stringify(employee, null, 2)}

Full org roster (title, department, skills, experience_years — for finding realistic next-step roles and skill patterns):
${JSON.stringify(orgRoster, null, 2)}

Return ONLY a JSON object with this shape, no markdown, no explanation:
{
  "paths": [
    {
      "role_title": "a plausible next-step role (can be a role that already exists in the roster, or a reasonable adjacent title if none fits)",
      "why_it_fits": "1-2 sentences citing this employee's actual skills/experience and how they connect",
      "skill_gaps": ["skill they'd want to build to make this move — omit array entirely if none"],
      "matched_internal_examples": ["job titles from the roster that resemble this path — omit if none are close matches"]
    }
  ]
}

Suggest 2-3 paths. Be honest about skill gaps rather than flattering.`

  const result = await withKeyRotation((client) => client.models.generateContent({ model: MODEL, contents: prompt }))
  const text = (result.text ?? '').trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as CareerPathResult
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

Selection criteria, in priority order:
1. Skill match — do the candidate's listed skills match what the job requires?
2. Experience — years of relevant experience (experience_years).
3. Assessment scores — test_score (technical/aptitude test, 0-100), interview_score (panel interview, 0-100), and behavior_score (culture-fit/behavioral assessment, 0-100). Weigh all three; don't let one weak score alone disqualify a strong overall fit, but flag it in the reasoning.
4. status — candidates already marked "Rejected" should generally be excluded unless nothing else in the pool fits.

Job description:
"""
${jobBrief.trim()}
"""

Candidate pool (${candidates.length} candidates, each with an id you MUST use to reference them):
${JSON.stringify(candidates, null, 2)}

Return ONLY a JSON object with this exact shape, no markdown, no explanation:
{
  "summary": "2-3 sentence summary of the best-fitting candidates and why",
  "matches": [
    {
      "candidate_id": "<id from the pool above, exactly as given>",
      "match_score": <integer 0-100>,
      "reasoning": "1-2 sentences citing specific skills, experience, or assessment scores"
    }
  ]
}

Rank and include only genuinely relevant candidates (typically 1-6) — don't pad the list to hit a number. Every "candidate_id" MUST be copied exactly from the pool's "id" field — never invent an id or use a name. Order matches from strongest to weakest fit.`

  const result = await withKeyRotation((client) => client.models.generateContent({ model: MODEL, contents: prompt }))
  const text = (result.text ?? '').trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(clean) as PlacementSearchResult

  const validIds = new Set(candidates.map((c) => c.id))
  return {
    summary: parsed.summary ?? '',
    matches: (parsed.matches ?? []).filter((m) => validIds.has(m.candidate_id))
  }
}
