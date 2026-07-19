"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Search, X, Loader2, AlertCircle, CheckCircle, Clock, Eye } from "@/components/ui/icons"
import { BulkActionsBar } from "@/components/BulkActionsBar"

interface Dispute {
  id: string
  title: string
  description: string
  amount: number
  currency: string
  status: string
  resolution: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; email: string; agentCode: string }
  claim: { id: string; amount: number; status: string; property: { title: string } } | null
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n)

const statuses = ["", "PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"]
const statusLabels: Record<string, string> = { "": "All", PENDING: "Pending", UNDER_REVIEW: "Under Review", RESOLVED: "Resolved", REJECTED: "Rejected" }
const statusColors: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-500 ring-warning-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-600 ring-blue-200",
  RESOLVED: "bg-success/10 text-success-700 ring-success/20",
  REJECTED: "bg-error/10 text-error-500 ring-error/20",
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [resolutionText, setResolutionText] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (statusFilter) params.set("status", statusFilter)
    const { data, error } = await api.get<{ disputes: Dispute[]; total: number; totalPages: number }>(`/api/admin/disputes?${params}`)
    if (data) {
      setDisputes(data.disputes)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } else {
      setError(error || "Failed to load")
    }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  function openDetail(dispute: Dispute) {
    setSelectedDispute(dispute)
    setResolutionText(dispute.resolution || "")
  }

  async function handleUpdateStatus(disputeId: string, newStatus: string) {
    setUpdateLoading(true)
    const { error } = await api.patch(`/api/admin/disputes/${disputeId}`, {
      status: newStatus,
      resolution: newStatus === "RESOLVED" || newStatus === "REJECTED" ? resolutionText : undefined,
    })
    if (!error) {
      setSelectedDispute(null)
      fetchDisputes()
    }
    setUpdateLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Disputes</h1>
        <p className="mt-1 text-sm text-muted">{total} total dispute{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1) }}
            className={cn("touch-target rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === s ? "bg-primary-600 text-white" : "bg-card text-muted hover:bg-accent/10"
            )}
          >{statusLabels[s]}</button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-[120px] animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-[200px] animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-[80px] animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-[70px] animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-[60px] animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <AlertCircle size={24} className="text-error-500" />
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={fetchDisputes} className="touch-target rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white">Retry</button>
        </div>
      ) : disputes.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted">No disputes found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium w-10">
                  {disputes.length > 0 && (
                    <input type="checkbox" checked={selectedIds.length === disputes.length} onChange={(e) => setSelectedIds(e.target.checked ? disputes.map(d => d.id) : [])}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  )}
                </th>
                <th className="px-4 py-3 font-medium">APL Representative</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disputes.map((d) => (
                <tr key={d.id} className={cn("bg-surface hover:bg-card", selectedIds.includes(d.id) && "bg-primary/5")}>
                  <td className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, d.id] : selectedIds.filter(id => id !== d.id))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{d.aplAgent.fullName}</p>
                    <p className="text-xs text-muted">{d.aplAgent.agentCode}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{d.title}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{fmt(d.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusColors[d.status])}>{statusLabels[d.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openDetail(d)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                    ><Eye size={13} /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="touch-target rounded-lg border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40">Previous</button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="touch-target rounded-lg border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40">Next</button>
        </div>
      )}

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Under Review", action: "under-review" },
          { label: "Resolve", action: "resolve", requiresConfirmation: true },
          { label: "Reject", action: "reject", variant: "destructive", requiresConfirmation: true },
        ]}
        onAction={async (action) => {
          setLoading(true)
          try {
            const { error } = await api.post("/api/admin/disputes/bulk", { ids: selectedIds, action })
            if (error) throw new Error(error)
            setSelectedIds([])
            await fetchDisputes()
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Bulk action failed")
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
      />

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedDispute(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{selectedDispute.title}</h3>
                <p className="text-sm text-muted">{selectedDispute.aplAgent.fullName} &middot; {selectedDispute.aplAgent.agentCode}</p>
              </div>
              <button type="button" onClick={() => setSelectedDispute(null)} className="touch-target text-muted hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="mb-4">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusColors[selectedDispute.status])}>{statusLabels[selectedDispute.status]}</span>
            </div>

            <div className="mb-4 rounded-lg bg-card p-3">
              <p className="text-xs text-muted">Disputed Amount</p>
              <p className="text-lg font-bold text-foreground">{fmt(selectedDispute.amount)}</p>
            </div>

            {selectedDispute.claim && (
              <div className="mb-4 rounded-lg bg-card p-3">
                <p className="text-xs text-muted">Related Claim</p>
                <p className="text-sm font-medium text-foreground">{selectedDispute.claim.property?.title || "N/A"}</p>
                <p className="text-xs text-muted">{fmt(selectedDispute.claim.amount)} &middot; {selectedDispute.claim.status}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-muted mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDispute.description}</p>
            </div>

            <div className="mb-4">
              <label htmlFor="resolution" className="block text-xs font-medium text-muted mb-1">Admin Notes / Resolution</label>
              <textarea id="resolution" rows={3} value={resolutionText} onChange={(e) => setResolutionText(e.target.value)}
                className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-300 focus:outline-none resize-y"
                placeholder="Add resolution notes or admin comments..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedDispute.status === "PENDING" && (
                <button type="button" onClick={() => handleUpdateStatus(selectedDispute.id, "UNDER_REVIEW")} disabled={updateLoading}
                  className="touch-target inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                ><Clock size={14} /> Mark Under Review</button>
              )}
              {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "REJECTED" && (
                <>
                  <button type="button" onClick={() => handleUpdateStatus(selectedDispute.id, "RESOLVED")} disabled={updateLoading || !resolutionText.trim()}
                    className="touch-target inline-flex items-center gap-1 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                  ><CheckCircle size={14} /> Resolve</button>
                  <button type="button" onClick={() => handleUpdateStatus(selectedDispute.id, "REJECTED")} disabled={updateLoading || !resolutionText.trim()}
                    className="touch-target inline-flex items-center gap-1 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
                  ><X size={14} /> Reject</button>
                </>
              )}
            </div>

            {selectedDispute.resolution && (
              <div className="mt-4 rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted mb-1">Resolution</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDispute.resolution}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}