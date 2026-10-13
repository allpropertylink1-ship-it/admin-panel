"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  RefreshCw, AlertCircle, Shield, ShieldAlert, Lock, Users, Activity, Clock,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"

interface LockedAccount {
  id: string
  firstName: string
  lastName: string
  email: string | null
  lockedUntil: string | null
  failedLoginAttempts: number
  lastFailedLogin: string | null
}

interface FailedLoginEntry {
  id: string
  firstName: string
  lastName: string
  email: string | null
  failedLoginAttempts: number
  lastFailedLogin: string | null
}

interface OtpAbuseEntry {
  identifier: string
  tokenCount: number
  totalAttempts: number
  maxAttempts: number
  lastSeen: string
}

interface NameEmailSample {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

interface SessionRecent {
  id: string
  userId: string
  expires: string
  lastUsed: string
  ipAddress: string | null
  userAgent: string | null
  user: { firstName: string; lastName: string; email: string | null } | null
}

interface AdminSample {
  id: string
  email: string
  fullName: string
  role: string
}

interface SecurityOverview {
  lockedAccounts: LockedAccount[]
  failedLoginSurge: FailedLoginEntry[]
  otpAbuse: OtpAbuseEntry[]
  mustChangePassword: { count: number; sample: NameEmailSample[] }
  sessions: { activeCount: number; recent: SessionRecent[] }
  adminsWithout2FA: { count: number; sample: AdminSample[] }
}

const lockedColumns = [{ width: "w-28" }, { width: "w-32" }, { width: "w-16" }, { width: "w-28" }]
const LOCKED_PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function SectionCard({ title, subtitle, icon, children }: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <span className="text-muted">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default function SecurityPage() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lockedPage, setLockedPage] = useState(1)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<SecurityOverview>("/api/admin/security/overview")
      if (error) throw new Error(error)
      if (!data) throw new Error("Empty response from security overview")
      setOverview(data)
      setLockedPage(1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load security overview")
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void (async () => { await fetchOverview() })() }, [fetchOverview])

  const locked = overview?.lockedAccounts ?? []
  const lockedTotalPages = Math.max(1, Math.ceil(locked.length / LOCKED_PAGE_SIZE))
  const lockedPageSafe = Math.min(lockedPage, lockedTotalPages)
  const lockedSlice = locked.slice((lockedPageSafe - 1) * LOCKED_PAGE_SIZE, lockedPageSafe * LOCKED_PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Security</h1>
          <p className="mt-1 text-sm text-muted">Read-only compliance view of locks, login abuse, OTP abuse, and sessions.</p>
        </div>
        <button
          onClick={() => { void fetchOverview() }}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-border px-4 py-3 text-sm text-red-700 border-b-red-100 bg-error-50">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Account</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Attempts</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Locked Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableSkeleton columns={lockedColumns} checkbox={false} />
              </tbody>
            </table>
          </div>
        </div>
      ) : !overview ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center text-muted">
          <Shield size={48} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground/60">No security data available</p>
          <p className="mt-1 text-xs text-muted">Refresh to try again</p>
        </div>
      ) : (
        <>
          <SectionCard
            title="Locked accounts"
            subtitle={`${locked.length} currently locked`}
            icon={<Lock size={16} />}
          >
            {locked.length === 0 ? (
              <p className="text-sm text-muted">No accounts are currently locked.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-gray-50/80">
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Account</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Attempts</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Locked Until</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lockedSlice.map((account) => (
                        <tr key={account.id} className="transition-colors hover:bg-gray-50/40">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                            {account.firstName} {account.lastName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted">{account.email ?? "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-foreground">
                            {account.failedLoginAttempts}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                            {formatDate(account.lockedUntil)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={lockedPageSafe}
                  totalPages={lockedTotalPages}
                  total={locked.length}
                  pageSize={LOCKED_PAGE_SIZE}
                  onPageChange={setLockedPage}
                />
              </>
            )}
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Failed-login surge"
              subtitle="Users with 3+ failed attempts"
              icon={<ShieldAlert size={16} />}
            >
              {(overview.failedLoginSurge ?? []).length === 0 ? (
                <p className="text-sm text-muted">No surge detected.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(overview.failedLoginSurge ?? []).map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.firstName} {entry.lastName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {entry.email ?? "No email"} · last failure {formatDate(entry.lastFailedLogin)}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        "bg-orange-50 text-orange-700"
                      )}>
                        {entry.failedLoginAttempts} attempts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="OTP abuse"
              subtitle="Identifiers with 3+ attempts in the last 24h"
              icon={<Clock size={16} />}
            >
              {(overview.otpAbuse ?? []).length === 0 ? (
                <p className="text-sm text-muted">No OTP abuse detected in the last 24 hours.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(overview.otpAbuse ?? []).map((entry) => (
                    <li key={entry.identifier} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-foreground">{entry.identifier}</p>
                        <p className="mt-0.5 text-xs text-muted tabular-nums">
                          {entry.tokenCount} codes · {entry.totalAttempts} total attempts · last {formatDate(entry.lastSeen)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        max {entry.maxAttempts}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Must change password"
              subtitle={`${overview.mustChangePassword.count} users flagged`}
              icon={<Users size={16} />}
            >
              <p className="text-3xl font-bold text-foreground tabular-nums">{overview.mustChangePassword.count}</p>
              {(overview.mustChangePassword.sample ?? []).length > 0 && (
                <ul className="mt-3 divide-y divide-border">
                  {overview.mustChangePassword.sample.map((user) => (
                    <li key={user.id} className="py-2 text-sm">
                      <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="truncate text-xs text-muted">{user.email ?? "No email"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Active sessions"
              subtitle={`${overview.sessions.activeCount} unexpired sessions`}
              icon={<Activity size={16} />}
            >
              <p className="text-3xl font-bold text-foreground tabular-nums">{overview.sessions.activeCount}</p>
              {(overview.sessions.recent ?? []).length > 0 && (
                <ul className="mt-3 divide-y divide-border">
                  {overview.sessions.recent.map((session) => (
                    <li key={session.id} className="py-2 text-sm">
                      <p className="font-medium text-foreground">
                        {session.user ? `${session.user.firstName} ${session.user.lastName}` : "Unknown user"}
                      </p>
                      <p className="truncate text-xs text-muted tabular-nums">
                        last used {formatDate(session.lastUsed)} · {session.ipAddress ?? "no IP"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 rounded-xl border border-border bg-gray-50/60 px-3 py-2.5 text-xs text-muted">
                Admins without 2FA: <span className="font-semibold text-foreground tabular-nums">{overview.adminsWithout2FA.count}</span>
                {" "}(Admin records carry no 2FA field, so every admin counts as without 2FA.)
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
