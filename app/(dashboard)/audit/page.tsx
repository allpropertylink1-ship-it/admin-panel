"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search, Loader2, Filter, RefreshCw,
  AlertCircle, ClipboardList, Download,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  createdAt: string
  user: { firstName: string; lastName: string; email: string | null } | null
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AuditResponse {
  logs: AuditEntry[]
  pagination: PaginationMeta
  actions: string[]
}

const ACTION_OPTIONS = [
  { label: "All", value: "" },
  { label: "CREATE", value: "CREATE" },
  { label: "UPDATE", value: "UPDATE" },
  { label: "DELETE", value: "DELETE" },
  { label: "LOGIN", value: "LOGIN" },
  { label: "LOGOUT", value: "LOGOUT" },
  { label: "SUSPEND", value: "SUSPEND" },
  { label: "ACTIVATE", value: "ACTIVATE" },
  { label: "APPROVE", value: "APPROVE" },
  { label: "REJECT", value: "REJECT" },
]

const actionColor: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  LOGIN: "bg-cyan-50 text-cyan-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  SUSPEND: "bg-orange-50 text-orange-700",
  ACTIVATE: "bg-emerald-50 text-emerald-700",
  APPROVE: "bg-green-50 text-green-700",
  REJECT: "bg-red-50 text-red-700",
}

const auditColumns = [
  { width: "w-24" }, { width: "w-20" }, { width: "w-28" }, { width: "w-16" }, { width: "w-28" },
]

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [page, setPage] = useState(1)

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (actionFilter) params.set("action", actionFilter)
      const { data, error } = await api.get<AuditResponse>(`/api/admin/audit?${params}`)
      if (error) throw new Error(error)
      if (!data) { setEntries([]); return }
      setEntries(data.logs ?? [])
      setMeta(data.pagination)
      if (data.actions) setAvailableActions(data.actions)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit log")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [actionFilter, page])

  useEffect(() => { fetchAudit() }, [fetchAudit])

  function goToPage(p: number) {
    if (p < 1 || p > meta.totalPages) return
    setPage(p)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Audit Log</h1>
          <p className="mt-1 text-sm text-muted">Track all actions performed across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/admin/exports/audit"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-card"
          >
            <Download size={15} />
            Export
          </a>
          <button
            onClick={() => { setPage(1); fetchAudit() }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-gray-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="shrink-0 text-muted" />
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 flex-wrap">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setActionFilter(opt.value); setPage(1) }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    actionFilter === opt.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 text-sm text-red-700 border-b-red-100 bg-error-50">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Entity Type</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">User</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">IP Address</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableSkeleton columns={auditColumns} checkbox={false} />
              </tbody>
            </table>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <ClipboardList size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No audit entries found</p>
            <p className="mt-1 text-xs text-muted">Try a different filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Entity Type</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">User</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">IP Address</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-gray-50/40">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        actionColor[entry.action] || "bg-gray-100 text-gray-600"
                      )}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {entry.entityType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {entry.user
                        ? `${entry.user.firstName} ${entry.user.lastName}`
                        : <span className="text-muted italic">System</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {entry.ipAddress ?? "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <TablePagination page={page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.limit} onPageChange={goToPage} />
        )}
      </div>
    </div>
  )
}