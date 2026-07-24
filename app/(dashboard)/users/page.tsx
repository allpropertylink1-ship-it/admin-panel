"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Shield, ShieldOff, Trash2,
  AlertCircle, Eye, UserPlus, Loader2, Download,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"
import { UserFilters } from "./UserFilters"
import { UserModal } from "./UserModal"

import type { User, UsersResponse } from "./types"

const FILTERS = ["All", "Active", "Pending", "Suspended"]

const USER_TYPE_TABS = ["", "PROPERTY_OWNER", "AGENT", "FUNDI", "SERVICE_PROVIDER"]
const USER_TYPE_LABELS: Record<string, string> = { "": "All Types", PROPERTY_OWNER: "Property Owners", AGENT: "Agents", FUNDI: "Fundis", SERVICE_PROVIDER: "Service Providers" }

const badge: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  NONE: "bg-gray-50 text-gray-600",
  ADMIN: "bg-red-50 text-red-700",
  AGENT: "bg-blue-50 text-blue-700",
  APPLICANT: "bg-gray-50 text-gray-600",
}

const statusFilterMap: Record<string, string> = { "All": "", "Active": "ACTIVE", "Pending": "PENDING_APPROVAL", "Suspended": "SUSPENDED" }

const userColumns = [
  { width: "w-32" }, { width: "w-40" }, { width: "w-20" }, { width: "w-20" }, { width: "w-16" }, { width: "w-24" }, { width: "w-20" }, { width: "w-24" },
]

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [userTypeFilter, setUserTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserDetail, setSelectedUserDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeDetailTab, setActiveDetailTab] = useState<"details" | "properties" | "services">("details")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const p = new URLSearchParams()
      if (search) p.set("search", search)
      if (activeFilter !== "All") p.set("status", statusFilterMap[activeFilter])
      if (userTypeFilter) p.set("userType", userTypeFilter)
      p.set("page", String(page))
      p.set("pageSize", "20")
      const { data: d, error } = await api.get<UsersResponse>(`/api/admin/users?${p}`)
      if (error || !d) throw new Error(error || "No data")
      setData(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter, userTypeFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function handleSearch(v: string) {
    setSearchValue(v)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => { setSearch(v); setPage(1) }, 350))
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    const prevData = data ? { ...data, users: data.users.map(u => ({ ...u })) } : data
    setData(cur => cur ? { ...cur, users: cur.users.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u) } : cur)
    setActionLoading(userId)
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, { accountStatus: newStatus })
      if (error) throw new Error(error)
      await fetchUsers()
    } catch (err: unknown) {
      if (prevData) setData(prevData)
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  async function openUserDetail(user: User) {
    setSelectedUser(user)
    setSelectedUserDetail(null)
    setActiveDetailTab("details")
    setDetailLoading(true)
    try {
      const { data } = await api.get<Record<string, any>>(`/api/admin/users/${user.id}`)
      if (data?.user) setSelectedUserDetail(data.user)
    } catch { }
    setDetailLoading(false)
  }

  async function handleDelete(userId: string) {
    setActionLoading(userId)
    setDeleteConfirm(null)
    try {
      const { error } = await api.delete(`/api/admin/users/${userId}`)
      if (error) throw new Error(error)
      if (selectedUser?.id === userId) { setSelectedUser(null); setSelectedUserDetail(null) }
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Users</h1>
          <p className="mt-1 text-sm text-muted">{data ? `${data.total} total users` : "Loading..."}</p>
        </div>
        <a
          href="/api/admin/exports/users"
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </a>
      </div>

      <UserFilters
        search={search}
        searchValue={searchValue}
        activeFilter={activeFilter}
        userTypeFilter={userTypeFilter}
        onSearchChange={handleSearch}
        onClearSearch={() => { setSearchValue(""); setSearch(""); setPage(1) }}
        onFilterChange={(f) => { setActiveFilter(f); setPage(1) }}
        onUserTypeChange={(ut) => { setUserTypeFilter(ut); setPage(1) }}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                <th className="w-10 px-2 py-3.5 text-left">
                  <input type="checkbox"
                    checked={data !== null && data.users.length > 0 && selectedIds.length === data.users.length}
                    onChange={() => {
                      if (data && selectedIds.length === data.users.length) { setSelectedIds([]) }
                      else if (data) { setSelectedIds(data.users.map(u => u.id)) }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">KYC</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Joined</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <TableSkeleton columns={userColumns} rows={8} /> : data && data.users.length > 0 ? (
                data.users.map((user) => (
                  <tr key={user.id} onClick={() => openUserDetail(user)}
                    className={cn("cursor-pointer transition-colors hover:bg-gray-50/40", selectedIds.includes(user.id) && "bg-primary/5")}>
                    <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/5 text-primary">
                        {user.userTypes?.join(", ") || user.primaryUserType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", badge[user.accountStatus] || "")}>
                        {user.accountStatus === "PENDING_APPROVAL" ? "Pending" : user.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", badge[user.kycStatus] || "")}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openUserDetail(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors">
                          <Eye size={13} />
                          View
                        </button>
                        <button onClick={() => handleToggleStatus(user.id, user.accountStatus)} disabled={actionLoading === user.id}
                          className={cn("inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors", actionLoading === user.id && "opacity-50",
                            user.accountStatus === "SUSPENDED" ? "text-success hover:bg-success/10" : "text-warning hover:bg-warning/10")}
                          title={user.accountStatus === "SUSPENDED" ? "Activate" : "Suspend"}>
                          {actionLoading === user.id ? <Loader2 size={13} className="animate-spin" /> : user.accountStatus === "SUSPENDED" ? <Shield size={13} /> : <ShieldOff size={13} />}
                          {user.accountStatus === "SUSPENDED" ? "Activate" : "Suspend"}
                        </button>
                        <button onClick={() => setDeleteConfirm(user.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors">
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                      {deleteConfirm === user.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground">Delete user?</h3>
                            <p className="mt-2 text-sm text-muted">This permanently removes {user.firstName} {user.lastName} and all associated data. Cannot be undone.</p>
                            <div className="mt-5 flex justify-end gap-3">
                              <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">Cancel</button>
                              <button onClick={() => handleDelete(user.id)} disabled={actionLoading === user.id}
                                className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                                {actionLoading === user.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center text-muted">
                      <UserPlus className="mb-2 opacity-30" size={32} />
                      <p className="text-sm">No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <TablePagination page={page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize || 20} onPageChange={setPage} />
        )}
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Delete", action: "delete", variant: "destructive", requiresConfirmation: true },
          { label: "Suspend", action: "suspend", requiresConfirmation: true },
          { label: "Activate", action: "activate", requiresConfirmation: true },
        ]}
        onAction={async (action) => {
          setActionLoading("bulk")
          try {
            const { error } = await api.post("/api/admin/users/bulk", { ids: selectedIds, action })
            if (error) throw new Error(error)
            setSelectedIds([])
            await fetchUsers()
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Bulk action failed")
          } finally {
            setActionLoading(null)
          }
        }}
        loading={actionLoading === "bulk"}
      />

      <UserModal
        user={selectedUser}
        open={selectedUser !== null}
        onClose={() => { setSelectedUser(null); setSelectedUserDetail(null) }}
        onStatusChange={(userId, newStatus) => handleToggleStatus(userId, newStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
        loading={actionLoading}
      />
    </div>
  )
}
