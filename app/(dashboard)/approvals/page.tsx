"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, BadgeCheck, Search } from "@/components/ui/icons"
import { ApprovalFilters } from "./ApprovalFilters"
import { ApprovalCard } from "./ApprovalCard"
import type { PendingUser } from "./types"

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectInput, setRejectInput] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => { fetchPendingUsers() }, [])

  async function fetchPendingUsers() {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<{ users: PendingUser[] }>("/api/admin/users/pending")
      if (error) throw new Error(error)
      setUsers(data?.users ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId)
    try {
      const { error } = await api.post(`/api/admin/users/${userId}/approve`, {})
      if (error) throw new Error("Failed to approve user")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(userId: string) {
    if (!rejectReason.trim()) return
    setActionLoading(userId)
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, {
        accountStatus: "SUSPENDED",
      })
      if (error) throw new Error("Failed to reject user")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setRejectInput(null)
      setRejectReason("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.category || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Pending Approvals</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} user{users.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <ApprovalFilters
        search={search}
        onSearchChange={setSearch}
        onClearSearch={() => setSearch("")}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 shadow-sm">
          {search ? (
            <>
              <Search size={40} className="mb-3 opacity-30 text-muted" />
              <p className="text-sm text-muted">No users match your search</p>
            </>
          ) : (
            <>
              <BadgeCheck size={40} className="mb-3 text-success" />
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="mt-1 text-xs text-muted">No pending approvals at this time</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => (
            <ApprovalCard
              key={user.id}
              user={user}
              isExpanded={expanded === user.id}
              actionLoading={actionLoading}
              rejectInput={rejectInput}
              rejectReason={rejectReason}
              onToggle={(id) => setExpanded(expanded === id ? null : id)}
              onApprove={handleApprove}
              onRejectClick={setRejectInput}
              onRejectConfirm={handleReject}
              onRejectCancel={() => { setRejectInput(null); setRejectReason("") }}
              onRejectReasonChange={setRejectReason}
            />
          ))}
        </div>
      )}
    </div>
  )
}