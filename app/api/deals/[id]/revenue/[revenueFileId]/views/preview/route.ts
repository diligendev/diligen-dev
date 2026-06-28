import { NextResponse, type NextRequest } from "next/server"

import { getCurrentOrganizationRevenueFileDetail } from "@/lib/data/revenue"
import {
  BREAKDOWN_OPTIONS,
  MEASURE_OPTIONS,
  PERIOD_OPTIONS,
  buildRevenueViewAnalysis,
  type RevenueBreakdown,
  type RevenueMeasure,
  type RevenuePeriod,
} from "@/lib/revenue/analytics"

export const runtime = "nodejs"
export const maxDuration = 60

type PreviewBody = {
  name?: unknown
  period?: unknown
  measure?: unknown
  breakdowns?: unknown
}

const PERIOD_VALUES = new Set<RevenuePeriod>(PERIOD_OPTIONS)
const MEASURE_VALUES = new Set<RevenueMeasure>(
  MEASURE_OPTIONS.map((option) => option.key),
)
const BREAKDOWN_VALUES = new Set<RevenueBreakdown>(
  BREAKDOWN_OPTIONS.map((option) => option.key),
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revenueFileId: string }> },
) {
  try {
    const { id: dealId, revenueFileId } = await params
    const body = (await request.json().catch(() => null)) as PreviewBody | null

    const period = parsePeriod(body?.period)
    const measure = parseMeasure(body?.measure)
    const breakdowns = parseBreakdowns(body?.breakdowns)

    if (!period || !measure || breakdowns.length === 0) {
      return NextResponse.json(
        { error: "Choose a period, measure, and at least one breakdown." },
        { status: 400 },
      )
    }

    const detail = await getCurrentOrganizationRevenueFileDetail({
      dealId,
      revenueFileId,
    })

    if (!detail) {
      return NextResponse.json(
        { error: "Revenue analysis not found." },
        { status: 404 },
      )
    }

    const analysis = buildRevenueViewAnalysis({
      rows: detail.rows,
      period,
      measure,
      breakdowns,
    })
    const dateRange = getDateRange(detail.rows.map((row) => row.date))

    return NextResponse.json({
      ok: true,
      preview: {
        name:
          typeof body?.name === "string" && body.name.trim()
            ? body.name.trim().slice(0, 120)
            : null,
        period,
        measure,
        breakdowns,
        analysis,
        sourceRowCount: detail.rows.length,
        sourceDateRangeStart: dateRange.start,
        sourceDateRangeEnd: dateRange.end,
        resultGeneratedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate revenue view preview.",
      },
      { status: 500 },
    )
  }
}

function parsePeriod(value: unknown): RevenuePeriod | null {
  return typeof value === "string" && PERIOD_VALUES.has(value as RevenuePeriod)
    ? (value as RevenuePeriod)
    : null
}

function parseMeasure(value: unknown): RevenueMeasure | null {
  return typeof value === "string" && MEASURE_VALUES.has(value as RevenueMeasure)
    ? (value as RevenueMeasure)
    : null
}

function parseBreakdowns(value: unknown): RevenueBreakdown[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value)].filter(
    (item): item is RevenueBreakdown =>
      typeof item === "string" &&
      BREAKDOWN_VALUES.has(item as RevenueBreakdown),
  )
}

function getDateRange(dates: string[]) {
  const sorted = dates.filter(Boolean).sort()
  return {
    start: sorted[0] ?? null,
    end: sorted[sorted.length - 1] ?? null,
  }
}
