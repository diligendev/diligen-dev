"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("Checking reset link...")

  useEffect(() => {
    async function prepareResetSession() {
      const supabase = createClient()
      const hash = window.location.hash

      if (hash.includes("access_token") && hash.includes("refresh_token")) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setError("Reset link is invalid or expired. Request a new link.")
            setMessage("")
            return
          }

          window.history.replaceState(null, "", window.location.pathname)
        }
      }

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setError("Reset link is invalid or expired. Request a new link.")
        setMessage("")
        return
      }

      setReady(true)
      setMessage("")
    }

    void prepareResetSession()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ready) return

    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Create a new password for your Diligen account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            New password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            disabled={!ready}
            className="rounded-sm border-border bg-card focus-visible:ring-accent"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-enter password"
            disabled={!ready}
            className="rounded-sm border-border bg-card focus-visible:ring-accent"
          />
        </div>

        {message && (
          <div className="rounded-sm border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!ready || loading}
          className="w-full rounded-sm font-semibold text-white hover:opacity-90"
          style={{ background: "#1ABEBD", border: "none" }}
        >
          {loading ? "Saving..." : "Save password"}
        </Button>
      </form>
    </>
  )
}
