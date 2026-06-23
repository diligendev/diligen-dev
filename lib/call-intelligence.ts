// Management Call Notes Intelligence — frontend contract + stub.
//
// Mirrors lib/analysis-ingest.ts: the UI talks only to these types and to
// processCallNotes(). Today processCallNotes() is a front-end stub that returns
// realistic structured intelligence so the whole workflow is demo-able. The
// co-founder replaces its body with a Claude call (rough notes + the deal's CIM
// analysis + prior calls → structured intelligence) and persists CallRecords to
// Supabase. The UI does not change — it consumes the CallIntelligence shape.

import type { DealAnalysis } from "@/lib/mock-data"

export type CallType =
  | "Management"
  | "Banker"
  | "Customer"
  | "Expert"
  | "Site visit"

export const CALL_TYPES: CallType[] = [
  "Management",
  "Banker",
  "Customer",
  "Expert",
  "Site visit",
]

export type Severity = "High" | "Medium" | "Low"
export type FactCategory =
  | "Financials"
  | "Customers"
  | "Operations"
  | "Management"
  | "Market"
export type ActionType = "Data request" | "Follow-up" | "Internal"

export type Contradiction = {
  topic: string
  callClaim: string
  source: "CIM" | "Prior call"
  priorClaim: string
  severity: Severity
  implication: string
  resolved?: boolean
}
export type CallFact = { category: FactCategory; statement: string }
export type NewRisk = { title: string; detail: string; severity: Severity }
export type Confirmation = { topic: string; detail: string }
export type FollowUp = { question: string; why: string; priority: Severity; done?: boolean }
export type ActionItem = { action: string; type: ActionType; done?: boolean }
export type ManagementRead = { topic: string; read: string }

export type CallIntelligence = {
  summary: string
  contradictions: Contradiction[]
  newRisks: NewRisk[]
  confirmations: Confirmation[]
  facts: CallFact[]
  managementRead: ManagementRead[]
  followUps: FollowUp[]
  actionItems: ActionItem[]
}

export type CallMeta = {
  date: string // yyyy-mm-dd
  type: CallType
  participants: string
  title: string
}

export type CallRecord = {
  id: string
  meta: CallMeta
  notes: string
  intelligence: CallIntelligence
}

// Monotonic id source (lint-safe alternative to Date.now in handlers).
let callUid = 0
export function newCallId(): string {
  return `call-${callUid++}-${Math.random().toString(36).slice(2, 7)}`
}

export function suggestCallTitle(date: string): string {
  return `Management call · ${date}`
}

// ── Sample notes per deal for the "Paste sample" shortcut ────────────────────
const SAMPLE_NOTES: Record<string, string> = {
  "meridian-logistics":
    "Mgmt call w/ CEO + CFO. Run-rate rev ~$44M, a touch ahead of CIM. Margin slipping toward 21% — freight pass-through timing, they think temporary. Pushed back when I asked about customer concentration… eventually said top client maybe ~30%? ERP go-live slipped to Q3. Confident on pipeline, vague on pricing power. CEO clearly still in every carrier relationship.",
  "northwind-software":
    "Q2 metrics call. ARR just crossed $21.8M, up 34% YoY vs 31% in CIM. NRR 121%. Logo churn improved to ~4.2%. ACV up to $26K from $24K. Said one large customer renewal is at risk for Q3 — didn't volunteer it, came out late. Founder only selling 30% — wants to stay operational.",
  "cedar-foods":
    "Intro call. LTM rev $34.7M. Gross margin ~22.4%, below the 24.1% in CIM. Reported EBITDA $3.0M vs $4.1M stated — cited one-time plant costs but couldn't itemize on the call. Inputs unhedged. Three national grocery chains = most of distribution.",
  "atlas-medtech":
    "Initial call. LTM rev $19.4M, ~14% YoY. GM holding 64%. Adj EBITDA $3.8M. Reorder rate now 78%, up from 75% in CIM. Top 3 hospital systems still ~43% of revenue — they downplayed it. Two procedures under CMS review in 2027, management seemed unconcerned.",
}

export function sampleNotesFor(dealId: string): string {
  return SAMPLE_NOTES[dealId] ?? ""
}

// ── Severity helpers ─────────────────────────────────────────────────────────
const SEV_RANK: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 }
export function bySeverity<T extends { severity?: Severity; priority?: Severity }>(
  a: T,
  b: T,
): number {
  const sa = a.severity ?? a.priority ?? "Low"
  const sb = b.severity ?? b.priority ?? "Low"
  return SEV_RANK[sa] - SEV_RANK[sb]
}

// ── processCallNotes — BACKEND SEAM ──────────────────────────────────────────
// Replace this body with: send rough notes + the deal's CIM analysis + prior
// calls to Claude, return the CallIntelligence below, and persist a CallRecord.
// The stub returns realistic intelligence and references the deal's CIM analysis
// so contradiction examples feel connected during design review.
export async function processCallNotes(opts: {
  dealId: string
  notes: string
  meta: CallMeta
  analysis: DealAnalysis
  priorCalls: CallRecord[]
}): Promise<CallIntelligence> {
  await new Promise((r) => setTimeout(r, 1100))

  const { analysis, priorCalls, meta } = opts
  const cimMargin = analysis.metrics.ebitdaMargin
  const cimRevenue = analysis.metrics.revenue
  const concentrationFlag = analysis.redFlags.find((f) =>
    /concentrat/i.test(f.title),
  )

  const contradictions: Contradiction[] = [
    {
      topic: "Customer concentration",
      callClaim: "Management put the top customer at ~30% of revenue.",
      source: "CIM",
      priorClaim: concentrationFlag
        ? `CIM flagged "${concentrationFlag.title}" — ${concentrationFlag.detail}`
        : `CIM did not surface concentration at this level.`,
      severity: "High",
      implication:
        "Concentration is materially above what was disclosed — re-test in QoE and reflect in entry price.",
    },
    {
      topic: "EBITDA margin",
      callClaim: "Margin is tracking toward ~21% per management.",
      source: "CIM",
      priorClaim: `CIM stated an EBITDA margin of ${cimMargin}.`,
      severity: "Medium",
      implication:
        "Margin is slipping versus the underwriting case — confirm the driver and whether it is temporary.",
    },
  ]
  if (priorCalls.length > 0) {
    contradictions.push({
      topic: "Gross churn",
      callClaim: "Churn cited at ~8% on this call.",
      source: "Prior call",
      priorClaim: "~5% was indicated on the prior call.",
      severity: "Medium",
      implication:
        "Retention is deteriorating across calls — the story is moving; pressure-test before IC.",
    })
  }

  const newRisks: NewRisk[] = [
    {
      title: "ERP go-live slipped to Q3",
      detail:
        "Management disclosed a delayed ERP migration. Execution and reporting-quality risk through the transition.",
      severity: "Medium",
    },
    {
      title: "Owner dependence",
      detail:
        "CEO remains personally embedded in key commercial relationships — continuity risk post-close.",
      severity: "Medium",
    },
  ]

  const confirmations: Confirmation[] = [
    {
      topic: "Revenue scale",
      detail: `Run-rate revenue is broadly consistent with the CIM's ${cimRevenue}.`,
    },
    {
      topic: "Recurring mix",
      detail: "Management corroborated the recurring-revenue share underpinning the thesis.",
    },
  ]

  const facts: CallFact[] = [
    { category: "Financials", statement: `Run-rate revenue cited near ${cimRevenue}.` },
    { category: "Financials", statement: "EBITDA margin tracking ~21%." },
    { category: "Customers", statement: "Top customer ~30% of revenue (per management)." },
    { category: "Operations", statement: "ERP go-live moved to Q3." },
    { category: "Management", statement: "CEO remains hands-on across carrier/customer relationships." },
    { category: "Market", statement: "Pipeline described as strong; pricing power left vague." },
  ]

  const managementRead: ManagementRead[] = [
    { topic: "Pipeline", read: "Confident and specific — credible." },
    { topic: "Customer concentration", read: "Deflected and slow to answer — probe harder." },
  ]

  const followUps: FollowUp[] = [
    {
      question: "Provide top-20 customer revenue for the last 3 years.",
      why: "Quantify true concentration vs. the ~30% stated and the CIM figure.",
      priority: "High",
    },
    {
      question: "Walk through the EBITDA margin bridge by quarter.",
      why: "Confirm whether the slide to ~21% is one-time or structural.",
      priority: "High",
    },
    {
      question: "What is the committed ERP go-live date and contingency?",
      why: "Slippage signals execution and reporting risk through diligence.",
      priority: "Medium",
    },
    {
      question: "Evidence of pricing power — recent price increases and retention.",
      why: "Management was vague; pricing is central to the margin thesis.",
      priority: "Medium",
    },
  ]

  const actionItems: ActionItem[] = [
    { action: "Request top-20 customer revenue detail (data room).", type: "Data request" },
    { action: "Schedule CTO call to confirm ERP timeline.", type: "Follow-up" },
    { action: "Update the LBO with the ~21% margin case and circulate.", type: "Internal" },
  ]

  return {
    summary: `On this ${meta.type.toLowerCase()} call, management broadly corroborated revenue scale but diverged on customer concentration and margin. Several points contradict the CIM and warrant follow-up before the next round.`,
    contradictions,
    newRisks,
    confirmations,
    facts,
    managementRead,
    followUps,
    actionItems,
  }
}
