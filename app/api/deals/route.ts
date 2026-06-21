import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { slugifyDealName } from "@/lib/data/deals"
import { createClient } from "@/lib/supabase/server"

const STAGES = ["New", "Analyzing", "Reviewed", "Pursuing", "Passed", "Closed"]
const STATUSES = ["Processing", "Complete", "Error"]

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function uniqueSlug(base: string) {
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const name = text(body?.name)
  const sector = text(body?.sector)
  const source = text(body?.source)
  const stage = STAGES.includes(body?.stage) ? body.stage : "New"
  const status = STATUSES.includes(body?.status) ? body.status : "Complete"
  const hasCim = Boolean(body?.hasCim)
  const document =
    body?.document && typeof body.document === "object" ? body.document : null

  if (!name) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deals")
    .insert({
      organization_id: context.organization.id,
      name,
      slug: uniqueSlug(slugifyDealName(name)),
      sector: sector || null,
      source: source || null,
      stage,
      status,
      has_cim: hasCim,
      created_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (document && typeof document.name === "string") {
    const { error: documentError } = await supabase
      .from("deal_documents")
      .insert({
        organization_id: context.organization.id,
        deal_id: data.id,
        name: document.name.trim(),
        document_type:
          typeof document.documentType === "string"
            ? document.documentType
            : "CIM",
        file_size: typeof document.fileSize === "string" ? document.fileSize : null,
        extraction_status: "pending",
        uploaded_by: context.user.id,
      })

    if (documentError) {
      return NextResponse.json(
        { error: documentError.message },
        { status: 400 },
      )
    }
  }

  return NextResponse.json({ id: data.id })
}
