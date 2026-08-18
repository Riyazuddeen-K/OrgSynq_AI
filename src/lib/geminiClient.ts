import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Employee } from './types'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(apiKey)

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
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
  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

  const chat = model.startChat({
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

  const result = await chat.sendMessage(question)
  return result.response.text()
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
  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as GeneratedInsight[]
}
