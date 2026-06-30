import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canManageNotes } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"

function noteBody(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

async function dealExists(dealId: string, organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("organization_id", organizationId)
    .maybeSingle<{ id: string }>()

  if (error) throw new Error(error.message)
  return !!data
}

export async function POST(
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

  const { id } = await params
  if (!(await dealExists(id, context.organization.id))) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deal_notes")
    .insert({
      organization_id: context.organization.id,
      deal_id: id,
      author_id: context.user.id,
      body: text,
    })
    .select("id,author_id,body,created_at,updated_at")
    .single<{
      id: string
      author_id: string
      body: string
      created_at: string
      updated_at: string
    }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    note: {
      id: data.id,
      authorId: data.author_id,
      author: context.profile.fullName,
      text: data.body,
      timestamp: data.created_at,
      updatedAt: data.updated_at,
      canEdit: true,
    },
  })
}
