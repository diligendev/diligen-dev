"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo,
      },
    )

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage("If an account exists for that email, a reset link has been sent.")
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Reset password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Enter your work email and we&apos;ll send a secure password reset link.
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

        {error && (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-sm border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
            {message}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full rounded-sm font-semibold text-white hover:opacity-90"
          style={{ background: "#1ABEBD", border: "none" }}
        >
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </>
  )
}
