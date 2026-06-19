const rows = [
  { metric: "LTM Revenue",                  value: "$57.3M",   delta: "+18.6%", up: true,  flag: false },
  { metric: "EBITDA Margin",                value: "21.4%",    delta: "-3.2pp", up: false, flag: true  },
  { metric: "Net Revenue Retention",        value: "112.7%",   delta: "+2.1pp", up: true,  flag: false },
  { metric: "Customer Conc. (Top 5)",       value: "44.1%",    delta: "+5.8pp", up: false, flag: true  },
  { metric: "Gross Margin",                 value: "61.8%",    delta: "-1.4pp", up: false, flag: true  },
  { metric: "ARR Growth (YoY)",             value: "23.9%",    delta: "+1.1pp", up: true,  flag: false },
]

export function TerminalPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl shadow-black/30" style={{ boxShadow: "0 0 0 1px rgba(90,126,255,0.08), 0 24px 64px rgba(0,0,0,0.4)" }}>
      {/* chrome bar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
          <span className="ml-3">meridian / project-corvus / quality-of-earnings</span>
        </div>
        <span className="hidden font-mono text-xs text-accent sm:inline">
          COMPLETE · 00:38
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_264px]">
        {/* main metrics table */}
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-sm font-semibold text-foreground">
              Key Metrics — Project Corvus
            </span>
            <span className="font-mono text-xs text-muted-foreground">vs. prior LTM</span>
          </div>
          <table className="w-full">
            <tbody>
              {rows.map((row) => (
                <tr key={row.metric} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm text-foreground/90">
                    <span className="flex items-center gap-2.5">
                      {row.flag && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" aria-label="flag" />
                      )}
                      {row.metric}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                    {row.value}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono text-sm tabular-nums ${
                      row.up ? "text-accent" : "text-destructive"
                    }`}
                  >
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* side panel */}
        <div className="flex flex-col bg-card">
          <div className="border-b border-border px-5 py-3">
            <span className="text-sm font-semibold text-foreground">Risk Signals</span>
          </div>
          <div className="flex flex-col gap-4 px-5 py-4">
            <RiskItem
              label="Margin erosion trend"
              detail="EBITDA margin down 320bps over 6 quarters — cost structure not scaling with revenue."
            />
            <RiskItem
              label="Customer concentration"
              detail="Top 5 accounts represent 44% of ARR, up from 38% one year ago."
            />
            <RiskItem
              label="Gross margin compression"
              detail="Vendor cost inflation passing through; negotiating leverage unclear."
            />
          </div>
          <div className="mt-auto border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Linked cells
              </span>
              <span className="font-mono text-xs font-medium text-accent">634</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Every figure traces to a source cell with a full Excel-ready audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RiskItem({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-l-2 border-destructive/50 pl-3">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}
