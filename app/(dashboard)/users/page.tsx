"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Search, ChevronLeft, ChevronRight, Shield, ShieldOff, Trash2,
  X, AlertCircle, Eye, UserPlus, Filter, Loader2, Download,
} from "@/components/ui/icons"

interface User {
  id: string; firstName: string; lastName: string; email: string
  role: string; accountStatus: string; kycStatus: string; createdAt: string
  phone?: string; category?: string; userTypes?: string[]; primaryUserType?: string
  _count?: { properties: number; serviceListings: number }
}

interface UsersResponse {
  users: User[]; total: number; page: number; pageSize: number; totalPages: number
}

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

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="w-10 px-2 py-3"><div className="h-4 w-4 rounded bg-gray-200" /></td>
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className={cn("h-4 rounded bg-gray-200", j === 0 ? "w-32" : j === 1 ? "w-40" : "w-20")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

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
    setActionLoading(userId)
    const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, { accountStatus: newStatus })
      if (error) throw new Error(error)
      await fetchUsers()
    } catch (err: unknown) {
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
          {searchValue && (
            <button onClick={() => { setSearchValue(""); setSearch(""); setPage(1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setActiveFilter(f); setPage(1) }}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeFilter === f ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {USER_TYPE_TABS.map((ut) => (
          <button key={ut} onClick={() => { setUserTypeFilter(ut); setPage(1) }}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all border border-border",
              userTypeFilter === ut ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {USER_TYPE_LABELS[ut] || ut}
          </button>
        ))}
      </div>

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
              {loading ? <SkeletonRows /> : data && data.users.length > 0 ? (
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
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50/30">
            <p className="text-xs text-muted tabular-nums">
              {((data.page - 1) * data.pageSize) + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-muted">...</span>}
                    <button onClick={() => setPage(p)}
                      className={cn("min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                        page === p ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-gray-100")}>
                      {p}
                    </button>
                  </span>
                ))}
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setSelectedUserDetail(null) }}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-xs text-muted">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setSelectedUserDetail(null) }} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
            ) : (
              <>
                <div className="flex border-b border-border">
                  {(["details", "properties", "services"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveDetailTab(tab)}
                      className={cn("flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                        activeDetailTab === tab ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"
                      )}>
                      {tab === "details" ? "Details" : tab === "properties" ? `Properties (${selectedUserDetail?._count?.properties || 0})` : `Services (${selectedUserDetail?._count?.serviceListings || 0})`}
                    </button>
                  ))}
                </div>

                {activeDetailTab === "details" && selectedUserDetail && (
                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: `${selectedUser.firstName} ${selectedUser.lastName}` },
                        { label: "Email", value: selectedUser.email },
                        { label: "Phone", value: selectedUser.phone || "—" },
                        { label: "Status", value: selectedUser.accountStatus === "PENDING_APPROVAL" ? "Pending" : selectedUser.accountStatus },
                        { label: "KYC Status", value: selectedUser.kycStatus },
                        { label: "User Type", value: selectedUser.userTypes?.join(", ") || selectedUser.primaryUserType || "—" },
                        { label: "Category", value: selectedUserDetail.category || selectedUser.category || "—" },
                        { label: "Company", value: selectedUserDetail.companyName || "—" },
                        { label: "Location", value: selectedUserDetail.location || selectedUserDetail.city || "—" },
                        { label: "Joined", value: new Date(selectedUser.createdAt).toLocaleDateString() },
                        { label: "Last Login", value: selectedUserDetail.lastLogin ? new Date(selectedUserDetail.lastLogin).toLocaleDateString() : "—" },
                        { label: "Properties", value: String(selectedUserDetail._count?.properties || 0) },
                        { label: "Service Listings", value: String(selectedUserDetail._count?.serviceListings || 0) },
                      ].map((f) => (
                        <div key={f.label}>
                          <p className="text-xs text-muted">{f.label}</p>
                          <p className="mt-0.5 text-sm font-medium text-foreground">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedUserDetail.aplAgent && (
                      <div className="rounded-lg border border-border bg-primary/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">APL Representative</p>
                        <p className="text-sm font-medium text-foreground">{selectedUserDetail.aplAgent.fullName}</p>
                        <p className="text-xs text-muted">Code: {selectedUserDetail.aplAgent.agentCode} | {selectedUserDetail.aplAgent.phone}</p>
                      </div>
                    )}

                    {selectedUserDetail.kycDocuments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">KYC Documents</p>
                        <div className="space-y-2">
                          {selectedUserDetail.kycDocuments.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">{doc.documentType}</p>
                                {doc.documentNumber && <p className="text-xs text-muted">{doc.documentNumber}</p>}
                              </div>
                              <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", badge[doc.status] || "")}>{doc.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "properties" && selectedUserDetail && (
                  <div className="p-6">
                    {selectedUserDetail.properties?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUserDetail.properties.map((prop: any) => (
                          <div key={prop.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{prop.title}</p>
                              <p className="text-xs text-muted">{prop.propertyType} | {prop.listingPurpose?.replace(/_/g, " ")} | {prop.city || "—"}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge[prop.moderationStatus] || "")}>{prop.moderationStatus}</span>
                              <span className="text-xs text-muted tabular-nums">{prop.price?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted text-center py-8">No properties listed</p>
                    )}
                  </div>
                )}

                {activeDetailTab === "services" && selectedUserDetail && (
                  <div className="p-6">
                    {selectedUserDetail.serviceListings?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUserDetail.serviceListings.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                              <p className="text-xs text-muted">{s.city || "—"}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge[s.moderationStatus] || "")}>{s.moderationStatus}</span>
                              <span className="text-xs text-muted tabular-nums">{s.price?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted text-center py-8">No services listed</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="border-t border-border px-6 py-4">
              <button onClick={() => { setSelectedUser(null); setSelectedUserDetail(null) }} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
