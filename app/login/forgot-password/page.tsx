"use client"

import { useState } from "react"
import { Shield, ArrowLeft, Mail, CheckCircle } from "@/components/ui/icons"
import { api } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error: apiError } = await api.post("/api/auth/admin-forgot-password", { email })
    if (apiError) {
      setError(apiError)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
            <Shield size={32} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-primary-200">All Property Link</p>
        </div>

        <div className="rounded-2xl border border-primary-700/50 bg-primary-800/50 p-8 backdrop-blur-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle size={28} className="text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-primary-200">
                If an admin account exists with <strong className="text-white">{email}</strong>, we&apos;ve sent a password reset link.
              </p>
              <a
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
              >
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-white">Reset password</h2>
              <p className="mb-6 text-sm text-primary-200">Enter your admin email and we&apos;ll send you a reset link.</p>

              {error && (
                <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-primary-100">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-300" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      autoFocus
                      className="w-full rounded-lg border border-primary-600 bg-primary-700/50 pl-10 pr-4 py-3 text-sm text-white placeholder:text-primary-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="touch-target w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="/login" className="text-sm text-primary-200 hover:text-white inline-flex items-center gap-1.5">
                  <ArrowLeft size={14} /> Back to sign in
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
