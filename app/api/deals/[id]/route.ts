import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canUpdateDeal } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"

const STAGES = ["New", "Analyzing", "Reviewed", "Pursuing", "Passed", "Closed"]
const STATUSES = ["Processing", "Complete", "Error"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  if (!canUpdateDeal(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const updates: {
    stage?: string
    status?: string
    updated_at: string
  } = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body?.stage === "string" && STAGES.includes(body.stage)) {
    updates.stage = body.stage
  }

  if (typeof body?.status === "string" && STATUSES.includes(body.status)) {
    updates.status = body.status
  }

  if (!updates.stage && !updates.status) {
    return NextResponse.json({ error: "No valid updates." }, { status: 400 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from("deals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", context.organization.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
