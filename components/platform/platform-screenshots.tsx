const screenshots = [
  {
    title: "Seamless data ingestion",
    body: "Diligen ingests any file type from your data room — spreadsheets, PDFs, exports — and transforms them into structured, queryable data without manual intervention.",
    panel: IngestionMock,
  },
  {
    title: "Comprehensive & reliable analysis",
    body: "Diligen follows the same due diligence workflows as PE investors: revenue drivers, cost structure, operational efficiency, customer cohorts — delivered with full source attribution.",
    panel: AnalysisMock,
  },
]

export function PlatformScreenshots() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            See the platform
            <br />
            in detail.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Two core workflows, built for the way private equity teams actually work.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-20">
          {screenshots.map((s, i) => {
            const Panel = s.panel
            return (
              <div
                key={s.title}
                className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
              >
                <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                  <h3 className="text-2xl font-light tracking-tight text-foreground">{s.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
                <div className={i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                  <Panel />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function IngestionMock() {
  const steps = [
    { label: "Upload files or connect VDR",     done: true  },
    { label: "Diligen parses all file formats", done: true  },
    { label: "Data normalized to schema",        done: true  },
    { label: "Tables available for analysis",    done: true  },
    { label: "Excel export ready",               done: false },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg shadow-black/20">
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">Data Ingestion — Project Austen</span>
      </div>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Processing pipeline</span>
          <span className="font-mono text-xs text-primary">4 / 5 complete</span>
        </div>
        <div className="flex flex-col gap-3">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  s.done
                    ? "bg-primary/20 text-primary"
                    : "border border-border text-muted-foreground/40"
                }`}
              >
                {s.done ? "✓" : "○"}
              </span>
              <span className={`text-sm ${s.done ? "text-foreground/80" : "text-muted-foreground/50"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Overall progress</span>
            <span className="font-mono text-xs text-primary">80%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-4/5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalysisMock() {
  const rows = [
    { segment: "Enterprise",  arr: "$34.8M", churn: "4.2%", nrr: "128%", flag: false },
    { segment: "Mid-Market",  arr: "$28.1M", churn: "8.7%", nrr: "112%", flag: false },
    { segment: "SMB",         arr: "$14.2M", churn: "21.4%",nrr: "89%",  flag: true  },
    { segment: "Government",  arr: "$7.1M",  churn: "2.1%", nrr: "107%", flag: false },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg shadow-black/20">
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">Segment Analysis — Revenue by Customer Type</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40">
            {["Segment", "ARR", "Gross Churn", "NRR"].map((h) => (
              <th key={h} className="px-5 py-3 text-right first:text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.segment} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
              <td className="px-5 py-3 text-sm text-foreground/80">
                <span className="flex items-center gap-2">
                  {r.flag && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                  {r.segment}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-foreground/80">{r.arr}</td>
              <td className={`px-5 py-3 text-right font-mono text-sm tabular-nums ${r.flag ? "text-destructive" : "text-foreground/80"}`}>{r.churn}</td>
              <td className={`px-5 py-3 text-right font-mono text-sm tabular-nums ${parseFloat(r.nrr) >= 100 ? "text-primary" : "text-destructive"}`}>{r.nrr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
