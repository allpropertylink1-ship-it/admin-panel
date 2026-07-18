"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Eye, EyeOff, CheckCircle } from "@/components/ui/icons"
import { api } from "@/lib/api-client"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const { error: apiError } = await api.post("/api/auth/admin-reset-password", { token, password })
    if (apiError) {
      setError(apiError)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-primary-200">Invalid reset link. No token provided.</p>
        <a href="/login" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hover">Back to sign in</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle size={28} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-white">Password reset</h2>
        <p className="mt-2 text-sm text-primary-200">Your admin password has been updated.</p>
        <a
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Sign in
        </a>
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-2 text-lg font-semibold text-white">Set new password</h2>
      <p className="mb-6 text-sm text-primary-200">Enter your new admin password below.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-primary-100">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoFocus
              className="w-full rounded-lg border border-primary-600 bg-primary-700/50 px-4 py-3 pr-10 text-sm text-white placeholder:text-primary-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-200 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-primary-100">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
            minLength={8}
            className="w-full rounded-lg border border-primary-600 bg-primary-700/50 px-4 py-3 text-sm text-white placeholder:text-primary-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="touch-target w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div className="text-center text-sm text-primary-200 py-4">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
