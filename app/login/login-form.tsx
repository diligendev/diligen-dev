"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { safeRedirectPath } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const next = safeRedirectPath(searchParams.get("next"))
    router.replace(next)
    router.refresh()
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Sign in
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sign in to your firm&apos;s Diligen workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Work email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@firm.com"
            className="rounded-sm border-border bg-card focus-visible:ring-accent"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password
            </Label>
            <span className="text-xs text-muted-foreground">
              Contact admin
            </span>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="rounded-sm border-border bg-card focus-visible:ring-accent"
          />
        </div>

        {error && (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full rounded-sm font-semibold text-white hover:opacity-90"
          style={{ background: "#1ABEBD", border: "none" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  )
}
