"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Search, X, Banknote, CheckCircle, XCircle, Loader2, AlertCircle, Download } from "lucide-react"

interface Claim {
  id: string
  amount: number
  currency: string
  periodLabel: string | null
  notes: string | null
  status: string
  adminNotes: string | null
  reviewedAt: string | null
  createdAt: string
  referralPartner: { id: string; fullName: string; email: string; partnerCode: string }
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n)

const statuses = ["", "PENDING", "APPROVED", "REJECTED"] as const
const statusLabels: Record<string, string> = { "": "All", PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    APPROVED: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    REJECTED: "bg-error/10 text-error",
  }
  return cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[status] ?? "bg-gray-100 text-gray-600")
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<Claim | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchClaims = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      const { data, error: fetchError } = await api.get<{ claims: Claim[]; total: number; totalPages: number }>(`/api/admin/claims?${params.toString()}`)
      if (fetchError || !data) throw new Error(fetchError || "Failed to load claims")
      setClaims(data.claims ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load claims")
      setClaims([])
    } finally { setLoading(false) }
  }, [debouncedSearch, statusFilter, page])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const { data } = await api.get<{ total: number; pending: number; approved: number; rejected: number }>("/api/admin/claims/stats")
      if (data) setStats(data)
    } catch { /* keep defaults */ }
    finally { setStatsLoading(false) }
  }, [])

  useEffect(() => { fetchClaims() }, [fetchClaims])
  useEffect(() => { fetchStats() }, [fetchStats])

  async function handleReview(claimId: string, status: string) {
    setSubmitting(true)
    try {
      await api.patch(`/api/admin/claims/${claimId}`, { status, adminNotes: reviewNotes || null })
      setReviewModal(null)
      setReviewNotes("")
      await Promise.all([fetchClaims(), fetchStats()])
    } finally { setSubmitting(false) }
  }

  const skeleton = (width: string, height = "h-5") => <div className={cn("animate-pulse rounded bg-gray-200", height)} style={{ width }} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Payment Claims</h1>
          <p className="mt-1 text-sm text-muted">Review and manage payment claims raised by Referral Partners.</p>
        </div>
        <a
          href={`/api/admin/exports/claims${statusFilter ? `?status=${statusFilter}` : ""}`}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </a>
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
                  <p className="text-sm text-muted">Total Claims</p>
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
                  <p className="text-sm text-muted">Approved</p>
                  <p className="text-xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                  <XCircle size={20} className="text-error" />
                </div>
                <div>
                  <p className="text-sm text-muted">Rejected</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
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
          <button onClick={fetchClaims} className="underline text-red-700 hover:text-red-800 font-medium">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search by partner..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-1 flex">
              {statuses.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all", s === statusFilter ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground")}
                >{statusLabels[s]}</button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    {skeleton("120px")} {skeleton("80px")} {skeleton("70px")} {skeleton("60px")} {skeleton("80px")}
                  </div>
                ))}
              </div>
            ) : claims.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Banknote size={40} className="opacity-30 text-muted" />
                <p className="mt-3 text-sm text-muted">{debouncedSearch || statusFilter ? "No claims match your filters." : "No claims yet."}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.referralPartner.fullName}</p>
                        <p className="text-xs text-muted font-mono">{c.referralPartner.partnerCode}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(c.amount)}</td>
                      <td className="px-4 py-3 text-muted">{c.periodLabel || "-"}</td>
                      <td className="px-4 py-3 text-center"><span className={statusBadge(c.status)}>{c.status}</span></td>
                      <td className="px-4 py-3 text-xs text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "PENDING" ? (
                          <button onClick={() => { setReviewModal(c); setReviewNotes(c.adminNotes || "") }}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-1.5"
                          >Review</button>
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
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("touch-target rounded-lg px-3 py-1.5 text-xs font-medium transition-all", p === page ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-background hover:text-foreground")}
                  >{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setReviewModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-heading">Review Claim</h2>
              <button onClick={() => setReviewModal(null)} className="touch-target rounded-lg p-1.5 text-muted hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted">Partner</span><span className="font-medium">{reviewModal.referralPartner.fullName}</span></div>
              <div className="flex justify-between"><span className="text-muted">Partner Code</span><span className="font-medium font-mono">{reviewModal.referralPartner.partnerCode}</span></div>
              <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-medium">{fmt(reviewModal.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Period</span><span className="font-medium">{reviewModal.periodLabel || "-"}</span></div>
              {reviewModal.notes && (
                <div><p className="text-muted mb-1">Partner Notes</p><p className="rounded-lg bg-surface-secondary p-3 text-text-primary">{reviewModal.notes}</p></div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-1">Admin Notes</label>
              <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none"
                placeholder="Add notes for the agent..." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleReview(reviewModal.id, "APPROVED")} disabled={submitting}
                className="flex-1 rounded-xl bg-success px-5 py-2.5 text-sm font-medium text-white hover:bg-success/90 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >{submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}Approve</button>
              <button onClick={() => handleReview(reviewModal.id, "REJECTED")} disabled={submitting}
                className="flex-1 rounded-xl bg-error px-5 py-2.5 text-sm font-medium text-white hover:bg-error/90 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >{submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={16} />}Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
