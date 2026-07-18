"use client"

import { useState } from "react"
import { api } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AlertCircle, CheckCircle, Loader2, UserPlus } from "@/components/ui/icons"

const PERMISSION_SECTIONS = [
  { key: "dashboard", label: "Dashboard", readOnly: true },
  { key: "users", label: "Users", readOnly: false },
  { key: "properties", label: "Properties", readOnly: false },
  { key: "services", label: "Services", readOnly: false },
  { key: "agents", label: "Agents", readOnly: false },
  { key: "commissions", label: "Commissions", readOnly: false },
  { key: "payouts", label: "Payouts", readOnly: false },
  { key: "claims", label: "Claims", readOnly: false },
  { key: "disputes", label: "Disputes", readOnly: false },
  { key: "kyc", label: "KYC", readOnly: false },
  { key: "approvals", label: "Approvals", readOnly: false },
  { key: "reports", label: "Reports", readOnly: true },
  { key: "audit", label: "Audit", readOnly: true },
  { key: "settings", label: "Settings", readOnly: false },
]

export default function InviteAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [permissions, setPermissions] = useState<Record<string, { read: boolean; write: boolean }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ tempPassword: string; email: string } | null>(null)

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "SUPER_ADMIN") return null

  function toggleRead(key: string) {
    setPermissions((prev) => {
      const current = prev[key] || { read: false, write: false }
      const newRead = !current.read
      return {
        ...prev,
        [key]: { read: newRead, write: newRead ? current.write : false },
      }
    })
  }

  function toggleWrite(key: string) {
    setPermissions((prev) => {
      const current = prev[key] || { read: false, write: false }
      return {
        ...prev,
        [key]: { read: current.read, write: !current.write },
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResult(null)
    if (!email || !fullName) {
      setError("Email and Full Name are required")
      return
    }
    setLoading(true)
    try {
      const { data, error } = await api.post<{ tempPassword: string; email: string }>("/api/admin/invite", {
        email,
        fullName,
        permissions,
      })
      if (error || !data) throw new Error(error || "Failed to invite admin")
      setResult({ tempPassword: data.tempPassword, email: data.email })
      setEmail("")
      setFullName("")
      setPermissions({})
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite admin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Invite Admin</h1>
        <p className="mt-1 text-sm text-muted">Create a new admin account with specific permissions</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Dismiss</button>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <CheckCircle size={20} className="shrink-0 text-emerald-600" />
            <h3 className="font-semibold">Admin invited successfully</h3>
          </div>
          <div className="mt-3 space-y-2 text-sm text-emerald-700">
            <p>An invitation email has been sent to <strong>{result.email}</strong>.</p>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Temporary Password</p>
              <p className="font-mono text-base font-bold text-emerald-800 select-all">{result.tempPassword}</p>
              <p className="mt-1 text-xs text-emerald-500">Share this password securely with the new admin. They will be prompted to change it on first login.</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="admin@allpropertylink.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-3">Permissions</label>
              <div className="space-y-2">
                {PERMISSION_SECTIONS.map((section) => {
                  const perm = permissions[section.key] || { read: false, write: false }
                  return (
                    <div key={section.key} className="flex items-center justify-between rounded-lg border border-border bg-gray-50/50 px-4 py-2.5">
                      <span className="text-sm font-medium text-foreground">{section.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                          <input type="checkbox" checked={perm.read} onChange={() => toggleRead(section.key)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
                          Read
                        </label>
                        {!section.readOnly && (
                          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                            <input type="checkbox" checked={perm.write} disabled={!perm.read} onChange={() => toggleWrite(section.key)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 disabled:opacity-40" />
                            Write
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => router.push("/admin-accounts")}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 inline-flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}