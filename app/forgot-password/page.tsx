import Link from "next/link"

import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form"
import { DiligenMark } from "@/components/meridian-mark"

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2" aria-label="Diligen home">
          <DiligenMark size={24} />
          <span className="text-base font-bold tracking-wide text-foreground">
            Diligen
          </span>
        </Link>

        <ForgotPasswordForm />
      </div>
    </main>
  )
}
