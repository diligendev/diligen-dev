import Link from "next/link"
import { ArrowLeft, FileSpreadsheet } from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Deal } from "@/lib/mock-data"
import type { RevenueFile, RevenueRow } from "@/lib/data/revenue"
import { cn } from "@/lib/utils"

type CustomerSummary = {
  customer: string
  revenue: number
  grossProfit: number | null
  margin: number | null
  share: number
}

type PeriodSummary = {
  period: string
  revenue: number
  grossProfit: number | null
}

export function RevenueExplorationDetail({
  deal,
  file,
  rows,
}: {
  deal: Deal
  file: RevenueFile
  rows: RevenueRow[]
}) {
  const analysis = buildRevenueAnalysis(rows)

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Revenue Exploration" eyebrow={deal.company}>
        <Link
          href={`/deals/${deal.id}?tab=revenue-explorer`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-7 rounded border-border px-3 text-xs",
          )}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to deal
        </Link>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="atlas-label">Saved Revenue Import</p>
              <h1 className="mt-1 truncate text-[18px] font-semibold text-foreground">
                {file.fileName}
              </h1>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {file.rowCount.toLocaleString()} rows imported on{" "}
                {formatDate(file.createdAt)}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded border border-border bg-secondary/30 px-3 py-2 text-[12px] font-medium text-foreground">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              Analysis
            </span>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total Revenue" value={fmtCurrency(analysis.totalRevenue)} />
          <Metric label="Customers" value={analysis.customerCount.toLocaleString()} />
          <Metric label="Top Customer" value={fmtPercent(analysis.topCustomerShare)} />
          <Metric label="Top 10 Concentration" value={fmtPercent(analysis.top10Share)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <CustomerTable customers={analysis.customers} />
          <PeriodTable periods={analysis.periods} />
        </div>

        <MixSection
          title="Revenue By Product"
          emptyLabel="No product column was mapped for this import."
          rows={analysis.products}
        />
        <MixSection
          title="Revenue By Channel"
          emptyLabel="No channel column was mapped for this import."
          rows={analysis.channels}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card px-4 py-3">
      <p className="atlas-label">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}

function CustomerTable({ customers }: { customers: CustomerSummary[] }) {
  return (
    <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <p className="atlas-label">Customer Concentration</p>
      <h2 className="mt-1 text-[15px] font-semibold text-foreground">
        Top customers by revenue
      </h2>
      <div className="mt-3">
        <Table className="text-foreground">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Share</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.slice(0, 20).map((customer) => (
              <TableRow key={customer.customer}>
                <TableCell className="max-w-[220px] truncate font-medium text-foreground">
                  {customer.customer}
                </TableCell>
                <TableCell className="text-right font-mono text-foreground">
                  {fmtCurrency(customer.revenue)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {fmtPercent(customer.share)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {customer.margin == null ? "-" : fmtPercent(customer.margin)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function PeriodTable({ periods }: { periods: PeriodSummary[] }) {
  return (
    <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <p className="atlas-label">Revenue Trend</p>
      <h2 className="mt-1 text-[15px] font-semibold text-foreground">
        Revenue by period
      </h2>
      <div className="mt-3">
        <Table className="text-foreground">
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Gross Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.period}>
                <TableCell className="font-medium text-foreground">
                  {period.period}
                </TableCell>
                <TableCell className="text-right font-mono text-foreground">
                  {fmtCurrency(period.revenue)}
                </TableCell>
                <TableCell className="text-right font-mono text-foreground">
                  {period.grossProfit == null ? "-" : fmtCurrency(period.grossProfit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function MixSection({
  title,
  emptyLabel,
  rows,
}: {
  title: string
  emptyLabel: string
  rows: Array<{ label: string; revenue: number; share: number }>
}) {
  return (
    <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <p className="atlas-label">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-[12px] text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {rows.slice(0, 12).map((row) => (
            <div
              key={row.label}
              className="rounded border border-border bg-secondary/20 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {row.label}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {fmtPercent(row.share)}
                </p>
              </div>
              <p className="mt-1 font-mono text-[12px] text-foreground">
                {fmtCurrency(row.revenue)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function buildRevenueAnalysis(rows: RevenueRow[]) {
  const totalRevenue = rows.reduce((total, row) => total + row.revenue, 0)
  const byCustomer = new Map<
    string,
    { revenue: number; grossProfit: number; hasGrossProfit: boolean }
  >()
  const byPeriod = new Map<
    string,
    { revenue: number; grossProfit: number; hasGrossProfit: boolean }
  >()
  const byProduct = new Map<string, number>()
  const byChannel = new Map<string, number>()

  for (const row of rows) {
    const customer = byCustomer.get(row.customer) ?? {
      revenue: 0,
      grossProfit: 0,
      hasGrossProfit: false,
    }
    customer.revenue += row.revenue
    if (row.grossProfit != null) {
      customer.grossProfit += row.grossProfit
      customer.hasGrossProfit = true
    }
    byCustomer.set(row.customer, customer)

    const periodKey = row.date.slice(0, 7)
    const period = byPeriod.get(periodKey) ?? {
      revenue: 0,
      grossProfit: 0,
      hasGrossProfit: false,
    }
    period.revenue += row.revenue
    if (row.grossProfit != null) {
      period.grossProfit += row.grossProfit
      period.hasGrossProfit = true
    }
    byPeriod.set(periodKey, period)

    if (row.product) byProduct.set(row.product, (byProduct.get(row.product) ?? 0) + row.revenue)
    if (row.channel) byChannel.set(row.channel, (byChannel.get(row.channel) ?? 0) + row.revenue)
  }

  const customers = [...byCustomer.entries()]
    .map(([customer, value]): CustomerSummary => ({
      customer,
      revenue: value.revenue,
      grossProfit: value.hasGrossProfit ? value.grossProfit : null,
      margin:
        value.hasGrossProfit && value.revenue !== 0
          ? value.grossProfit / value.revenue
          : null,
      share: totalRevenue === 0 ? 0 : value.revenue / totalRevenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const periods = [...byPeriod.entries()]
    .map(([period, value]): PeriodSummary => ({
      period,
      revenue: value.revenue,
      grossProfit: value.hasGrossProfit ? value.grossProfit : null,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const mix = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([label, revenue]) => ({
        label,
        revenue,
        share: totalRevenue === 0 ? 0 : revenue / totalRevenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    customerCount: byCustomer.size,
    topCustomerShare: customers[0]?.share ?? 0,
    top10Share: customers.slice(0, 10).reduce((total, item) => total + item.share, 0),
    customers,
    periods,
    products: mix(byProduct),
    channels: mix(byChannel),
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fmtCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })
}

function fmtPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}
