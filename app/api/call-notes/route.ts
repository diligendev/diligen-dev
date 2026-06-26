import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const dealId = normalizeString(payload?.dealId)
  const title = normalizeString(payload?.title)
  const callDate = normalizeString(payload?.callDate)
  const participants = normalizeString(payload?.participants)
  const body = normalizeString(payload?.body)

  if (!dealId) {
    return NextResponse.json({ error: "Deal is required." }, { status: 400 })
  }

  if (!title || title.length > 200) {
    return NextResponse.json(
      { error: "Title must be between 1 and 200 characters." },
      { status: 400 },
    )
  }

  if (!body || body.length > 50000) {
    return NextResponse.json(
      { error: "Notes must be between 1 and 50,000 characters." },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ id: string }>()

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 400 })
  }

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  const { data: note, error } = await supabase
    .from("deal_call_notes")
    .insert({
      organization_id: context.organization.id,
      deal_id: dealId,
      title,
      call_date: callDate || null,
      participants,
      body,
      created_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: note.id })
}
