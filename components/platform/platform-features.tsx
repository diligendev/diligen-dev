"use client"

import { useState } from "react"
import {
  DatabaseZap,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Link2,
  MessageSquare,
} from "lucide-react"

const features = [
  {
    id: "ingest",
    icon: DatabaseZap,
    label: "Find & Compile Data",
    description:
      "Scan every file in the data room and make your data instantly usable in structured tables — regardless of format, size, or complexity.",
    panel: IngestPanel,
  },
  {
    id: "risks",
    icon: AlertTriangle,
    label: "Catch Hidden Risks",
    description:
      "Identify and flag key facts that impact your deal, customized to your firm's investor profile and deal criteria.",
    panel: RisksPanel,
  },
  {
    id: "analysis",
    icon: BarChart3,
    label: "Perform Analysis",
    description:
      "Spin up deep dives — cohort analysis, segment pivots, customer concentration, margin bridge — with a single click.",
    panel: AnalysisPanel,
  },
  {
    id: "export",
    icon: FileSpreadsheet,
    label: "Export Excel Models",
    description:
      "Download a spreadsheet with dynamic formulas already in place — no hardcoded cells, fully linked to source data.",
    panel: ExportPanel,
  },
  {
    id: "sources",
    icon: Link2,
    label: "Source Every Fact",
    description:
      "Every data point traces back to a specific document and page. Every calculation shows the math. Full audit trail, always.",
    panel: SourcesPanel,
  },
  {
    id: "chat",
    icon: MessageSquare,
    label: "Understand Your Needs",
    description:
      "Talk to Diligen like a senior analyst. Instantly refine tables, run what-ifs, and iterate on outputs in natural language.",
    panel: ChatPanel,
  },
]

export function PlatformFeatures() {
  const [active, setActive] = useState(features[0].id)
  const current = features.find((f) => f.id === active)!
  const Panel = current.panel

  return (
    <section className="relative border-b overflow-hidden" style={{ borderColor: "rgba(26,190,189,0.10)", background: "#06101C" }}>
      {/* grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid min-h-[560px] grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]" style={{ borderLeft: "1px solid rgba(26,190,189,0.10)", borderRight: "1px solid rgba(26,190,189,0.10)" }}>
          {/* left: feature nav */}
          <div className="flex flex-col py-8" style={{ borderRight: "1px solid rgba(26,190,189,0.10)" }}>
            <p
              className="mb-4 px-8 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(26,190,189,0.50)" }}
            >
              Platform capabilities
            </p>
            <nav>
              {features.map((f) => {
                const isActive = f.id === active
                return (
                  <button
                    key={f.id}
                    onClick={() => setActive(f.id)}
                    className="flex w-full items-center gap-3.5 px-8 py-4 text-left transition-colors"
                    style={{
                      borderLeft: isActive ? "2px solid #1ABEBD" : "2px solid transparent",
                      background: isActive ? "rgba(26,190,189,0.05)" : "transparent",
                      color: isActive ? "#EBF2FF" : "rgba(235,242,255,0.38)",
                    }}
                  >
                    <f.icon
                      className="h-[17px] w-[17px] shrink-0"
                      strokeWidth={1.5}
                      style={{ color: isActive ? "#1ABEBD" : "rgba(235,242,255,0.25)" }}
                    />
                    <span className="text-[13px] font-medium">{f.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* right: product panel */}
          <div className="flex flex-col">
            {/* description bar */}
            <div className="px-8 py-6" style={{ borderBottom: "1px solid rgba(26,190,189,0.10)" }}>
              <p className="max-w-lg text-[13px] leading-relaxed" style={{ color: "rgba(235,242,255,0.48)" }}>
                {current.description}
              </p>
            </div>

            {/* mock UI */}
            <div className="flex-1 p-6" style={{ background: "rgba(26,190,189,0.02)" }}>
              <Panel />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Individual panel mocks ─────────────────────────────────────────────── */

function IngestPanel() {
  const files = [
    { name: "Revenue_Schedule_FY23.xlsx", status: "Processed", rows: "4,812" },
    { name: "Customer_List_Export.csv", status: "Processed", rows: "1,203" },
    { name: "Management_Accounts_Q4.pdf", status: "Processed", rows: "—" },
    { name: "CIM_Project_Austen.pdf", status: "Processed", rows: "—" },
    { name: "Payroll_Summary_2023.xlsx", status: "Processing…", rows: "—" },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Data Room — Project Austen</span>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] text-accent">
          14 files ingested
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40">
            <th className="px-5 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              File
            </th>
            <th className="px-5 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Rows extracted
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.name} className="border-b border-border/30 last:border-0">
              <td className="px-5 py-3 text-sm text-foreground/80">{f.name}</td>
              <td className="px-5 py-3">
                <span
                  className={`text-xs font-medium ${f.status === "Processing…" ? "text-yellow-500" : "text-accent"}`}
                >
                  {f.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-foreground/70">
                {f.rows}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RisksPanel() {
  const risks = [
    { severity: "high",   label: "Revenue concentration", detail: "Top 5 customers = 51% of ARR. Up from 45% prior year." },
    { severity: "high",   label: "Margin compression",    detail: "EBITDA margin –180bps YoY. Cost structure not scaling." },
    { severity: "medium", label: "Churn inflection",      detail: "Net logo retention declined 4pp in H2 2023." },
    { severity: "low",    label: "Contract terms",        detail: "28% of ARR on month-to-month. No auto-renewal clauses." },
  ]
  const color: Record<string, string> = {
    high:   "text-destructive",
    medium: "text-yellow-500",
    low:    "text-muted-foreground",
  }
  const dot: Record<string, string> = {
    high:   "bg-destructive",
    medium: "bg-yellow-500",
    low:    "bg-border",
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Risk Signals — Project Austen</span>
        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 font-mono text-[11px] text-destructive">
          2 high priority
        </span>
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {risks.map((r) => (
          <div key={r.label} className="flex items-start gap-4 px-5 py-4">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[r.severity]}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${color[r.severity]}`}>{r.label}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
            </div>
            <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wider ${color[r.severity]}`}>
              {r.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisPanel() {
  const rows = [
    { metric: "Beginning Balance",  q1: "127",  q2: "125",  q3: "130",  q4: "143",  ltm: "143"  },
    { metric: "New Customers",      q1: "18",   q2: "22",   q3: "35",   q4: "30",   ltm: "105"  },
    { metric: "Lost Customers",     q1: "(20)", q2: "(17)", q3: "(22)", q4: "(19)", ltm: "(78)" },
    { metric: "Churn Rate",         q1: "15.7%",q2: "13.6%",q3: "16.9%",q4: "13.3%",ltm: "14.8%"},
    { metric: "Ending Balance",     q1: "125",  q2: "130",  q3: "143",  q4: "154",  ltm: "154"  },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Customer Retention Analysis</span>
        <div className="flex items-center gap-2">
          {["Actuals", "Dollar Retention", "Raw Table"].map((t, i) => (
            <span
              key={t}
              className={`rounded px-2.5 py-0.5 font-mono text-[10px] ${
                i === 0
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40">
            {["Metric", "Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "LTM"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-right first:text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric} className="border-b border-border/30 last:border-0">
              <td className="px-4 py-2.5 text-sm text-foreground/80">{r.metric}</td>
              {[r.q1, r.q2, r.q3, r.q4, r.ltm].map((v, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 text-right font-mono text-sm tabular-nums ${
                    v.startsWith("(") ? "text-destructive" : "text-foreground/80"
                  }`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExportPanel() {
  const outputs = [
    { name: "Quality of Earnings — Project Austen", cells: "812 linked cells", ready: true },
    { name: "Customer Cohort Analysis",             cells: "204 linked cells", ready: true },
    { name: "Revenue Bridge FY21–FY23",             cells: "96 linked cells",  ready: true },
    { name: "Management Case vs. Recast",           cells: "Generating…",      ready: false },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Export Center</span>
        <span className="font-mono text-[11px] text-muted-foreground">All formulas live-linked</span>
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {outputs.map((o) => (
          <div key={o.name} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">{o.name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{o.cells}</p>
            </div>
            <button
              className={`rounded-[4px] px-4 py-1.5 text-xs font-normal transition-opacity ${
                o.ready
                  ? "bg-foreground/90 text-background hover:opacity-85"
                  : "cursor-default bg-secondary text-muted-foreground"
              }`}
              disabled={!o.ready}
            >
              {o.ready ? "Download export" : "Building..."}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourcesPanel() {
  const facts = [
    {
      claim: "LTM Revenue of $84.2M",
      source: "Revenue_Schedule_FY23.xlsx",
      page: "Sheet: LTM Summary, Row 42",
    },
    {
      claim: "EBITDA Margin of 28.7%",
      source: "Management_Accounts_Q4.pdf",
      page: "Page 14, Exhibit 3",
    },
    {
      claim: "NRR of 118.3%",
      source: "Customer_List_Export.csv",
      page: "Computed: Retention / Beginning ARR",
    },
    {
      claim: "Top 5 customers = 51.4% of ARR",
      source: "Customer_List_Export.csv",
      page: "Computed: SUM(top5_arr) / total_arr",
    },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Audit Trail</span>
        <span className="font-mono text-[11px] text-muted-foreground">Every fact is sourced</span>
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {facts.map((f) => (
          <div key={f.claim} className="px-5 py-3.5">
            <p className="text-sm font-medium text-foreground">{f.claim}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {f.source}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60">{f.page}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatPanel() {
  const messages = [
    { role: "user",   text: "Break down ARR growth by customer segment for the last 3 years." },
    { role: "system", text: "Analyzing revenue schedule against customer segment taxonomy… Found 6 distinct segments across 1,203 customer records." },
    { role: "user",   text: "Flag any segment where growth decelerated in H2 2023." },
    { role: "system", text: "SMB segment shows deceleration: +34% in H1 vs. +11% in H2. Enterprise remained stable at +28%." },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="border-b border-border px-5 py-3">
        <span className="text-xs font-medium text-foreground">Diligen Analyst Chat</span>
      </div>
      <div className="flex flex-col gap-3 px-5 py-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex max-w-[85%] flex-col rounded-md px-4 py-3 ${
              m.role === "user"
                ? "ml-auto bg-primary/15 text-right"
                : "mr-auto bg-secondary"
            }`}
          >
            <p className="text-sm leading-relaxed text-foreground/85">{m.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <span className="flex-1 text-xs text-muted-foreground/50">Ask Diligen anything about this deal…</span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">⏎</span>
        </div>
      </div>
    </div>
  )
}
