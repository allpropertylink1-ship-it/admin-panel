"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search, X, UserPlus, Pencil, Trash2, Users, UserCheck, Hash, Loader2, AlertCircle, Ban, CheckCircle
} from "lucide-react"

interface AplAgent {
  id: string
  fullName: string
  email: string
  phone: string
  agentCode: string
  status: string
  suspendedAt: string | null
  suspendedReason: string | null
  commissionRate: number
  commissionType: string
  commissionCap: number | null
  createdAt: string
  _count: { users: number }
}

type FormData = { fullName: string; email: string; phone: string; commissionRate: number; commissionType: string; commissionCap: string }

const emptyForm: FormData = { fullName: "", email: "", phone: "", commissionRate: 0, commissionType: "PERCENTAGE", commissionCap: "" }

const statusFilters = ["", "ACTIVE", "SUSPENDED", "INACTIVE"]

const statusLabels: Record<string, string> = { "": "All", ACTIVE: "Active", SUSPENDED: "Suspended", INACTIVE: "Inactive" }

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success ring-success/20",
    SUSPENDED: "bg-error/10 text-error ring-error/20",
    INACTIVE: "bg-gray-100 text-gray-500 ring-gray-200",
  }
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
    colors[status] ?? "bg-gray-100 text-gray-500 ring-gray-200"
  )
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<AplAgent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AplAgent | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  const [newAgentCredentials, setNewAgentCredentials] = useState<{ email: string; password: string; name: string } | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AplAgent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [suspendTarget, setSuspendTarget] = useState<AplAgent | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendLoading, setSuspendLoading] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      const { data, error: fetchError } = await api.get<{ agents: AplAgent[]; total: number; totalPages: number }>(`/api/admin/agents?${params.toString()}`)
      if (fetchError || !data) throw new Error(fetchError || "Failed to load representatives")
      setAgents(data.agents ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load representatives")
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  function resetForm() {
    setForm(emptyForm)
    setFormError("")
  }

  function openAddModal() {
    setEditAgent(null)
    resetForm()
    setModalOpen(true)
  }

  function openEditModal(agent: AplAgent) {
    setEditAgent(agent)
    setForm({ fullName: agent.fullName, email: agent.email, phone: agent.phone, commissionRate: agent.commissionRate, commissionType: agent.commissionType, commissionCap: agent.commissionCap !== null && agent.commissionCap !== undefined ? String(agent.commissionCap) : "" })
    setFormError("")
    setModalOpen(true)
  }

  async function handleSave() {
    setFormError("")
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError("All fields are required")
      return
    }
    setFormLoading(true)
    try {
      const payload = {
        ...form,
        commissionCap: form.commissionCap ? Number(form.commissionCap) : null,
      }
      if (editAgent) {
        const { data, error: editError } = await api.patch<{ agent: AplAgent }>(`/api/admin/agents/${editAgent.id}`, payload)
        if (editError || !data) { setFormError(editError || "Failed to update agent"); return }
        setAgents((prev) => prev.map((a) => a.id === editAgent.id ? data.agent : a))
      } else {
        const { data, error: addError } = await api.post<{ agent: AplAgent; credentials?: { email: string; password: string } }>("/api/admin/agents", payload)
        if (addError || !data) { setFormError(addError || "Failed to create agent"); return }
        setAgents((prev) => [data.agent, ...prev])
        setTotal((prev) => prev + 1)
        if (data.credentials) {
          setNewAgentCredentials({ email: data.credentials.email, password: data.credentials.password, name: form.fullName })
          setModalOpen(false)
          resetForm()
          return
        }
      }
      setModalOpen(false)
      resetForm()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const { error: delError } = await api.delete(`/api/admin/agents/${deleteTarget.id}`)
      if (!delError) {
        setAgents((prev) => prev.filter((a) => a.id !== deleteTarget.id))
        setTotal((prev) => prev - 1)
      }
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  async function handleSuspend() {
    if (!suspendTarget) return
    setSuspendLoading(true)
    try {
      const { data, error: suspendError } = await api.post<{ agent: AplAgent }>(`/api/admin/agents/${suspendTarget.id}/suspend`, { suspendedReason: suspendReason || undefined })
      if (suspendError) throw new Error(suspendError)
      if (data?.agent) {
        setAgents((prev) => prev.map((a) => a.id === suspendTarget.id ? data.agent : a))
      }
      setSuspendTarget(null)
      setSuspendReason("")
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to suspend agent")
    } finally {
      setSuspendLoading(false)
    }
  }

  async function handleReactivate(agent: AplAgent) {
    const { data, error: reactivateError } = await api.post<{ agent: AplAgent }>(`/api/admin/agents/${agent.id}/reactivate`)
    if (reactivateError) {
      setFormError(reactivateError)
      return
    }
    if (data?.agent) {
      setAgents((prev) => prev.map((a) => a.id === agent.id ? data.agent : a))
    }
  }

  const totalReferred = agents.reduce((s, a) => s + a._count.users, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">APL Representatives</h1>
          <p className="mt-1 text-sm text-muted">Employees who onboard users onto the platform.</p>
        </div>
        <button onClick={openAddModal} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-2">
          <UserPlus size={16} /> Add Representative
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Representatives</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <UserCheck size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Referred Users</p>
              <p className="text-xl font-bold">{totalReferred}</p>
            </div>
          </div>
        </div>
      </div>

      {formError && !suspendTarget && (
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100 flex items-center gap-2.5 mb-4">
          <AlertCircle size={16} />
          <span className="flex-1">{formError}</span>
          <button onClick={() => setFormError("")} className="underline text-red-700 hover:text-red-800 font-medium">Dismiss</button>
        </div>
      )}

      {error ? (
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100 flex items-center gap-2.5">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={fetchAgents} className="underline text-red-700 hover:text-red-800 font-medium">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              {statusFilters.map((sf) => (
                <button key={sf} onClick={() => setStatusFilter(sf)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    statusFilter === sf
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-background hover:text-foreground"
                  )}>
                  {statusLabels[sf]}
                </button>
              ))}
            </div>
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text" placeholder="Search by name, email, or code..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="animate-pulse rounded bg-gray-200 h-5" style={{ width: `${80 + Math.random() * 100}px` }} />
                    <div className="animate-pulse rounded bg-gray-200 h-5 flex-1" />
                    <div className="animate-pulse rounded bg-gray-200 h-5" style={{ width: `${60 + Math.random() * 80}px` }} />
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Users size={40} className="opacity-30 text-muted" />
                <p className="mt-3 text-sm text-muted">{debouncedSearch ? "No representatives match your search." : "No representatives yet. Add the first one."}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-left">APL Rep Code</th>
                    <th className="px-4 py-3 text-left">Full Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Referrals</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} onClick={() => router.push(`/agents/${agent.id}`)} className="hover:bg-primary-50/30 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary font-mono gap-1">
                          <Hash size={12} /> {agent.agentCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{agent.fullName}</td>
                      <td className="px-4 py-3 text-muted">{agent.email}</td>
                      <td className="px-4 py-3 text-muted">{agent.phone}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={statusBadge(agent.status)}>{agent.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{agent._count.users}</td>
                      <td className="px-4 py-3 text-muted text-xs">{new Date(agent.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(agent) }} className="rounded-xl p-2 text-muted hover:bg-gray-50 hover:text-foreground transition-all" title="Edit">
                            <Pencil size={15} />
                          </button>
                          {agent.status === "ACTIVE" ? (
                            <button onClick={(e) => { e.stopPropagation(); setSuspendTarget(agent) }} className="rounded-xl p-2 text-warning/70 hover:bg-warning/10 hover:text-warning transition-all" title="Suspend">
                              <Ban size={15} />
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); handleReactivate(agent) }} className="rounded-xl p-2 text-success/70 hover:bg-success/10 hover:text-success transition-all" title="Reactivate">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(agent) }} className="rounded-xl p-2 text-error/70 hover:bg-error-50 hover:text-error transition-all" title="Delete">
                            <Trash2 size={15} />
                          </button>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editAgent ? "Edit Representative" : "Add Representative"}</h2>
              <button onClick={() => { setModalOpen(false); resetForm() }} className="rounded-xl p-1.5 text-muted hover:bg-gray-50 hover:text-foreground transition-all">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="rounded-xl bg-error-50 px-4 py-2.5 text-sm text-red-700 border border-red-100 mb-4">{formError}</div>}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="fullName">Full Name</label>
                <input id="fullName" type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="e.g. Joe Davis" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email Address</label>
                <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="agent@allpropertylink.co.ke" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="phone">Phone Number</label>
                <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="+254 7XX XXX XXX" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="commissionRate">Commission Rate</label>
                <input id="commissionRate" type="number" step="0.01" min="0" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="e.g. 5" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="commissionType">Commission Type</label>
                <select id="commissionType" value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (KES)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="commissionCap">Commission Cap (optional)</label>
                <input id="commissionCap" type="number" step="0.01" min="0" value={form.commissionCap} onChange={(e) => setForm({ ...form, commissionCap: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="e.g. 50000" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalOpen(false); resetForm() }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={formLoading}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-2">
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                {formLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Delete Agent</h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong> ({deleteTarget.agentCode})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {newAgentCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Representative Created</h2>
              <button onClick={() => setNewAgentCredentials(null)} className="rounded-xl p-1.5 text-muted hover:bg-gray-50 hover:text-foreground transition-all">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              A login account has been created for <strong>{newAgentCredentials.name}</strong>. Share these credentials with them.
            </p>
            <div className="rounded-xl bg-primary-50 border border-primary/20 p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Email</label>
                <p className="mt-0.5 font-mono text-sm font-medium">{newAgentCredentials.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Password</label>
                <p className="mt-0.5 font-mono text-sm font-medium">{newAgentCredentials.password}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => {
                navigator.clipboard.writeText(`Email: ${newAgentCredentials.email}\nPassword: ${newAgentCredentials.password}`)
              }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">
                Copy Credentials
              </button>
              <button onClick={() => setNewAgentCredentials(null)} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Suspend Agent</h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to suspend <strong>{suspendTarget.fullName}</strong> ({suspendTarget.agentCode})?
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium" htmlFor="suspendReason">Reason for suspension</label>
              <textarea id="suspendReason" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 min-h-[80px]"
                placeholder="Explain why this agent is being suspended..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setSuspendTarget(null); setSuspendReason("") }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSuspend} disabled={suspendLoading || !suspendReason.trim()}
                className="rounded-xl bg-warning px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                {suspendLoading && <Loader2 size={14} className="animate-spin" />}
                {suspendLoading ? "Suspending..." : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}