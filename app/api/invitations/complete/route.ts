import { NextResponse } from "next/server"

import { finalizeCurrentUserInvitation } from "@/lib/auth/invitations"

export async function POST() {
  const completedInvite = await finalizeCurrentUserInvitation()

  if (!completedInvite) {
    return NextResponse.json(
      { error: "No invitation found for this signed-in user." },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
