"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search, X, Wallet, Banknote, CheckCircle, XCircle,
  Loader2, AlertCircle, Plus, Pencil, Trash2, CreditCard,
} from "lucide-react"

interface AgentOption {
  id: string
  fullName: string
  agentCode: string
}

interface Payout {
  id: string
  amount: number
  currency: string
  method: string
  reference: string | null
  status: string
  notes: string | null
  paidAt: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; email: string; agentCode: string }
  properties?: { id: string; title: string; slug?: string; price: number; city: string }[]
}

interface PropertyOption {
  id: string
  title: string
  slug: string
  price: number
  city: string
  propertyType: string
}

interface AgentSelectOption {
  id: string
  fullName: string
  agentCode: string
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n)

const statuses = ["", "PENDING", "PAID", "CANCELLED"] as const
const statusLabels: Record<string, string> = { "": "All", PENDING: "Pending", PAID: "Paid", CANCELLED: "Cancelled" }

const methods = ["MPESA", "BANK", "PAYPAL"] as const

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editPayout, setEditPayout] = useState<Payout | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<Payout | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Payout | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [agents, setAgents] = useState<AgentSelectOption[]>([])

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      const { data, error: fetchError } = await api.get<{ payouts: Payout[]; total: number; totalPages: number }>(`/api/admin/payouts?${params.toString()}`)
      if (fetchError || !data) throw new Error(fetchError || "Failed to load payouts")
      setPayouts(data.payouts ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payouts")
      setPayouts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const { data } = await api.get<{ total: number; pending: number; paid: number; totalPaidAmount: number }>("/api/admin/payouts/stats")
      if (data) setStats(data)
    } catch {
      // keep defaults
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await api.get<{ agents: AgentSelectOption[] }>("/api/admin/agents?limit=100")
      if (data?.agents) setAgents(data.agents)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchAgents() }, [fetchAgents])

  async function handleMarkPaid(id: string) {
    setActionLoading(id)
    try {
      await api.post(`/api/admin/payouts/${id}/mark-paid`)
      await Promise.all([fetchPayouts(), fetchStats()])
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel(id: string) {
    setActionLoading(id)
    try {
      await api.post(`/api/admin/payouts/${id}/cancel`)
      await Promise.all([fetchPayouts(), fetchStats()])
    } finally {
      setActionLoading(null)
      setConfirmCancel(null)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      await api.delete(`/api/admin/payouts/${id}`)
      await Promise.all([fetchPayouts(), fetchStats()])
    } finally {
      setActionLoading(null)
      setConfirmDelete(null)
    }
  }

  async function handleCreate(formData: { aplAgentId: string; amount: number; method: string; reference: string; notes: string; propertyIds?: string[] }) {
    await api.post("/api/admin/payouts", formData)
    setShowCreateModal(false)
    await Promise.all([fetchPayouts(), fetchStats()])
  }

  async function handleUpdate(id: string, formData: { amount: number; method: string; reference: string; notes: string }) {
    await api.patch(`/api/admin/payouts/${id}`, formData)
    setEditPayout(null)
    await Promise.all([fetchPayouts(), fetchStats()])
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-success/10 text-success",
      PENDING: "bg-warning/10 text-warning",
      CANCELLED: "bg-error/10 text-error",
    }
    return cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium gap-1", colors[status] ?? "bg-gray-100 text-gray-600")
  }

  const skeleton = (width: string, height = "h-5") => <div className={cn("animate-pulse rounded bg-gray-200", height)} style={{ width }} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Payouts</h1>
          <p className="mt-1 text-sm text-muted">Manage payouts to APL Representatives.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Create Payout
        </button>
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
                  <Wallet size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted">Total Payouts</p>
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
          <button onClick={fetchPayouts} className="underline text-red-700 hover:text-red-800 font-medium">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text" placeholder="Search by agent name..."
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
                    {skeleton("120px")}
                    {skeleton("100px")}
                    {skeleton("80px")}
                    {skeleton("70px")}
                    {skeleton("80px")}
                    {skeleton("60px")}
                    {skeleton("100px")}
                  </div>
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Wallet size={40} className="opacity-30 text-muted" />
                <p className="mt-3 text-sm text-muted">{debouncedSearch || statusFilter ? "No payouts match your filters." : "No payouts yet."}</p>
              </div>
            ) : (
                  <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Properties</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.aplAgent.fullName}</p>
                        <p className="text-xs text-muted font-mono">{p.aplAgent.agentCode}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {p.properties && p.properties.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.properties.map((prop) => (
                              <span key={prop.id} className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary truncate max-w-[140px]">
                                {prop.title}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                          {p.method === "MPESA" ? <CreditCard size={12} /> : p.method === "BANK" ? <Banknote size={12} /> : <Wallet size={12} />}
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted font-mono">{p.reference || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={statusBadge(p.status)}>
                          {p.status === "PAID" ? <CheckCircle size={12} /> : p.status === "PENDING" ? <XCircle size={12} /> : null}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => setEditPayout(p)}
                                className="touch-target rounded p-1.5 text-muted hover:text-foreground"
                                title="Edit payout"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleMarkPaid(p.id)}
                                disabled={actionLoading === p.id}
                                className="touch-target rounded p-1.5 text-success hover:bg-success/10 disabled:opacity-50"
                                title="Mark as paid"
                              >
                                {actionLoading === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => setConfirmCancel(p)}
                                className="touch-target rounded p-1.5 text-warning hover:bg-warning/10"
                                title="Cancel payout"
                              >
                                <XCircle size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(p)}
                                className="touch-target rounded p-1.5 text-error hover:bg-error/10"
                                title="Delete payout"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {p.status === "PAID" && (
                            <span className="text-xs text-muted">&mdash;</span>
                          )}
                          {p.status === "CANCELLED" && (
                            <span className="text-xs text-muted">&mdash;</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted">Showing {(page - 1) * 20 + 1}&ndash;{Math.min(page * 20, total)} of {total}</p>
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

      {showCreateModal && (
        <CreatePayoutModal
          agents={agents}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editPayout && (
        <EditPayoutModal
          payout={editPayout}
          onClose={() => setEditPayout(null)}
          onSubmit={(data) => handleUpdate(editPayout.id, data)}
        />
      )}

      {confirmCancel && (
        <ConfirmModal
          title="Cancel Payout"
          message={`Are you sure you want to cancel the payout of ${fmt(confirmCancel.amount)} to ${confirmCancel.aplAgent.fullName}?`}
          loading={actionLoading === confirmCancel.id}
          onConfirm={() => handleCancel(confirmCancel.id)}
          onClose={() => setConfirmCancel(null)}
          variant="warning"
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Payout"
          message={`Are you sure you want to delete the pending payout of ${fmt(confirmDelete.amount)} to ${confirmDelete.aplAgent.fullName}? This cannot be undone.`}
          loading={actionLoading === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
          variant="error"
        />
      )}
    </div>
  )
}

function CreatePayoutModal({ agents, onClose, onSubmit }: { agents: AgentSelectOption[]; onClose: () => void; onSubmit: (data: { aplAgentId: string; amount: number; method: string; reference: string; notes: string; propertyIds?: string[] }) => Promise<void> }) {
  const [aplAgentId, setAplAgentId] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("MPESA")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)

  useEffect(() => {
    if (!aplAgentId) { setAvailableProperties([]); setSelectedPropertyIds([]); return }
    setPropertiesLoading(true)
    api.get<{ properties: PropertyOption[] }>(`/api/admin/payouts/available-properties/${aplAgentId}`)
      .then(({ data }) => setAvailableProperties(data?.properties ?? []))
      .catch(() => setAvailableProperties([]))
      .finally(() => setPropertiesLoading(false))
  }, [aplAgentId])

  function toggleProperty(id: string) {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aplAgentId || !amount) return
    setSubmitting(true)
    try {
      await onSubmit({ aplAgentId, amount: Number(amount), method, reference, notes, propertyIds: selectedPropertyIds.length > 0 ? selectedPropertyIds : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Create Payout</h2>
          <button onClick={onClose} className="touch-target rounded-lg p-1 text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">APL Representative</label>
            <select
              value={aplAgentId} onChange={(e) => setAplAgentId(e.target.value)} required
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Select an agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.fullName} ({a.agentCode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Amount (KES)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {aplAgentId && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Link Properties (optional)
                {propertiesLoading && <Loader2 size={12} className="inline ml-1 animate-spin" />}
              </label>
              {availableProperties.length === 0 && !propertiesLoading ? (
                <p className="text-xs text-muted">No properties found for this agent&apos;s referrals.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-background p-1 space-y-0.5">
                  {availableProperties.map((prop) => (
                    <label key={prop.id} className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors",
                      selectedPropertyIds.includes(prop.id) ? "bg-primary-50 text-primary" : "hover:bg-gray-50"
                    )}>
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.includes(prop.id)}
                        onChange={() => toggleProperty(prop.id)}
                        className="rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span className="flex-1 truncate font-medium">{prop.title}</span>
                      <span className="shrink-0 text-muted">{prop.city}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedPropertyIds.length > 0 && (
                <p className="mt-1 text-[10px] text-muted">{selectedPropertyIds.length} property selected</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Reference (optional)</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !aplAgentId || !amount}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditPayoutModal({ payout, onClose, onSubmit }: { payout: Payout; onClose: () => void; onSubmit: (data: { amount: number; method: string; reference: string; notes: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(String(payout.amount))
  const [method, setMethod] = useState(payout.method)
  const [reference, setReference] = useState(payout.reference || "")
  const [notes, setNotes] = useState(payout.notes || "")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return
    setSubmitting(true)
    try {
      await onSubmit({ amount: Number(amount), method, reference, notes })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Edit Payout</h2>
          <button onClick={onClose} className="touch-target rounded-lg p-1 text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Agent</label>
            <p className="text-sm font-medium">{payout.aplAgent.fullName} ({payout.aplAgent.agentCode})</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Amount (KES)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Reference (optional)</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !amount}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, loading, onConfirm, onClose, variant }: { title: string; message: string; loading: boolean; onConfirm: () => void; onClose: () => void; variant?: "warning" | "error" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-background transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 inline-flex items-center gap-2",
              variant === "warning" ? "bg-warning hover:bg-amber-600" : "bg-error hover:bg-red-700"
            )}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
