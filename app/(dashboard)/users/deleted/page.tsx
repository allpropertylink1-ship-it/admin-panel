"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { Search, X, AlertCircle, Archive, Trash2, Loader2 } from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"
import { PermissionGuard } from "@/components/PermissionGuard"
import { cn } from "@/lib/utils"

interface DeletedUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  deletedAt: string | null
}

interface UsersResponse {
  users: DeletedUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PURGE_WINDOW_DAYS = 30

const deletedUserColumns = [
  { width: "w-40" }, { width: "w-40" }, { width: "w-32" }, { width: "w-32" }, { width: "w-24" },
]

function daysUntilPurge(deletedAt: string | null): number {
  if (!deletedAt) return PURGE_WINDOW_DAYS
  const daysSince = (Date.now() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, PURGE_WINDOW_DAYS - Math.floor(daysSince))
}

export default function DeletedUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [purgeLoading, setPurgeLoading] = useState<string | null>(null)
  const [purgeConfirm, setPurgeConfirm] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const p = new URLSearchParams()
      if (search) p.set("search", search)
      p.set("status", "DELETED")
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
  }, [search, page])

  useEffect(() => { void (async () => { await fetchUsers() })() }, [fetchUsers])

  function handleSearch(v: string) {
    setSearchValue(v)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => { setSearch(v); setPage(1) }, 350))
  }

  async function handlePurge(userId: string) {
    setPurgeConfirm(null)
    setPurgeLoading(userId)
    try {
      const { error } = await api.post(`/api/admin/users/${userId}/purge`)
      if (error) throw new Error(error)
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to purge account")
    } finally {
      setPurgeLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Deleted Accounts</h1>
          <p className="mt-1 text-sm text-muted">{data ? `${data.total} deleted account${data.total !== 1 ? "s" : ""}` : "Loading..."}</p>
        </div>
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
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchUsers} className="underline text-red-700 hover:text-red-800 font-medium text-sm">Retry</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Deleted At</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Days Until Purge</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <TableSkeleton columns={deletedUserColumns} rows={8} /> : data && data.users.length > 0 ? (
                data.users.map((user) => {
                  const days = daysUntilPurge(user.deletedAt)
                  const overdue = days === 0
                  return (
                    <tr key={user.id} className={cn("transition-colors hover:bg-gray-50/40 opacity-60", overdue && "bg-red-50")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                            {user.firstName?.[0] || "?"}{user.lastName?.[0] || "?"}
                          </div>
                          <span className="font-medium text-foreground">{user.firstName || "Deleted"} {user.lastName || "User"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">{user.email || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                        {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        <span className={cn("font-medium", overdue ? "text-error" : "text-muted")}>
                          {days} day{days !== 1 ? "s" : ""}
                        </span>
                        {overdue && <span className="text-[10px] text-red-600 ml-1">(due now)</span>}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <PermissionGuard permission="users" action="write" redirect={false}>
                            <button
                              onClick={() => setPurgeConfirm(user.id)}
                              disabled={purgeLoading === user.id}
                              className={cn("inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors", purgeLoading === user.id && "opacity-50",
                                overdue ? "bg-error text-white hover:bg-red-700 border-error" : "text-error hover:bg-error-50 border-error/30")}
                              title={overdue ? "Purge now (past 30-day window)" : `Purge in ${days} day${days !== 1 ? "s" : ""}`}>
                              {purgeLoading === user.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              {overdue ? "Purge now" : `Purge in ${days}d`}
                            </button>
                          </PermissionGuard>
                          {purgeConfirm === user.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPurgeConfirm(null)}>
                              <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-base font-semibold text-foreground">Purge account?</h3>
                                <p className="mt-2 text-sm text-muted">This permanently removes {user.firstName} {user.lastName} and all associated data. Cannot be undone.</p>
                                <div className="mt-5 flex justify-end gap-3">
                                  <button onClick={() => setPurgeConfirm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">Cancel</button>
                                  <button onClick={() => handlePurge(user.id)} disabled={purgeLoading === user.id}
                                    className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                                    {purgeLoading === user.id ? "Purging..." : "Purge now"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center text-muted">
                      <Archive className="mb-2 opacity-30" size={32} />
                      <p className="text-sm">No deleted accounts found</p>
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
    </div>
  )
}
