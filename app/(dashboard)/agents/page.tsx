"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search, X, UserPlus, Pencil, Trash2, Users, UserCheck, Hash, Loader2, AlertCircle
} from "lucide-react"

interface AplAgent {
  id: string
  fullName: string
  email: string
  phone: string
  agentCode: string
  createdAt: string
  _count: { users: number }
}

type FormData = { fullName: string; email: string; phone: string }

const emptyForm: FormData = { fullName: "", email: "", phone: "" }

export default function AgentsPage() {
  const [agents, setAgents] = useState<AplAgent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AplAgent | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AplAgent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      const { data, error: fetchError } = await api.get<{ agents: AplAgent[]; total: number }>(`/api/admin/agents?${params.toString()}`)
      if (fetchError || !data) throw new Error(fetchError || "Failed to load representatives")
      setAgents(data.agents ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load representatives")
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

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
    setForm({ fullName: agent.fullName, email: agent.email, phone: agent.phone })
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
      if (editAgent) {
        const { data, error: editError } = await api.patch<{ agent: AplAgent }>(`/api/admin/agents/${editAgent.id}`, form)
        if (editError || !data) { setFormError(editError || "Failed to update agent"); return }
        setAgents((prev) => prev.map((a) => a.id === editAgent.id ? data.agent : a))
      } else {
        const { data, error: addError } = await api.post<{ agent: AplAgent }>("/api/admin/agents", form)
        if (addError || !data) { setFormError(addError || "Failed to create agent"); return }
        setAgents((prev) => [data.agent, ...prev])
        setTotal((prev) => prev + 1)
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
              <p className="text-sm text-muted">Total Agents</p>
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

      {error ? (
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100 flex items-center gap-2.5">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={fetchAgents} className="underline text-red-700 hover:text-red-800 font-medium">Retry</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
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
                    <th className="px-4 py-3 text-left">Agent Code</th>
                    <th className="px-4 py-3 text-left">Full Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-center">Referrals</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary font-mono gap-1">
                          <Hash size={12} /> {agent.agentCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{agent.fullName}</td>
                      <td className="px-4 py-3 text-muted">{agent.email}</td>
                      <td className="px-4 py-3 text-muted">{agent.phone}</td>
                      <td className="px-4 py-3 text-center font-medium">{agent._count.users}</td>
                      <td className="px-4 py-3 text-muted text-xs">{new Date(agent.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(agent)} className="rounded-xl p-2 text-muted hover:bg-gray-50 hover:text-foreground transition-all" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(agent)} className="rounded-xl p-2 text-error/70 hover:bg-error-50 hover:text-error transition-all" title="Delete">
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
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
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
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
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
    </div>
  )
}
