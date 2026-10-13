"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  AlertCircle, Bell, CheckCircle2, Clock, Mail, Phone,
  RefreshCw, Search, TrendingUp, XCircle,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"

interface ChannelStats {
  total: number
  failed: number
  last24h: number
  failed24h: number
  undelivered?: number
}

interface DeliveryOverview {
  sms: ChannelStats
  email: ChannelStats
  balance: { ok: boolean; balance?: number; code: string; message: string }
}

interface SmsEntry {
  id: string
  phone: string
  senderId: string
  purpose: string | null
  ok: boolean
  code: string
  providerMessage: string | null
  messageId: string | null
  deliveryStatus: string | null
  deliveredAt: string | null
  cost: string | null
  createdAt: string
}

interface EmailEntry {
  id: string
  to: string
  subject: string
  ok: boolean
  error: string | null
  createdAt: string
}

interface LogResponse<T> {
  logs: T[]
  total: number
  page: number
  totalPages: number
}

const logColumns = [
  { width: "w-28" }, { width: "w-24" }, { width: "w-16" }, { width: "w-32" }, { width: "w-24" },
]

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function StatCard({ label, value, sub, icon, tone }: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div className={cn("rounded-xl p-2.5", tone)}>{icon}</div>
      </div>
      <p className="mt-3 text-xl font-bold text-foreground tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-[11px] text-muted">{sub}</p>
    </div>
  )
}

export default function DeliveryPage() {
  const [overview, setOverview] = useState<DeliveryOverview | null>(null)
  const [sms, setSms] = useState<LogResponse<SmsEntry> | null>(null)
  const [email, setEmail] = useState<LogResponse<EmailEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"sms" | "email">("sms")
  const [failedOnly, setFailedOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<DeliveryOverview>("/api/admin/delivery/overview")
      if (error || !data) throw new Error(error || "No data")
      setOverview(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load delivery overview")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "15")
      if (failedOnly) params.set("failedOnly", "1")
      if (search) params.set("search", search)
      const path = tab === "sms" ? `/api/admin/delivery/sms?${params}` : `/api/admin/delivery/email?${params}`
      if (tab === "sms") {
        const { data } = await api.get<LogResponse<SmsEntry>>(path)
        if (data) setSms(data)
      } else {
        const { data } = await api.get<LogResponse<EmailEntry>>(path)
        if (data) setEmail(data)
      }
    } finally {
      setLogsLoading(false)
    }
  }, [tab, failedOnly, search, page])

  useEffect(() => { void (async () => { await fetchOverview() })() }, [fetchOverview])
  useEffect(() => { void (async () => { await fetchLogs() })() }, [fetchLogs])
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchValue); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchValue])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Delivery</h1>
          <p className="mt-1 text-sm text-muted">Email and SMS send receipts, failures, and balance</p>
        </div>
        <button
          onClick={() => { void fetchOverview(); void fetchLogs() }}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-card"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-error-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {loading || !overview ? (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
              <div className="h-10 w-10 rounded-xl bg-gray-200" />
              <div className="mt-4 h-7 w-16 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <StatCard
            label="SMS balance"
            value={overview.balance.ok && typeof overview.balance.balance === "number" ? overview.balance.balance.toLocaleString() : "—"}
            sub={overview.balance.ok ? "message parts remaining" : `Unavailable (${overview.balance.code})`}
            icon={<Phone size={20} className="text-sky-600" />}
            tone="bg-sky-50"
          />
          <StatCard
            label="SMS failed (24h)"
            value={overview.sms.failed24h.toLocaleString()}
            sub={`${overview.sms.last24h.toLocaleString()} sent · ${overview.sms.failed.toLocaleString()} failed all-time`}
            icon={<XCircle size={20} className="text-red-600" />}
            tone="bg-red-50"
          />
          <StatCard
            label="SMS awaiting delivery report"
            value={(overview.sms.undelivered ?? 0).toLocaleString()}
            sub="Accepted by provider, no DLR reconciled yet"
            icon={<Clock size={20} className="text-amber-600" />}
            tone="bg-amber-50"
          />
          <StatCard
            label="Email failed (24h)"
            value={overview.email.failed24h.toLocaleString()}
            sub={`${overview.email.last24h.toLocaleString()} sent · ${overview.email.failed.toLocaleString()} failed all-time`}
            icon={<Mail size={20} className="text-violet-600" />}
            tone="bg-violet-50"
          />
        </div>
      )}

      {!overview?.balance.ok && overview && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Bell size={16} className="shrink-0" />
          SMS balance unavailable ({overview.balance.code}: {overview.balance.message}). Sends may fail with 0402 — check MOBILESASA_TOKEN.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTab("sms"); setPage(1) }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "sms" ? "bg-primary text-white" : "text-muted hover:text-foreground"
              )}
            >
              SMS logs
            </button>
            <button
              onClick={() => { setTab("email"); setPage(1) }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "email" ? "bg-primary text-white" : "text-muted hover:text-foreground"
              )}
            >
              Email logs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={tab === "sms" ? "Search phone / messageId" : "Search recipient / subject"}
                className="w-56 rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setFailedOnly((v) => !v); setPage(1) }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                failedOnly ? "border-red-200 bg-red-50 text-red-700" : "border-border text-muted hover:text-foreground"
              )}
            >
              <TrendingUp size={12} />
              Failed only
            </button>
          </div>
        </div>

        {logsLoading ? (
          <TableSkeleton columns={logColumns} rows={5} />
        ) : tab === "sms" ? (
          <>
            {(sms?.logs.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No SMS logs yet — sends are recorded from the first send after this deploy.</p>
            ) : (
              <div className="divide-y divide-border">
                {sms?.logs.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                    {entry.ok
                      ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      : <XCircle size={16} className="shrink-0 text-red-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground tabular-nums">{entry.phone}</p>
                      <p className="truncate text-xs text-muted">
                        {entry.code} · {entry.deliveryStatus ?? "no DLR yet"}{entry.purpose ? ` · ${entry.purpose}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted tabular-nums">{formatDate(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {sms && sms.totalPages > 1 && (
              <TablePagination page={sms.page} totalPages={sms.totalPages} total={sms.total} pageSize={15} onPageChange={setPage} />
            )}
          </>
        ) : (
          <>
            {(email?.logs.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No email logs yet — sends are recorded from the first send after this deploy.</p>
            ) : (
              <div className="divide-y divide-border">
                {email?.logs.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                    {entry.ok
                      ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      : <XCircle size={16} className="shrink-0 text-red-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{entry.to}</p>
                      <p className="truncate text-xs text-muted">{entry.subject}{entry.error ? ` · ${entry.error.slice(0, 120)}` : ""}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted tabular-nums">{formatDate(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {email && email.totalPages > 1 && (
              <TablePagination page={email.page} totalPages={email.totalPages} total={email.total} pageSize={15} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
