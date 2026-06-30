import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canManageNotes } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"

function noteBody(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const context = await getCurrentUserContext()
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }
  if (!canManageNotes(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const text = noteBody(body?.body)
  if (!text || text.length > 10000) {
    return NextResponse.json(
      { error: "Note must be between 1 and 10,000 characters." },
      { status: 400 },
    )
  }

  const { id, noteId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deal_notes")
    .update({ body: text })
    .eq("id", noteId)
    .eq("deal_id", id)
    .eq("organization_id", context.organization.id)
    .eq("author_id", context.user.id)
    .select("body,updated_at")
    .maybeSingle<{ body: string; updated_at: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!data) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 })
  }

  return NextResponse.json({
    note: { text: data.body, updatedAt: data.updated_at },
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const context = await getCurrentUserContext()
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }
  if (!canManageNotes(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id, noteId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deal_notes")
    .delete()
    .eq("id", noteId)
    .eq("deal_id", id)
    .eq("organization_id", context.organization.id)
    .eq("author_id", context.user.id)
    .select("id")
    .maybeSingle<{ id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!data) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
