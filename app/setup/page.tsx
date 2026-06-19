import { redirect } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"

export default async function SetupPage() {
  const context = await getCurrentUserContext()

  if (!context) {
    redirect("/login")
  }

  if (hasWorkspace(context)) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded border border-border bg-card p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <p className="atlas-label">Workspace required</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          You are signed in, but not assigned to a workspace.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ask a workspace owner or admin to invite you. Once your membership is
          created, you can access the Diligen app.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          className="mt-6 rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Back to sign in
        </Button>
      </div>
    </main>
  )
}
