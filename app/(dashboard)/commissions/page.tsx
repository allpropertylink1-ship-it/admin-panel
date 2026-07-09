"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Search, X, Banknote, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

interface Commission {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  notes: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; agentCode: string }
  property: { id: string; title: string; slug: string; price: number; currency: string }
  user: { id: string; firstName: string; lastName: string; email: string }
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n)

const statuses = ["", "PENDING", "PAID"] as const
const statusLabels: Record<string, string> = { "": "All", PENDING: "Pending", PAID: "Paid" }

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0, totalPaidAmount: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      const { data, error: fetchError } = await api.get<{ commissions: Commission[]; total: number; totalPages: number }>(`/api/admin/commissions?${params.toString()}`)
      if (fetchError || !data) throw new Error(fetchError || "Failed to load commissions")
      setCommissions(data.commissions ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load commissions")
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const { data } = await api.get<{ total: number; pending: number; paid: number; totalPaidAmount: number }>("/api/admin/commissions/stats")
      if (data) setStats(data)
    } catch {
      // keep defaults
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])
  useEffect(() => { fetchStats() }, [fetchStats])

  async function handleMarkPaid(id: string) {
    setActionLoading(id)
    try {
      await api.post(`/api/admin/commissions/${id}/mark-paid`)
      await Promise.all([fetchCommissions(), fetchStats()])
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-success/10 text-success",
      PENDING: "bg-warning/10 text-warning",
      CANCELLED: "bg-error/10 text-error",
    }
    return cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[status] ?? "bg-gray-100 text-gray-600")
  }

  const skeleton = (width: string, height = "h-5") => <div className={cn("animate-pulse rounded bg-gray-200", height)} style={{ width }} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Commissions</h1>
          <p className="mt-1 text-sm text-muted">Track and manage agent commissions from referred user listings.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
                {skeleton("60%", "h-3")}
                {skeleton("40%", "h-7")}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Banknote size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted">Total Commissions</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <XCircle size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted">Pending</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted">Paid</p>
                  <p className="text-xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Banknote size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted">Total Paid Amount</p>
                  <p className="text-xl font-bold">{fmt(stats.totalPaidAmount)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {error ? (
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100 flex items-center gap-2.5">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={fetchCommissions} className="underline text-red-700 hover:text-red-800 font-medium">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text" placeholder="Search by agent, property, or user..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-1 flex">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all", s === statusFilter ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground")}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    {skeleton(`${100 + Math.random() * 80}px`)}
                    {skeleton("160px")}
                    {skeleton(`${80 + Math.random() * 60}px`)}
                    {skeleton("70px")}
                    {skeleton("60px")}
                    {skeleton("70px")}
                    {skeleton("80px")}
                  </div>
                ))}
              </div>
            ) : commissions.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Banknote size={40} className="opacity-30 text-muted" />
                <p className="mt-3 text-sm text-muted">{debouncedSearch || statusFilter ? "No commissions match your filters." : "No commissions yet."}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.aplAgent.fullName}</p>
                        <p className="text-xs text-muted font-mono">{c.aplAgent.agentCode}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {c.user.firstName} {c.user.lastName}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate font-medium">{c.property.title}</p>
                        <p className="text-xs text-muted">{fmt(c.property.price)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(c.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={statusBadge(c.status)}>
                          {c.status === "PAID" ? <CheckCircle size={12} className="mr-1" /> : c.status === "PENDING" ? <XCircle size={12} className="mr-1" /> : null}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "PENDING" ? (
                          <button
                            onClick={() => handleMarkPaid(c.id)}
                            disabled={actionLoading === c.id}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {actionLoading === c.id && <Loader2 size={13} className="animate-spin" />}
                            {actionLoading === c.id ? "Processing..." : "Mark Paid"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "touch-target rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      p === page ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-background hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
