"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Search, X, AlertCircle, Archive, ChevronLeft, ChevronRight, Loader2 } from "@/components/ui/icons"

interface User {
  id: string; firstName: string; lastName: string; email: string; phone?: string
  deletedAt: string
}

interface UsersResponse {
  users: User[]; total: number; page: number; pageSize: number; totalPages: number
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className={cn("h-4 rounded bg-gray-200", j === 0 ? "w-32" : j === 1 ? "w-40" : j === 2 ? "w-28" : "w-24")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function DeletedUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function handleSearch(v: string) {
    setSearchValue(v)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => { setSearch(v); setPage(1) }, 350))
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
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Phone</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Deleted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <SkeletonRows /> : data && data.users.length > 0 ? (
                data.users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50/40 opacity-60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                          {user.firstName?.[0] || "?"}{user.lastName?.[0] || "?"}
                        </div>
                        <span className="font-medium text-foreground">{user.firstName || "Deleted"} {user.lastName || "User"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{user.email || "—"}</td>
                    <td className="px-4 py-3 text-muted text-xs">{user.phone || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                      {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
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
    </div>
  )
}
