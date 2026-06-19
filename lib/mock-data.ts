// Mock data layer for the Atlas platform. This is UI-only; a Supabase layer
// will replace these exports later without changing the component contracts.

export type DealStatus = "Processing" | "Complete" | "Error"

// Pipeline stage — the working M&A funnel, distinct from analysis status.
export type DealStage =
  | "New"
  | "Analyzing"
  | "Reviewed"
  | "Pursuing"
  | "Passed"
  | "Closed"

export const DEAL_STAGES: DealStage[] = [
  "New",
  "Analyzing",
  "Reviewed",
  "Pursuing",
  "Passed",
  "Closed",
]

export type Deal = {
  id: string
  company: string
  uploadDate: string // ISO
  score: number | null
  status: DealStatus
  stage: DealStage
  sector: string
  source: string // e.g. "Broker", "Proprietary", "Banker"
  hasCim: boolean
}

export const deals: Deal[] = [
  {
    id: "meridian-logistics",
    company: "Meridian Logistics",
    uploadDate: "2026-06-12",
    score: 7.8,
    status: "Complete",
    stage: "Pursuing",
    sector: "Transportation & Logistics",
    source: "Broker",
    hasCim: true,
  },
  {
    id: "northwind-software",
    company: "Northwind Software",
    uploadDate: "2026-06-11",
    score: 8.4,
    status: "Complete",
    stage: "Pursuing",
    sector: "B2B SaaS",
    source: "Proprietary",
    hasCim: true,
  },
  {
    id: "cedar-foods",
    company: "Cedar Foods Group",
    uploadDate: "2026-06-10",
    score: 5.6,
    status: "Complete",
    stage: "Reviewed",
    sector: "Food & Beverage",
    source: "Banker",
    hasCim: true,
  },
  {
    id: "atlas-medtech",
    company: "Atlas MedTech",
    uploadDate: "2026-06-09",
    score: 6.2,
    status: "Complete",
    stage: "Reviewed",
    sector: "Healthcare Devices",
    source: "Broker",
    hasCim: true,
  },
  {
    id: "vantage-retail",
    company: "Vantage Retail Holdings",
    uploadDate: "2026-06-09",
    score: 4.1,
    status: "Complete",
    stage: "Passed",
    sector: "Specialty Retail",
    source: "Banker",
    hasCim: true,
  },
  {
    id: "polaris-industrial",
    company: "Polaris Industrial",
    uploadDate: "2026-06-08",
    score: null,
    status: "Processing",
    stage: "Analyzing",
    sector: "Industrial Manufacturing",
    source: "Broker",
    hasCim: true,
  },
  {
    id: "blue-harbor",
    company: "Blue Harbor Marine",
    uploadDate: "2026-06-07",
    score: null,
    status: "Error",
    stage: "Analyzing",
    sector: "Marine Services",
    source: "Proprietary",
    hasCim: true,
  },
  {
    id: "summit-energy",
    company: "Summit Energy Partners",
    uploadDate: "2026-06-05",
    score: 7.1,
    status: "Complete",
    stage: "Closed",
    sector: "Energy Services",
    source: "Banker",
    hasCim: true,
  },
  {
    id: "granite-hvac",
    company: "Granite HVAC Services",
    uploadDate: "2026-06-04",
    score: null,
    status: "Complete",
    stage: "New",
    sector: "Industrial Manufacturing",
    source: "Proprietary",
    hasCim: false,
  },
  {
    id: "harborview-dental",
    company: "Harborview Dental Group",
    uploadDate: "2026-06-02",
    score: null,
    status: "Complete",
    stage: "New",
    sector: "Healthcare Devices",
    source: "Broker",
    hasCim: false,
  },
]

export function scoreTier(score: number): "high" | "mid" | "low" {
  if (score >= 7) return "high"
  if (score >= 5) return "mid"
  return "low"
}

export function getDeal(id: string): Deal | undefined {
  return deals.find((d) => d.id === id)
}

// ── Stage presentation ──────────────────────────────────────────────
export const stageConfig: Record<
  DealStage,
  { label: string; dot: string; chip: string }
> = {
  New:       { label: "New",       dot: "bg-slate-400",   chip: "bg-slate-100 text-slate-700 ring-slate-200" },
  Analyzing: { label: "Analyzing", dot: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 ring-blue-200" },
  Reviewed:  { label: "Reviewed",  dot: "bg-violet-500",  chip: "bg-violet-50 text-violet-700 ring-violet-200" },
  Pursuing:  { label: "Pursuing",  dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  Passed:    { label: "Passed",    dot: "bg-red-400",     chip: "bg-red-50 text-red-700 ring-red-200" },
  Closed:    { label: "Closed",    dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 ring-amber-200" },
}

export function pipelineByStage() {
  return DEAL_STAGES.map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
  }))
}

// ── Sector breakdown ────────────────────────────────────────────────
export function sectorBreakdown() {
  const map = new Map<string, number>()
  for (const d of deals) {
    map.set(d.sector, (map.get(d.sector) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count)
}

export const sectors = Array.from(new Set(deals.map((d) => d.sector))).sort()

// ── Needs attention ─────────────────────────────────────────────────
export type AttentionItem = {
  id: string
  company: string
  score: number | null
  status: DealStatus
  reason: string
}

export const needsAttention: AttentionItem[] = [
  {
    id: "blue-harbor",
    company: "Blue Harbor Marine",
    score: null,
    status: "Error",
    reason: "Analysis failed — CIM appears to be a scanned image, re-upload as text PDF.",
  },
  {
    id: "vantage-retail",
    company: "Vantage Retail Holdings",
    score: 4.1,
    status: "Complete",
    reason: "Score 4.1 — declining comps and negative working capital trend.",
  },
  {
    id: "cedar-foods",
    company: "Cedar Foods Group",
    score: 5.6,
    status: "Complete",
    reason: "EBITDA add-backs exceed 25% of reported — review before next call.",
  },
  {
    id: "atlas-medtech",
    company: "Atlas MedTech",
    score: 6.2,
    status: "Complete",
    reason: "Customer concentration above 40% — confirm contract terms in diligence.",
  },
]

// Single source of truth for the "needs review" set. Drives the dashboard
// "Awaiting review" stat, the Needs Attention list, and the /deals?status=attention
// filter so all three always agree. A deal needs review for a curated reason
// (failed analysis, low score, or an open risk flag) — not a raw score cutoff.
export const attentionDealIds = new Set(needsAttention.map((i) => i.id))

// ── Activity feed ───────────────────────────────────────────────────
export type ActivityKind = "analysis" | "kpi" | "trend" | "note" | "stage" | "upload"

export type ActivityItem = {
  id: string
  kind: ActivityKind
  text: string
  deal: string
  timestamp: string // ISO
}

export const activityFeed: ActivityItem[] = [
  { id: "a1", kind: "analysis", text: "CIM analyzed: Northwind Software", deal: "northwind-software", timestamp: "2026-06-12T15:42:00" },
  { id: "a2", kind: "kpi", text: "KPIs logged from management call: Meridian Logistics", deal: "meridian-logistics", timestamp: "2026-06-12T11:18:00" },
  { id: "a3", kind: "stage", text: "Moved to Pursuing: Meridian Logistics", deal: "meridian-logistics", timestamp: "2026-06-12T09:05:00" },
  { id: "a4", kind: "trend", text: "Trend analysis run: Cedar Foods Group", deal: "cedar-foods", timestamp: "2026-06-11T16:30:00" },
  { id: "a5", kind: "note", text: "Note added: Atlas MedTech — broker price expectation $11.2M", deal: "atlas-medtech", timestamp: "2026-06-11T14:02:00" },
  { id: "a6", kind: "upload", text: "CIM uploaded: Polaris Industrial", deal: "polaris-industrial", timestamp: "2026-06-08T10:11:00" },
  { id: "a7", kind: "stage", text: "Marked as Passed: Vantage Retail Holdings", deal: "vantage-retail", timestamp: "2026-06-09T17:48:00" },
]

// ── Documents per deal ──────────────────────────────────────────────
export type DealDocument = {
  id: string
  name: string
  type: "CIM" | "Financials" | "Call Notes" | "Data Request" | "Other"
  uploadDate: string
  size: string
  extracted: boolean
}

const documentsByDeal: Record<string, DealDocument[]> = {
  "meridian-logistics": [
    { id: "d1", name: "Meridian_Logistics_CIM_2026.pdf", type: "CIM", uploadDate: "2026-06-12", size: "4.2 MB", extracted: true },
    { id: "d2", name: "Meridian_Audited_Financials_FY25.xlsx", type: "Financials", uploadDate: "2026-06-12", size: "812 KB", extracted: true },
    { id: "d3", name: "Mgmt_Call_Notes_June12.docx", type: "Call Notes", uploadDate: "2026-06-12", size: "44 KB", extracted: true },
    { id: "d4", name: "Followup_Data_Request_v1.pdf", type: "Data Request", uploadDate: "2026-06-13", size: "128 KB", extracted: false },
  ],
}

export function getDocuments(dealId: string): DealDocument[] {
  return (
    documentsByDeal[dealId] ?? [
      { id: "g1", name: "No documents uploaded", type: "Other", uploadDate: "", size: "—", extracted: false },
    ].filter((d) => d.uploadDate !== "")
  )
}

// ── Diligence checklist ─────────────────────────────────────────────
export type ChecklistStatus = "Open" | "Answered" | "Flagged"

export type ChecklistItem = {
  id: string
  question: string
  status: ChecklistStatus
  note: string
}

const checklistByDeal: Record<string, ChecklistItem[]> = {
  "meridian-logistics": [
    { id: "c1", question: "What portion of the freight cost increase is contractually passable to customers in the next 12 months?", status: "Answered", note: "~60% repriceable at renewal; remainder fixed through Q2 '27." },
    { id: "c2", question: "What is the contract renewal schedule and historical retention for the top 10 accounts?", status: "Open", note: "" },
    { id: "c3", question: "Which carrier and customer relationships are personally held by the founder?", status: "Flagged", note: "Founder holds top 5 carrier relationships — needs transition plan in LOI." },
    { id: "c4", question: "How normalized is working capital across peak and trough freight seasons?", status: "Open", note: "" },
  ],
}

export function getChecklist(dealId: string): ChecklistItem[] {
  return (
    checklistByDeal[dealId] ?? [
      { id: "n1", question: "Confirm trailing-twelve-month revenue and EBITDA.", status: "Open", note: "" },
      { id: "n2", question: "Request customer concentration breakdown.", status: "Open", note: "" },
      { id: "n3", question: "Clarify owner add-backs and normalization.", status: "Open", note: "" },
    ]
  )
}

// ── Notes / activity log per deal ───────────────────────────────────
export type DealNote = {
  id: string
  author: string
  text: string
  timestamp: string
}

const notesByDeal: Record<string, DealNote[]> = {
  "meridian-logistics": [
    { id: "dn1", author: "Jordan Cole", text: "Spoke with broker, price expectation is $9.5M (~5.4x adj. EBITDA). Room to negotiate on structure.", timestamp: "2026-06-12T09:30:00" },
    { id: "dn2", author: "Jordan Cole", text: "Founder mentioned a new regional competitor entering the managed-transportation segment. Worth a market check.", timestamp: "2026-06-11T13:15:00" },
    { id: "dn3", author: "Jordan Cole", text: "Requested monthly P&L for trailing 24 months to validate seasonality of working capital.", timestamp: "2026-06-10T17:40:00" },
  ],
}

export function getNotes(dealId: string): DealNote[] {
  return notesByDeal[dealId] ?? []
}

// ── CIM analysis (unchanged shape, extended source) ─────────────────
export type RedFlag = {
  title: string
  severity: "High" | "Medium" | "Low"
  detail: string
}

export type DiligenceQuestion = {
  question: string
  why: string
}

export type SubScore = {
  label: string
  value: number // 0-10
}

export type EbitdaRow = {
  label: string
  amount: string
  kind?: "base" | "addback" | "total"
}

export type DealAnalysis = {
  id: string
  company: string
  sector: string
  score: number
  recommendation: "Recommend" | "Pass" | "Needs More Information"
  recommendationRationale: string
  metrics: {
    adjustedEbitda: string
    ebitdaMargin: string
    revenue: string
    redFlags: number
  }
  snapshot: string
  highlights: string[]
  redFlags: RedFlag[]
  ebitda: EbitdaRow[]
  ebitdaQuality: "High" | "Moderate" | "Low"
  questions: DiligenceQuestion[]
  subScores: SubScore[]
}

const analysisByDeal: Record<string, DealAnalysis> = {
  "meridian-logistics": {
    id: "meridian-logistics",
    company: "Meridian Logistics",
    sector: "Transportation & Logistics",
    score: 7.8,
    recommendation: "Needs More Information",
    recommendationRationale:
      "Fundamentals support a platform thesis, but margin trajectory and customer concentration require confirmatory diligence before issuing an IOI.",
    metrics: { adjustedEbitda: "$9.86M", ebitdaMargin: "23.1%", revenue: "$42.7M", redFlags: 3 },
    snapshot:
      "Asset-light regional logistics operator generating $42.7M in LTM revenue across freight brokerage and managed transportation. Revenue has grown at a 21% CAGR over three years, driven by net new logo wins and expansion within top accounts. Ownership is concentrated in the founder, who remains operationally involved across commercial and carrier relationships.",
    highlights: [
      "Net revenue retention of 118% indicates durable, expansion-led growth within the installed base.",
      "Asset-light model converts roughly 78% of EBITDA to unlevered free cash flow.",
      "Diversified carrier network of 2,400+ active partners limits single-point capacity risk.",
      "Recurring managed-transportation contracts represent 61% of gross profit.",
    ],
    redFlags: [
      { title: "Gross margin compression", severity: "High", detail: "Gross margin declined 210bps over trailing four quarters as spot freight costs were only partially passed through to customers." },
      { title: "Customer concentration", severity: "Medium", detail: "Top 10 accounts represent 38.9% of revenue, up from 34.5% a year prior. Loss of either top-2 account would reduce EBITDA 9–12%." },
      { title: "Owner dependence", severity: "Medium", detail: "Founder personally manages the five largest carrier relationships with no documented succession plan." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$8.21M", kind: "base" },
      { label: "Owner compensation normalization", amount: "+$0.94M", kind: "addback" },
      { label: "Non-recurring legal settlement", amount: "+$0.41M", kind: "addback" },
      { label: "One-time ERP implementation", amount: "+$0.30M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$9.86M", kind: "total" },
    ],
    ebitdaQuality: "Moderate",
    questions: [
      { question: "What portion of the freight cost increase is contractually passable to customers in the next 12 months?", why: "Determines whether margin compression is structural or a timing artifact reversing on contract renewal." },
      { question: "What is the contract renewal schedule and historical retention for the top 10 accounts?", why: "Quantifies concentration risk and probability-weighted revenue at risk over the hold period." },
      { question: "Which carrier and customer relationships are personally held by the founder?", why: "Frames transition risk and scope of a required management-equity or earnout structure." },
      { question: "How normalized is working capital across peak and trough freight seasons?", why: "Affects the working-capital peg and quality of the adjusted EBITDA bridge." },
    ],
    subScores: [
      { label: "Business Quality", value: 7.6 },
      { label: "Growth Profile", value: 8.2 },
      { label: "Financial Risk", value: 5.9 },
      { label: "Owner Dependence", value: 5.2 },
      { label: "Market Position", value: 7.0 },
    ],
  },

  "northwind-software": {
    id: "northwind-software",
    company: "Northwind Software",
    sector: "B2B SaaS",
    score: 8.4,
    recommendation: "Recommend",
    recommendationRationale:
      "Strong Rule-of-40 profile (52), NRR above 120%, and a sticky mid-market ICP support an IOI. Primary risk is elevated ARR multiple relative to peers — structure accordingly.",
    metrics: { adjustedEbitda: "$6.2M", ebitdaMargin: "28.4%", revenue: "$21.8M", redFlags: 2 },
    snapshot:
      "B2B SaaS platform serving mid-market professional services firms with $21.8M ARR growing at 34% YoY. The product is embedded in daily billing and time-tracking workflows, driving high switching costs and an NRR of 121%. The founding team retains ~70% ownership and is seeking a growth equity partner rather than a full exit.",
    highlights: [
      "Rule-of-40 score of 52 places the business in the top quartile of vertical SaaS comps.",
      "NRR of 121% means the installed base alone drives meaningful organic growth.",
      "Median customer tenure of 4.7 years indicates high switching costs and low churn risk.",
      "Land-and-expand motion: average ACV has grown from $18K to $26K over two years.",
    ],
    redFlags: [
      { title: "Founder partial-exit structure", severity: "Medium", detail: "Founder is seeking liquidity on only 30% of equity. Misaligned incentives post-close must be addressed in governance and vesting terms." },
      { title: "Single-product concentration", severity: "Medium", detail: "94% of ARR is derived from one core module. Roadmap diversification is early-stage and carries execution risk." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$5.1M", kind: "base" },
      { label: "Founder salary normalization", amount: "+$0.72M", kind: "addback" },
      { label: "One-time sales conference", amount: "+$0.18M", kind: "addback" },
      { label: "Non-recurring recruiting costs", amount: "+$0.20M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$6.2M", kind: "total" },
    ],
    ebitdaQuality: "High",
    questions: [
      { question: "What is the ARR churn rate by cohort year?", why: "Determines whether the high NRR is driven by expansion masking underlying logo churn." },
      { question: "What is the product roadmap for the next 18 months and associated capex?", why: "Single-product risk is only mitigated if adjacent modules are near-term and fundable within the hold." },
      { question: "How is pricing structured — per-seat, usage, or flat fee?", why: "Seat-based pricing is most defensible at renewal; usage-based carries downside if client headcount contracts." },
    ],
    subScores: [
      { label: "Business Quality", value: 8.8 },
      { label: "Growth Profile", value: 9.1 },
      { label: "Financial Risk", value: 7.4 },
      { label: "Owner Dependence", value: 6.8 },
      { label: "Market Position", value: 8.2 },
    ],
  },

  "cedar-foods": {
    id: "cedar-foods",
    company: "Cedar Foods Group",
    sector: "Food & Beverage",
    score: 5.6,
    recommendation: "Needs More Information",
    recommendationRationale:
      "Topline is stable but EBITDA add-backs exceed 25% of reported — a QoE is required before we can underwrite the adjusted margin. Pass unless the add-backs normalize.",
    metrics: { adjustedEbitda: "$4.1M", ebitdaMargin: "11.8%", revenue: "$34.7M", redFlags: 4 },
    snapshot:
      "Regional specialty food manufacturer and distributor with $34.7M in revenue across private-label and branded SKUs sold through grocery and foodservice channels. Volumes have been flat for two years while input cost inflation has pressured reported margins. The EBITDA bridge contains $1.1M in add-backs that require third-party validation.",
    highlights: [
      "Private-label channel (58% of revenue) provides volume stability through distributor agreements.",
      "Owned manufacturing facility represents a tangible asset base supporting debt capacity.",
      "Customer relationships with three national grocery chains provide distribution breadth.",
    ],
    redFlags: [
      { title: "Add-back quality", severity: "High", detail: "$1.1M in add-backs represent 26.8% of reported EBITDA. Two items ($0.6M) are recurring in nature and should not be normalized." },
      { title: "Input cost exposure", severity: "High", detail: "Commodity inputs (wheat, edible oils) are unhedged. A 10% move in input costs reduces EBITDA by approximately $0.8M." },
      { title: "Flat revenue for 24 months", severity: "Medium", detail: "No meaningful organic growth since 2023. Management attributes this to SKU rationalization, but volume data does not support the narrative." },
      { title: "Customer concentration", severity: "Medium", detail: "Top 3 customers represent 61% of revenue. Loss of the largest account would reduce revenue by approximately $9M." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$3.0M", kind: "base" },
      { label: "Owner perquisites (car, travel)", amount: "+$0.38M", kind: "addback" },
      { label: "One-time equipment write-off", amount: "+$0.22M", kind: "addback" },
      { label: "\"Non-recurring\" plant maintenance", amount: "+$0.30M", kind: "addback" },
      { label: "\"Non-recurring\" legal fees", amount: "+$0.20M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$4.1M", kind: "total" },
    ],
    ebitdaQuality: "Low",
    questions: [
      { question: "Can management provide invoices and GL detail for each add-back line?", why: "Two recurring add-backs inflate reported EBITDA and must be removed or restructured in the QoE." },
      { question: "What is the commodity hedging policy and current open exposure?", why: "Unhedged input costs represent the single largest source of earnings volatility." },
      { question: "What drove the SKU rationalization and what is the impact on gross margin by channel?", why: "Need to confirm whether flat revenue reflects strategic pruning or demand weakness." },
    ],
    subScores: [
      { label: "Business Quality", value: 5.4 },
      { label: "Growth Profile", value: 4.2 },
      { label: "Financial Risk", value: 4.8 },
      { label: "Owner Dependence", value: 6.1 },
      { label: "Market Position", value: 5.8 },
    ],
  },

  "atlas-medtech": {
    id: "atlas-medtech",
    company: "Atlas MedTech",
    sector: "Healthcare Devices",
    score: 6.2,
    recommendation: "Needs More Information",
    recommendationRationale:
      "Regulatory moat and reorder-driven revenue model are attractive, but 40%+ customer concentration and unclear reimbursement trajectory require resolution before an IOI.",
    metrics: { adjustedEbitda: "$3.8M", ebitdaMargin: "19.6%", revenue: "$19.4M", redFlags: 3 },
    snapshot:
      "Medical device company with an FDA-cleared single-use product line sold to ambulatory surgery centers and hospital outpatient departments. $19.4M in LTM revenue is 78% driven by recurring consumable reorders from the installed device base. Growth has been 14% YoY, constrained by a direct sales force of 12 reps covering 9 states.",
    highlights: [
      "FDA 510(k) clearance creates a regulatory moat that limits direct competition for core SKUs.",
      "78% of revenue from consumable reorders provides high revenue visibility and low CAC.",
      "Gross margin of 64% is consistent with a premium device consumable business.",
      "Pipeline of 3 follow-on clearances in progress would expand addressable procedure count by ~40%.",
    ],
    redFlags: [
      { title: "Customer concentration", severity: "High", detail: "Top 3 hospital systems represent 43% of revenue. Any contract non-renewal would reduce EBITDA by 18–22% given the high incremental margin on reorders." },
      { title: "Reimbursement risk", severity: "Medium", detail: "Two flagship procedures are under CMS reimbursement review in 2027. An adverse ruling could reduce facility demand for the product line." },
      { title: "Sales force capacity constraint", severity: "Medium", detail: "The 12-rep direct model limits geographic expansion. No national distribution partnership is in place." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$3.1M", kind: "base" },
      { label: "Founder compensation above market", amount: "+$0.52M", kind: "addback" },
      { label: "R&D for new clearance (one-time)", amount: "+$0.18M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$3.8M", kind: "total" },
    ],
    ebitdaQuality: "Moderate",
    questions: [
      { question: "What are the contract terms and renewal dates for the top 3 hospital system accounts?", why: "Frames the timing and probability of the single largest earnings risk in the business." },
      { question: "What is the current CMS reimbursement rate for the two procedures under review, and what rate would be needed to maintain facility economics?", why: "Quantifies the downside scenario if reimbursement is reduced in 2027." },
      { question: "What is the plan to scale the direct sales force or add a distribution partner?", why: "Geographic concentration of the rep base limits the TAM accessible without additional investment." },
    ],
    subScores: [
      { label: "Business Quality", value: 6.8 },
      { label: "Growth Profile", value: 6.4 },
      { label: "Financial Risk", value: 5.6 },
      { label: "Owner Dependence", value: 5.8 },
      { label: "Market Position", value: 6.5 },
    ],
  },

  "vantage-retail": {
    id: "vantage-retail",
    company: "Vantage Retail Holdings",
    sector: "Specialty Retail",
    score: 4.1,
    recommendation: "Pass",
    recommendationRationale:
      "Declining comp-store sales, negative working capital trend, and lease liability overhang produce a risk profile that does not support our return threshold at any reasonable entry multiple.",
    metrics: { adjustedEbitda: "$2.3M", ebitdaMargin: "6.1%", revenue: "$37.8M", redFlags: 5 },
    snapshot:
      "Multi-location specialty retail operator with 22 stores across the Southeast. Comp-store sales have declined for six consecutive quarters driven by e-commerce substitution and mall traffic deterioration. Working capital is negative $2.1M and the balance sheet carries $8.4M in undiscounted future lease obligations.",
    highlights: [
      "Brand recognition within its regional niche still drives traffic to top-performing stores.",
      "Owned inventory management system could have standalone value in a liquidation scenario.",
    ],
    redFlags: [
      { title: "Six consecutive quarters of comp decline", severity: "High", detail: "Comp-store sales have declined an average of 4.2% per quarter. There is no evidence in the data that the trend is inflecting." },
      { title: "Negative working capital", severity: "High", detail: "Working capital is -$2.1M, driven by extended vendor payables. This limits operational flexibility and raises going-concern questions if trade credit tightens." },
      { title: "Lease liability overhang", severity: "High", detail: "$8.4M in undiscounted future lease obligations with a weighted-average remaining term of 3.8 years creates fixed cost risk in a declining-revenue environment." },
      { title: "E-commerce penetration below 4%", severity: "Medium", detail: "The business has not built a viable digital channel. Investment required to do so would consume more than two years of adjusted EBITDA." },
      { title: "Management team in transition", severity: "Medium", detail: "CFO departed 90 days ago and has not been replaced. Financial reporting quality has deteriorated in the most recent two periods." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$1.6M", kind: "base" },
      { label: "Departing CFO severance", amount: "+$0.28M", kind: "addback" },
      { label: "Store closure costs (2 locations)", amount: "+$0.42M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$2.3M", kind: "total" },
    ],
    ebitdaQuality: "Low",
    questions: [
      { question: "What is the lease exit cost and timeline for the 8 underperforming stores?", why: "Required to quantify the true cost of a restructuring scenario versus a going-concern hold." },
    ],
    subScores: [
      { label: "Business Quality", value: 3.8 },
      { label: "Growth Profile", value: 2.9 },
      { label: "Financial Risk", value: 3.4 },
      { label: "Owner Dependence", value: 5.2 },
      { label: "Market Position", value: 4.0 },
    ],
  },

  "summit-energy": {
    id: "summit-energy",
    company: "Summit Energy Partners",
    sector: "Energy Services",
    score: 7.1,
    recommendation: "Recommend",
    recommendationRationale:
      "Contracted backlog provides 18 months of revenue visibility, and the recurring maintenance book generates stable cash flow. Closed deal — post-acquisition KPI tracking recommended.",
    metrics: { adjustedEbitda: "$7.4M", ebitdaMargin: "22.8%", revenue: "$32.5M", redFlags: 2 },
    snapshot:
      "Energy infrastructure services company with $32.5M in LTM revenue from inspection, maintenance, and specialty construction for midstream pipeline operators. 64% of revenue is from recurring inspection and maintenance contracts; the remainder is project-based. The business was acquired at close and is now in the integration phase.",
    highlights: [
      "18-month contracted revenue backlog of $21M provides strong near-term visibility.",
      "Recurring inspection and maintenance contracts have an average term of 3.2 years.",
      "Proprietary inspection technology creates a differentiated offering versus generalist competitors.",
      "Management team has been retained with a 3-year equity rollover arrangement.",
    ],
    redFlags: [
      { title: "Project revenue lumpiness", severity: "Medium", detail: "36% of revenue is project-based and carries quarter-to-quarter variability of up to 25%. This creates cash flow forecasting challenges." },
      { title: "Commodity price sensitivity", severity: "Medium", detail: "Client capex budgets are sensitive to oil and gas prices. A sustained downturn could defer maintenance spending despite contractual commitments." },
    ],
    ebitda: [
      { label: "Reported EBITDA", amount: "$6.8M", kind: "base" },
      { label: "Transaction costs (one-time)", amount: "+$0.42M", kind: "addback" },
      { label: "Integration consulting (one-time)", amount: "+$0.18M", kind: "addback" },
      { label: "Adjusted EBITDA", amount: "$7.4M", kind: "total" },
    ],
    ebitdaQuality: "High",
    questions: [
      { question: "What is the renewal rate and pricing change on inspection contracts renewing in the next 12 months?", why: "Quantifies the organic revenue growth embedded in the existing book." },
    ],
    subScores: [
      { label: "Business Quality", value: 7.4 },
      { label: "Growth Profile", value: 6.8 },
      { label: "Financial Risk", value: 6.6 },
      { label: "Owner Dependence", value: 7.8 },
      { label: "Market Position", value: 7.2 },
    ],
  },
}

// Fallback for deals still in processing or without a full analysis
const defaultAnalysis: Omit<DealAnalysis, "id" | "company" | "sector" | "score"> = {
  recommendation: "Needs More Information",
  recommendationRationale: "Analysis in progress — check back once processing is complete.",
  metrics: { adjustedEbitda: "—", ebitdaMargin: "—", revenue: "—", redFlags: 0 },
  snapshot: "CIM analysis is currently processing. Metrics and recommendations will appear here once complete.",
  highlights: [],
  redFlags: [],
  ebitda: [],
  ebitdaQuality: "Moderate",
  questions: [
    { question: "Confirm trailing-twelve-month revenue and EBITDA.", why: "Baseline for all valuation and diligence work." },
    { question: "Request customer concentration breakdown.", why: "Standard first-pass concentration check." },
    { question: "Clarify owner add-backs and normalization.", why: "Required to assess adjusted EBITDA quality before issuing an IOI." },
  ],
  subScores: [],
}

export function getAnalysis(id: string): DealAnalysis {
  if (analysisByDeal[id]) return analysisByDeal[id]
  const deal = deals.find((d) => d.id === id)
  return {
    ...defaultAnalysis,
    id,
    company: deal?.company ?? id,
    sector: deal?.sector ?? "—",
    score: deal?.score ?? 0,
  }
}

export const monthlyStats = {
  // CIM screens completed in the trailing 30 days. Intentionally exceeds the
  // active pipeline count — analysts screen far more CIMs than they advance to
  // the pipeline. "Awaiting review" is derived from needsAttention, not stored
  // here, so the dashboard stat and the Needs Attention list never disagree.
  analyzed: 24,
}

// ── Subscription, plans & usage ─────────────────────────────────────
// Plan limits are sized for lower-middle-market deal flow: a single analyst
// screens 5–15 CIMs/week, so an active firm runs hundreds of analyses a month
// across a wide top-of-funnel while advancing only a fraction to the pipeline.

export type PlanId = "professional" | "pro-max" | "enterprise"

export type PlanLimits = {
  analysesPerMonth: number // -1 = unlimited
  activeDeals: number
  seats: number
  storageGb: number
}

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  priceLabel: string
  limits: PlanLimits
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "For search funds and lean LMM deal teams.",
    priceLabel: "$1,500 / mo",
    limits: { analysesPerMonth: 200, activeDeals: 500, seats: 10, storageGb: 100 },
    features: [
      "AI CIM analysis & scoring",
      "Deal pipeline & KPI tracking",
      "Trend & concentration analytics",
      "CSV export",
      "Email support",
    ],
  },
  "pro-max": {
    id: "pro-max",
    name: "Pro Max",
    tagline: "For active LMM and lower-middle-market PE funds.",
    priceLabel: "$4,000 / mo",
    limits: { analysesPerMonth: 800, activeDeals: 2000, seats: 30, storageGb: 500 },
    features: [
      "Everything in Professional",
      "Priority analysis processing",
      "Custom scoring models",
      "API access",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For multi-strategy and institutional PE firms.",
    priceLabel: "Custom",
    limits: { analysesPerMonth: -1, activeDeals: -1, seats: -1, storageGb: -1 },
    features: [
      "Everything in Pro Max",
      "Unlimited analyses & deals",
      "SSO / SAML & SCIM provisioning",
      "Audit logs & data residency",
      "Dedicated success manager",
    ],
  },
}

export type TeamMember = {
  name: string
  email: string
  role: string
  initials: string
}

// Firm members occupying seats. Seat usage is derived from this list so the
// Team roster and the usage meter can never drift apart.
export const teamMembers: TeamMember[] = [
  { name: "A. Reyes", email: "a.reyes@meridiancap.com", role: "Managing Partner", initials: "AR" },
  { name: "J. Park", email: "j.park@meridiancap.com", role: "Principal", initials: "JP" },
  { name: "M. Osei", email: "m.osei@meridiancap.com", role: "Vice President", initials: "MO" },
  { name: "D. Whitman", email: "d.whitman@meridiancap.com", role: "Associate", initials: "DW" },
  { name: "S. Chen", email: "s.chen@meridiancap.com", role: "Associate", initials: "SC" },
  { name: "L. Romano", email: "l.romano@meridiancap.com", role: "Analyst", initials: "LR" },
]

// Active subscription for the signed-in workspace. Swap for a Supabase + Stripe
// read when billing is wired — the shape stays identical.
export const subscription = {
  firmName: "Meridian Capital",
  firmType: "Lower-middle-market PE",
  planId: "professional" as PlanId,
  storageUsedGb: 18.4,
  billingCycle: "Monthly" as "Monthly" | "Annual",
  renewalDate: "2026-07-01",
  usageResetDate: "2026-07-01",
}

export type UsageMetric = {
  key: string
  label: string
  used: number
  limit: number // -1 = unlimited
  unit?: string
  hint?: string
}

// Usage is derived from live app state where possible so the meters move with
// real activity (add a deal → "Active deals" ticks up). When the backend lands,
// `used` values come from aggregate queries; the limits stay plan-driven.
export function getUsage(): UsageMetric[] {
  const plan = PLANS[subscription.planId]
  return [
    {
      key: "analyses",
      label: "CIM analyses",
      used: monthlyStats.analyzed,
      limit: plan.limits.analysesPerMonth,
      hint: "Resets monthly",
    },
    {
      key: "deals",
      label: "Active deals",
      used: deals.length,
      limit: plan.limits.activeDeals,
    },
    {
      key: "seats",
      label: "Seats",
      used: teamMembers.length,
      limit: plan.limits.seats,
    },
    {
      key: "storage",
      label: "Storage",
      used: subscription.storageUsedGb,
      limit: plan.limits.storageGb,
      unit: "GB",
    },
  ]
}

// ── KPI tracker history ─────────────────────────────────────────────
export type Kpi = {
  label: string
  value: string
  cimValue?: string
  // numeric value for trend deltas
  numeric?: number
}

export type KpiEntry = {
  id: string
  dealId: string
  date: string
  callTitle: string
  kpis: Kpi[]
}

const kpiHistoryByDeal: Record<string, KpiEntry[]> = {
  "meridian-logistics": [
    {
      id: "k-ml-2",
      dealId: "meridian-logistics",
      date: "2026-06-12",
      callTitle: "Q2 management update call",
      kpis: [
        { label: "Revenue (run-rate)", value: "$44.2M", cimValue: "$42.7M", numeric: 44.2 },
        { label: "EBITDA", value: "$9.4M", numeric: 9.4 },
        { label: "EBITDA Margin", value: "21.3%", cimValue: "23.1%", numeric: 21.3 },
        { label: "Headcount", value: "312", numeric: 312 },
        { label: "Customer Count", value: "1,840", numeric: 1840 },
        { label: "Gross Churn", value: "8.1%", cimValue: "6.4%", numeric: 8.1 },
        { label: "Net Revenue Retention", value: "116%", numeric: 116 },
        { label: "Top-10 Concentration", value: "41.2%", cimValue: "38.9%", numeric: 41.2 },
      ],
    },
    {
      id: "k-ml-1",
      dealId: "meridian-logistics",
      date: "2026-05-08",
      callTitle: "Initial management intro call",
      kpis: [
        { label: "Revenue (run-rate)", value: "$43.1M", numeric: 43.1 },
        { label: "EBITDA", value: "$9.6M", numeric: 9.6 },
        { label: "EBITDA Margin", value: "22.3%", numeric: 22.3 },
        { label: "Headcount", value: "305", numeric: 305 },
        { label: "Customer Count", value: "1,795", numeric: 1795 },
        { label: "Gross Churn", value: "7.2%", numeric: 7.2 },
        { label: "Net Revenue Retention", value: "118%", numeric: 118 },
        { label: "Top-10 Concentration", value: "39.4%", numeric: 39.4 },
      ],
    },
  ],

  "northwind-software": [
    {
      id: "k-ns-2",
      dealId: "northwind-software",
      date: "2026-06-10",
      callTitle: "Q2 SaaS metrics call",
      kpis: [
        { label: "ARR", value: "$21.8M", cimValue: "$20.4M", numeric: 21.8 },
        { label: "ARR Growth (YoY)", value: "34%", cimValue: "31%", numeric: 34 },
        { label: "EBITDA Margin", value: "28.4%", numeric: 28.4 },
        { label: "Net Revenue Retention", value: "121%", cimValue: "119%", numeric: 121 },
        { label: "Gross Logo Churn", value: "4.2%", numeric: 4.2 },
        { label: "ACV (avg)", value: "$26K", cimValue: "$24K", numeric: 26 },
        { label: "Headcount", value: "87", numeric: 87 },
        { label: "Rule of 40", value: "62", numeric: 62 },
      ],
    },
    {
      id: "k-ns-1",
      dealId: "northwind-software",
      date: "2026-04-22",
      callTitle: "Initial management intro call",
      kpis: [
        { label: "ARR", value: "$20.1M", numeric: 20.1 },
        { label: "ARR Growth (YoY)", value: "31%", numeric: 31 },
        { label: "EBITDA Margin", value: "27.1%", numeric: 27.1 },
        { label: "Net Revenue Retention", value: "119%", numeric: 119 },
        { label: "Gross Logo Churn", value: "4.8%", numeric: 4.8 },
        { label: "ACV (avg)", value: "$24K", numeric: 24 },
        { label: "Headcount", value: "82", numeric: 82 },
        { label: "Rule of 40", value: "58", numeric: 58 },
      ],
    },
  ],

  "cedar-foods": [
    {
      id: "k-cf-1",
      dealId: "cedar-foods",
      date: "2026-06-08",
      callTitle: "Initial management intro call",
      kpis: [
        { label: "Revenue (LTM)", value: "$34.7M", numeric: 34.7 },
        { label: "Gross Margin", value: "22.4%", cimValue: "24.1%", numeric: 22.4 },
        { label: "Reported EBITDA", value: "$3.0M", cimValue: "$4.1M", numeric: 3.0 },
        { label: "EBITDA Margin", value: "8.6%", cimValue: "11.8%", numeric: 8.6 },
        { label: "SKU Count", value: "184", numeric: 184 },
        { label: "Active Distributor Accounts", value: "312", numeric: 312 },
        { label: "Headcount", value: "218", numeric: 218 },
      ],
    },
  ],

  "atlas-medtech": [
    {
      id: "k-am-1",
      dealId: "atlas-medtech",
      date: "2026-06-07",
      callTitle: "Initial management intro call",
      kpis: [
        { label: "Revenue (LTM)", value: "$19.4M", numeric: 19.4 },
        { label: "Revenue Growth (YoY)", value: "14%", numeric: 14 },
        { label: "Gross Margin", value: "64.2%", numeric: 64.2 },
        { label: "Adjusted EBITDA", value: "$3.8M", numeric: 3.8 },
        { label: "EBITDA Margin", value: "19.6%", numeric: 19.6 },
        { label: "Consumable Reorder %", value: "78%", cimValue: "75%", numeric: 78 },
        { label: "Active ASC Accounts", value: "142", numeric: 142 },
        { label: "Sales Reps", value: "12", numeric: 12 },
      ],
    },
  ],

  "summit-energy": [
    {
      id: "k-se-1",
      dealId: "summit-energy",
      date: "2026-05-15",
      callTitle: "Post-close 90-day review",
      kpis: [
        { label: "Revenue (LTM)", value: "$32.5M", numeric: 32.5 },
        { label: "Contracted Backlog", value: "$21M", numeric: 21 },
        { label: "Adjusted EBITDA", value: "$7.4M", numeric: 7.4 },
        { label: "EBITDA Margin", value: "22.8%", numeric: 22.8 },
        { label: "Recurring Revenue %", value: "64%", numeric: 64 },
        { label: "Contract Renewal Rate", value: "91%", numeric: 91 },
        { label: "Headcount", value: "196", numeric: 196 },
      ],
    },
  ],
}

export function getKpiHistory(dealId: string): KpiEntry[] {
  return kpiHistoryByDeal[dealId] ?? []
}

// ── Trend analyzer ──────────────────────────────────────────────────
export type TrendMetric = "revenue" | "margin" | "churn"

export type TrendPoint = {
  period: string
  target: number
  sector: number
}

type TrendSeries = Record<TrendMetric, TrendPoint[]>

export const trendMetricMeta: Record<
  TrendMetric,
  { label: string; unit: string; format: (v: number) => string; better: "up" | "down" }
> = {
  revenue: {
    label: "Revenue Growth (YoY)",
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
    better: "up",
  },
  margin: {
    label: "EBITDA Margin",
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
    better: "up",
  },
  churn: {
    label: "Gross Revenue Churn",
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
    better: "down",
  },
}

const quarterPeriods = ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"]
const annualPeriods = ["2022", "2023", "2024", "2025"]

function buildSeries(periods: string[], target: number[], sector: number[]): TrendPoint[] {
  return periods.map((period, i) => ({ period, target: target[i], sector: sector[i] }))
}

// Per-deal trend series — each deal gets its own realistic data
const trendDataByDeal: Record<string, Record<"quarterly" | "annual", TrendSeries>> = {
  "meridian-logistics": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [24.1,23.4,22.0,21.2,20.4,19.1,18.2,17.4], [16.2,16.0,15.4,15.1,14.8,14.2,13.9,13.5]),
      margin:  buildSeries(quarterPeriods, [25.2,24.8,24.1,23.6,23.1,22.4,21.8,21.3], [21.0,21.2,21.1,21.4,21.3,21.6,21.5,21.8]),
      churn:   buildSeries(quarterPeriods, [5.1,5.4,5.8,6.2,6.4,7.0,7.6,8.1],         [7.8,7.6,7.7,7.5,7.4,7.3,7.2,7.1]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [26.5,23.2,20.9,18.0], [17.1,15.9,15.0,13.7]),
      margin:  buildSeries(annualPeriods, [25.8,24.4,23.0,21.5], [20.8,21.2,21.4,21.6]),
      churn:   buildSeries(annualPeriods, [4.6,5.6,6.7,7.7],     [7.9,7.6,7.4,7.2]),
    },
  },
  "northwind-software": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [38.2,37.4,36.1,35.4,34.8,34.2,34.0,34.0], [24.1,23.8,23.2,22.9,22.4,21.8,21.4,21.0]),
      margin:  buildSeries(quarterPeriods, [24.8,25.2,26.1,26.8,27.1,27.8,28.1,28.4], [18.2,18.4,18.6,18.9,19.1,19.3,19.4,19.6]),
      churn:   buildSeries(quarterPeriods, [6.2,5.8,5.4,5.1,4.9,4.6,4.4,4.2],         [8.1,7.9,7.8,7.7,7.5,7.4,7.3,7.2]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [48.2,42.1,37.4,34.0], [28.4,25.2,23.1,21.0]),
      margin:  buildSeries(annualPeriods, [22.4,24.1,26.2,28.4], [17.4,18.1,18.8,19.6]),
      churn:   buildSeries(annualPeriods, [7.8,6.6,5.4,4.2],     [8.6,8.1,7.6,7.2]),
    },
  },
  "cedar-foods": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [2.8,1.4,-0.2,-1.1,-0.8,-1.4,-1.8,-2.1], [4.2,4.0,3.8,3.6,3.4,3.2,3.0,2.9]),
      margin:  buildSeries(quarterPeriods, [24.1,23.6,23.1,22.8,22.4,22.1,21.8,22.4],[18.2,18.4,18.3,18.5,18.4,18.6,18.5,18.7]),
      churn:   buildSeries(quarterPeriods, [9.1,9.4,9.8,10.2,10.4,10.8,11.1,11.4],  [8.4,8.2,8.1,8.0,7.9,7.8,7.7,7.6]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [8.4,4.2,0.8,-1.6], [6.2,5.1,4.0,3.1]),
      margin:  buildSeries(annualPeriods, [26.1,24.8,23.4,22.4],[17.8,18.2,18.4,18.7]),
      churn:   buildSeries(annualPeriods, [7.2,8.4,9.8,11.4],  [8.8,8.4,8.1,7.6]),
    },
  },
  "atlas-medtech": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [18.4,17.8,16.9,16.2,15.8,15.1,14.6,14.0],[12.1,11.8,11.6,11.4,11.2,11.0,10.8,10.6]),
      margin:  buildSeries(quarterPeriods, [62.1,62.8,63.4,63.8,64.0,64.1,64.2,64.2],[44.1,44.4,44.6,44.8,45.0,45.1,45.2,45.4]),
      churn:   buildSeries(quarterPeriods, [4.8,4.6,4.4,4.2,4.1,4.0,3.9,3.8],        [7.4,7.2,7.1,7.0,6.9,6.8,6.7,6.6]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [24.1,20.4,17.2,14.0],[14.2,12.8,11.6,10.6]),
      margin:  buildSeries(annualPeriods, [60.4,61.8,63.2,64.2],[43.2,43.8,44.4,45.4]),
      churn:   buildSeries(annualPeriods, [6.8,5.8,4.8,3.8],    [8.2,7.6,7.1,6.6]),
    },
  },
  "vantage-retail": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [-2.1,-3.4,-4.2,-4.8,-5.1,-5.6,-6.0,-6.4],[1.8,1.4,1.1,0.8,0.6,0.4,0.2,0.1]),
      margin:  buildSeries(quarterPeriods, [8.4,7.8,7.2,6.8,6.4,6.2,6.0,6.1],        [18.2,18.4,18.3,18.5,18.4,18.6,18.5,18.7]),
      churn:   buildSeries(quarterPeriods, [12.1,13.4,14.2,15.1,15.8,16.4,17.1,17.8],[8.4,8.2,8.1,8.0,7.9,7.8,7.7,7.6]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [2.1,-1.2,-3.8,-6.2],[3.4,2.1,1.2,0.4]),
      margin:  buildSeries(annualPeriods, [11.2,9.4,7.8,6.1],  [17.8,18.2,18.4,18.7]),
      churn:   buildSeries(annualPeriods, [9.4,11.2,13.8,17.2],[8.8,8.4,8.1,7.6]),
    },
  },
  "summit-energy": {
    quarterly: {
      revenue: buildSeries(quarterPeriods, [14.2,13.8,13.1,12.8,12.4,12.1,11.8,11.4],[10.1,10.0,9.8,9.7,9.6,9.4,9.3,9.2]),
      margin:  buildSeries(quarterPeriods, [21.4,21.8,22.1,22.4,22.6,22.8,22.8,22.8],[16.4,16.6,16.8,17.0,17.1,17.2,17.3,17.4]),
      churn:   buildSeries(quarterPeriods, [6.4,6.1,5.8,5.6,5.4,5.2,5.0,4.8],        [8.1,7.9,7.8,7.7,7.5,7.4,7.3,7.2]),
    },
    annual: {
      revenue: buildSeries(annualPeriods, [18.4,16.2,13.8,11.4],[12.4,11.2,10.2,9.2]),
      margin:  buildSeries(annualPeriods, [19.8,21.2,22.4,22.8],[15.8,16.2,16.8,17.4]),
      churn:   buildSeries(annualPeriods, [8.2,7.1,6.0,4.8],    [8.6,8.1,7.6,7.2]),
    },
  },
}

const trendInsightsByDeal: Record<string, Record<TrendMetric, string>> = {
  "meridian-logistics": {
    revenue: "Revenue growth is decelerating faster than the sector — the target has compressed from a ~8pt premium to a ~4pt premium over eight quarters. Consistent with the customer-concentration red flag and warrants a cohort-level review.",
    margin:  "EBITDA margin has inverted relative to the sector. The target traded at a premium through Q3 '24 but now sits ~50bps below peers, confirming the freight pass-through margin compression flagged in diligence.",
    churn:   "Gross churn has crossed above the sector benchmark for the first time. The trajectory diverges sharply from peers who are improving retention, and supports re-testing the top-10 concentration assumption.",
  },
  "northwind-software": {
    revenue: "Revenue growth is decelerating from a high base — expected in maturing SaaS — but remains 13pts above sector median. The deceleration rate (~1pt/quarter) is consistent with natural market penetration, not demand issues.",
    margin:  "EBITDA margin has expanded 3.6pts over two years while sector peers are flat, driven by operating leverage on a largely fixed cost base. This validates the scalability of the business model.",
    churn:   "Gross logo churn has improved consistently from 6.2% to 4.2% over eight quarters, outperforming sector benchmarks at every point. This is the strongest indicator of product-market fit in the data set.",
  },
  "cedar-foods": {
    revenue: "Revenue growth has turned negative and is now 5pts below sector median. The divergence accelerated in Q3 '24 and has not stabilized, suggesting the SKU rationalization narrative does not fully explain the decline.",
    margin:  "Gross margin has compressed 1.7pts while sector peers have remained flat, consistent with unhedged input cost exposure and limited pricing power in the private-label channel.",
    churn:   "Customer churn is tracking above sector median and trending in the wrong direction. The 3.8pt spread versus peers is the widest in the pipeline and warrants direct investigation of distributor relationship health.",
  },
  "atlas-medtech": {
    revenue: "Revenue growth is decelerating as the direct sales force reaches geographic capacity but remains above sector median. Expansion of the rep count or a distribution partner is the primary lever to re-accelerate.",
    margin:  "Gross margin has expanded 3.8pts over two years, reflecting the high contribution margin of consumable reorders on an established installed device base. This is the strongest financial characteristic of the business.",
    churn:   "Gross churn is well below sector median and improving, consistent with the high switching-cost dynamics of an embedded clinical workflow product. The 2.8pt spread versus peers is a meaningful competitive differentiator.",
  },
  "vantage-retail": {
    revenue: "Revenue growth has been negative for six consecutive quarters and is now 6.5pts below sector median. The divergence is structural — this business requires a turnaround, not a growth equity strategy.",
    margin:  "EBITDA margin has compressed from 11.2% to 6.1% while sector peers have maintained stable margins. The gap is widening and reflects fixed cost deleverage as revenue declines.",
    churn:   "Customer churn is tracking more than 10pts above sector median and accelerating — the clearest signal in the pipeline that the retail format is not competitive with digital alternatives.",
  },
  "summit-energy": {
    revenue: "Revenue growth is moderating in line with a post-close business in steady-state, but remains above sector median. The contracted backlog provides 18 months of visibility, limiting downside from near-term project variability.",
    margin:  "EBITDA margin has expanded from 19.8% to 22.8%, consistently above sector peers, driven by a deliberate shift toward higher-margin recurring inspection contracts over lower-margin project work.",
    churn:   "Contract renewal rates are stable and churn is improving, tracking below sector median. The 3-year weighted-average remaining contract term provides confidence in the recurring revenue base.",
  },
}

const fallbackTrendData: Record<"quarterly" | "annual", TrendSeries> = {
  quarterly: {
    revenue: buildSeries(quarterPeriods, [10,10,10,10,10,10,10,10], [10,10,10,10,10,10,10,10]),
    margin:  buildSeries(quarterPeriods, [20,20,20,20,20,20,20,20], [20,20,20,20,20,20,20,20]),
    churn:   buildSeries(quarterPeriods, [8,8,8,8,8,8,8,8],         [8,8,8,8,8,8,8,8]),
  },
  annual: {
    revenue: buildSeries(annualPeriods, [10,10,10,10], [10,10,10,10]),
    margin:  buildSeries(annualPeriods, [20,20,20,20], [20,20,20,20]),
    churn:   buildSeries(annualPeriods, [8,8,8,8],     [8,8,8,8]),
  },
}

export function getTrendData(dealId: string): Record<"quarterly" | "annual", TrendSeries> {
  return trendDataByDeal[dealId] ?? fallbackTrendData
}

export function getTrendInsights(dealId: string): Record<TrendMetric, string> {
  return trendInsightsByDeal[dealId] ?? {
    revenue: "Trend data will populate once CIM analysis is complete.",
    margin:  "Trend data will populate once CIM analysis is complete.",
    churn:   "Trend data will populate once CIM analysis is complete.",
  }
}

// Legacy single-object exports kept for backward compatibility
export const trendData = trendDataByDeal["meridian-logistics"]
export const trendInsights = trendInsightsByDeal["meridian-logistics"]

// ── Financial workbook ──────────────────────────────────────────────
export type FinancialRow = {
  id: string
  label: string
  // computed rows are derived, not directly editable
  computed?: boolean
  indent?: boolean
  // sub-rows for collapsible groups (e.g. Revenue → Product A/B/C)
  children?: FinancialRow[]
  // values keyed by period id
  values: Record<string, number>
}

export type FinancialStatement = {
  rows: FinancialRow[]
}

// Annual historical periods for the income statement seed.
export const workbookAnnualPeriods = ["2023", "2024", "2025"]
export const workbookQuarterlyPeriods = ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"]

// Seed Income Statement for Meridian Logistics ($000s).
export function seedIncomeStatement(): FinancialRow[] {
  return [
    {
      id: "revenue",
      label: "Revenue",
      values: { "2023": 32400, "2024": 38100, "2025": 42700 },
      children: [
        { id: "rev-brokerage", label: "Freight Brokerage", indent: true, values: { "2023": 19800, "2024": 22600, "2025": 24900 } },
        { id: "rev-managed", label: "Managed Transportation", indent: true, values: { "2023": 9800, "2024": 12100, "2025": 14300 } },
        { id: "rev-other", label: "Other Services", indent: true, values: { "2023": 2800, "2024": 3400, "2025": 3500 } },
      ],
    },
    { id: "cogs", label: "Cost of Goods Sold", values: { "2023": 24300, "2024": 28900, "2025": 32850 } },
    { id: "gross-profit", label: "Gross Profit", computed: true, values: {} },
    { id: "opex", label: "Operating Expenses", values: { "2023": 4900, "2024": 5600, "2025": 6480 } },
    { id: "ebitda", label: "EBITDA", computed: true, values: {} },
    { id: "da", label: "Depreciation & Amortization", values: { "2023": 820, "2024": 910, "2025": 1010 } },
    { id: "ebit", label: "EBIT", computed: true, values: {} },
    { id: "interest", label: "Interest Expense", values: { "2023": 410, "2024": 520, "2025": 640 } },
    { id: "taxes", label: "Taxes", values: { "2023": 460, "2024": 540, "2025": 590 } },
    { id: "net-income", label: "Net Income", computed: true, values: {} },
  ]
}

// Compute derived rows for a given period set. Returns a flat list with
// computed values filled in. Pure function used by the grid.
export function computeIncomeStatement(
  rows: FinancialRow[],
  periods: string[],
): FinancialRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const val = (id: string, p: string) => byId.get(id)?.values[p] ?? 0

  return rows.map((row) => {
    if (!row.computed) return row
    const values: Record<string, number> = {}
    for (const p of periods) {
      switch (row.id) {
        case "gross-profit":
          values[p] = val("revenue", p) - val("cogs", p)
          break
        case "ebitda":
          values[p] = val("revenue", p) - val("cogs", p) - val("opex", p)
          break
        case "ebit":
          values[p] = val("revenue", p) - val("cogs", p) - val("opex", p) - val("da", p)
          break
        case "net-income":
          values[p] =
            val("revenue", p) - val("cogs", p) - val("opex", p) -
            val("da", p) - val("interest", p) - val("taxes", p)
          break
        default:
          values[p] = 0
      }
    }
    return { ...row, values }
  })
}

export const forecastGrowthRates: Record<string, number> = {
  Conservative: 0.05,
  Base: 0.1,
  Aggressive: 0.18,
}
