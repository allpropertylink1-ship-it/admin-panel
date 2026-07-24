"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import { cn } from "@/lib/utils"
import {
  UserPlus, Users, UserCheck, Hash, Loader2, AlertCircle, CheckCircle, Mail
} from "@/components/ui/icons"
import { AgentCredentialsModal } from "./AgentCredentialsModal"
import { AgentEmailChangeModal } from "./AgentEmailChangeModal"
import { AgentResendInviteModal } from "./AgentResendInviteModal"
import { TablePagination } from "@/components/shared/TablePagination"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import type { Agent } from "./types"
import AgentFilters from "./AgentFilters"
import AgentModal from "./AgentModal"
import AgentActions from "./AgentActions"

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
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  const [newAgentCredentials, setNewAgentCredentials] = useState<{ email: string; agentCode: string; name: string } | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [suspendTarget, setSuspendTarget] = useState<Agent | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendLoading, setSuspendLoading] = useState(false)

  const [emailChangeTarget, setEmailChangeTarget] = useState<Agent | null>(null)
  const [emailChangeNew, setEmailChangeNew] = useState("")
  const [emailChangeLoading, setEmailChangeLoading] = useState(false)
  const [emailChangeSent, setEmailChangeSent] = useState(false)

  const [resendInviteTarget, setResendInviteTarget] = useState<Agent | null>(null)
  const [resendInviteLoading, setResendInviteLoading] = useState(false)
  const [resendInviteDone, setResendInviteDone] = useState(false)

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
      params.set("limit", "20")
      const { data, error: fetchError } = await api.get<{ agents: Agent[]; total: number; totalPages: number }>(`/api/admin/agents?${params.toString()}`)
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

  function openAddModal() {
    setEditAgent(null)
    setFormError("")
    setModalOpen(true)
  }

  function openEditModal(agent: Agent) {
    setEditAgent(agent)
    setFormError("")
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditAgent(null)
    setFormError("")
  }

  async function handleModalSubmit(data: { fullName: string; email: string; phone: string }) {
    setFormError("")
    if (!data.fullName.trim() || !data.email.trim() || !data.phone.trim()) {
      setFormError("All fields are required")
      return
    }
    setFormLoading(true)
    try {
      const payload = { fullName: data.fullName, email: data.email, phone: data.phone }
      if (editAgent) {
        const emailChanged = data.email.trim().toLowerCase() !== editAgent.email.toLowerCase()
        if (emailChanged) {
          const { data: result, error: editError } = await api.patch<{ agent: Agent }>(`/api/admin/agents/${editAgent.id}`, { ...payload, email: undefined })
          if (editError || !result) { setFormError(editError || "Failed to update agent"); return }
          setAgents((prev) => prev.map((a) => a.id === editAgent.id ? result.agent : a))
          setModalOpen(false)
          setEmailChangeTarget(editAgent)
          setEmailChangeNew(data.email.trim())
          setEmailChangeSent(false)
          return
        }
        const { data: result, error: editError } = await api.patch<{ agent: Agent }>(`/api/admin/agents/${editAgent.id}`, payload)
        if (editError || !result) { setFormError(editError || "Failed to update agent"); return }
        setAgents((prev) => prev.map((a) => a.id === editAgent.id ? result.agent : a))
      } else {
        const { data: result, error: addError } = await api.post<{ agent: Agent; credentials?: { email: string; agentCode: string } }>("/api/admin/agents", payload)
        if (addError || !result) { setFormError(addError || "Failed to create agent"); return }
        setAgents((prev) => [result.agent, ...prev])
        setTotal((prev) => prev + 1)
        if (result.credentials) {
          setNewAgentCredentials({ email: result.credentials.email, agentCode: result.credentials.agentCode, name: data.fullName })
          setModalOpen(false)
          return
        }
      }
      setModalOpen(false)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleEmailChange() {
    if (!emailChangeTarget) return
    setEmailChangeLoading(true)
    setFormError("")
    try {
      const { error: apiError } = await api.post(`/api/admin/agents/${emailChangeTarget.id}/change-email`, { newEmail: emailChangeNew })
      if (apiError) { setFormError(apiError); return }
      setEmailChangeSent(true)
    } catch {
      setFormError("Failed to send verification email")
    } finally {
      setEmailChangeLoading(false)
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
      const { data, error: suspendError } = await api.post<{ agent: Agent }>(`/api/admin/agents/${suspendTarget.id}/suspend`, { suspendedReason: suspendReason || undefined })
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

  async function handleReactivate(agentId: string) {
    const { data, error: reactivateError } = await api.post<{ agent: Agent }>(`/api/admin/agents/${agentId}/reactivate`)
    if (reactivateError) {
      setFormError(reactivateError)
      return
    }
    if (data?.agent) {
      setAgents((prev) => prev.map((a) => a.id === agentId ? data.agent : a))
    }
  }

  async function handleResendInvite() {
    if (!resendInviteTarget) return
    setResendInviteLoading(true)
    try {
      const { error: resendError } = await api.post(`/api/admin/agents/${resendInviteTarget.id}/resend-invite`)
      if (resendError) throw new Error(resendError)
      setResendInviteDone(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to resend invitation")
      setResendInviteTarget(null)
    } finally {
      setResendInviteLoading(false)
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
            <AgentFilters
              search={search}
              statusFilter={statusFilter}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <TableSkeleton columns={[
                    { width: "w-28" }, { width: "w-40" }, { width: "w-48" }, { width: "w-32" }, { width: "w-20" }, { width: "w-12" }, { width: "w-28" }, { width: "w-20" }
                  ]} rows={6} checkbox />
                </tbody>
              </table>
            ) : agents.length === 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Users size={40} className="mx-auto opacity-30 text-muted" />
                      <p className="mt-3 text-sm text-muted">{debouncedSearch ? "No representatives match your search." : "No representatives yet. Add the first one."}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="w-10 px-2 py-3.5 text-left">
                      <input type="checkbox"
                        checked={agents.length > 0 && selectedIds.length === agents.length}
                        onChange={() => {
                          if (selectedIds.length === agents.length) { setSelectedIds([]) }
                          else { setSelectedIds(agents.map(a => a.id)) }
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </th>
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
                    <tr key={agent.id} onClick={() => router.push(`/agents/${agent.id}`)} className={cn("hover:bg-primary-50/30 cursor-pointer transition-colors", selectedIds.includes(agent.id) && "bg-primary/5")}>
                      <td className="w-10 px-2 py-3 text-center">
                        <input type="checkbox"
                          checked={selectedIds.includes(agent.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(agent.id) ? prev.filter(id => id !== agent.id) : [...prev, agent.id])}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                      </td>
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
                        <AgentActions
                          agent={agent}
                          suspendTarget={suspendTarget}
                          deleteTarget={deleteTarget}
                          suspendReason={suspendReason}
                          suspendLoading={suspendLoading}
                          deleteLoading={deleteLoading}
                          onEdit={() => openEditModal(agent)}
                          onSuspend={() => setSuspendTarget(agent)}
                          onReactivate={() => handleReactivate(agent.id)}
                          onResendInvite={() => setResendInviteTarget(agent)}
                          onDeleteConfirm={() => setDeleteTarget(agent)}
                          onSuspendReasonChange={setSuspendReason}
                          onSuspendConfirm={handleSuspend}
                          onSuspendCancel={() => { setSuspendTarget(null); setSuspendReason("") }}
                          onDeleteCancel={() => setDeleteTarget(null)}
                          onDeleteConfirmAction={handleDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <TablePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

          <BulkActionsBar
            selectedIds={selectedIds}
            onClear={() => setSelectedIds([])}
            actions={[
              { label: "Delete", action: "delete", variant: "destructive", requiresConfirmation: true },
              { label: "Suspend", action: "suspend", requiresConfirmation: true },
              { label: "Reactivate", action: "reactivate", requiresConfirmation: true },
            ]}
            onAction={async (action) => {
              setLoading(true)
              try {
                const { error: bulkError } = await api.post("/api/admin/agents/bulk", { ids: selectedIds, action })
                if (bulkError) throw new Error(bulkError)
                setSelectedIds([])
                await fetchAgents()
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Bulk action failed")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
          />
        </div>
      )}

      <AgentModal
        open={modalOpen}
        editingAgent={editAgent}
        formLoading={formLoading}
        formError={formError}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />

      <AgentCredentialsModal
        credentials={newAgentCredentials}
        onClose={() => setNewAgentCredentials(null)}
      />

      <AgentEmailChangeModal
        target={emailChangeTarget}
        newEmail={emailChangeNew}
        sent={emailChangeSent}
        loading={emailChangeLoading}
        onSend={handleEmailChange}
        onDone={() => { setEmailChangeTarget(null); setEmailChangeNew(""); setEmailChangeSent(false) }}
        onCancel={() => { setEmailChangeTarget(null); setEmailChangeNew("") }}
      />

      <AgentResendInviteModal
        target={resendInviteTarget}
        done={resendInviteDone}
        loading={resendInviteLoading}
        onSend={handleResendInvite}
        onDone={() => { setResendInviteTarget(null); setResendInviteDone(false) }}
        onCancel={() => setResendInviteTarget(null)}
      />
    </div>
  )
}
