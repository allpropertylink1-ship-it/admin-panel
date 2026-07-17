"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Search, X, ChevronLeft, ChevronRight, AlertCircle,
  Wrench, Download, Check, XCircle, Clock,
} from "lucide-react"

interface ServiceCategory {
  id: string; name: string; slug: string
}

interface ServiceUser {
  firstName: string; lastName: string; email: string; companyName?: string; userTypes?: string[]
}

interface Service {
  id: string; title: string; description: string
  price: number | null; currency: string; pricePeriod: string
  location: string | null; city: string | null
  status: string; moderationStatus: string
  viewCount: number; rejectionReason: string | null
  reviewedAt: string | null; reviewedBy: string | null
  createdAt: string
  user: ServiceUser | null
  category: ServiceCategory | null
}

interface ServicesResponse {
  services: Service[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

const MODERATION_BADGES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-50 text-gray-600",
}

const USER_TYPE_TABS = ["", "FUNDI", "SERVICE_PROVIDER"]
const USER_TYPE_LABELS: Record<string, string> = { "": "All Types", FUNDI: "Fundis", SERVICE_PROVIDER: "Service Providers" }

function formatPrice(price: number | null, currency: string, period: string) {
  if (price === null) return "—"
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price)
}

function SkeletonRows() {
  return (
    <>
        {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-border">
          <td className="w-10 px-2 py-3"><div className="h-4 w-4 rounded bg-gray-200" /></td>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className={cn("h-4 rounded bg-gray-200", j === 0 ? "w-48" : j === 1 ? "w-24" : j === 5 ? "w-20 ml-auto" : "w-20")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modLoading, setModLoading] = useState<string | null>(null)
  const limit = 20

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (userTypeFilter) params.set("userType", userTypeFilter)
      if (statusFilter) params.set("moderationStatus", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const { data: result, error } = await api.get<ServicesResponse>(`/api/admin/services?${params}`)
      if (error || !result) throw new Error(error || "No data")
      setServices(result.services)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch {
      setError("Failed to load services.")
    } finally {
      setLoading(false)
    }
  }, [search, userTypeFilter, statusFilter, page])

  useEffect(() => { fetchServices() }, [fetchServices])

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1) }

  async function handleModerate(id: string, moderationStatus: string) {
    setModLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/services/${id}/moderate`, { moderationStatus })
      if (error) throw new Error(error)
      await fetchServices()
    } catch {
      setError("Failed to update moderation status")
    } finally {
      setModLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Fundis &amp; Service Providers</h1>
          <p className="mt-1 text-sm text-muted">{total} total service listings</p>
        </div>
        <button className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2" disabled>
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {USER_TYPE_TABS.map((ut) => (
          <button key={ut} onClick={() => { setUserTypeFilter(ut); setPage(1) }}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all border border-border",
              userTypeFilter === ut ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {USER_TYPE_LABELS[ut]}
          </button>
        ))}
        <span className="w-px h-5 bg-border mx-1" />
        {["", "PENDING_REVIEW", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
              statusFilter === s ? "bg-primary text-white border-primary shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {s ? { PENDING_REVIEW: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }[s] : "All Status"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="ml-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search services..." className="w-64 rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </form>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 text-sm text-red-700 bg-error-50">
            <AlertCircle size={16} /> {error}
            <button onClick={fetchServices} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox"
                      disabled
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody><SkeletonRows /></tbody>
            </table>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <Wrench size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No services found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox"
                      checked={services.length > 0 && selectedIds.length === services.length}
                      onChange={() => {
                        if (selectedIds.length === services.length) { setSelectedIds([]) }
                        else { setSelectedIds(services.map(s => s.id)) }
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id} className={cn("transition-colors hover:bg-gray-50/60", selectedIds.includes(s.id) && "bg-primary/5")}>
                    <td className="w-10 px-2 py-3 text-center">
                      <input type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="truncate text-sm font-medium text-foreground" title={s.title}>{s.title}</p>
                        <p className="truncate text-xs text-muted/70 mt-0.5">{s.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{s.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{s.user?.firstName} {s.user?.lastName}</p>
                      <p className="text-xs text-muted">{s.user?.email}</p>
                      {s.user?.userTypes && s.user.userTypes.length > 0 && (
                        <p className="text-[10px] text-primary mt-0.5">{s.user.userTypes.join(", ")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{formatPrice(s.price, s.currency, s.pricePeriod)}</td>
                    <td className="px-4 py-3 text-sm text-muted">{s.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", MODERATION_BADGES[s.moderationStatus] || "")}>
                        {s.moderationStatus === "PENDING_REVIEW" ? "Pending" : s.moderationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.moderationStatus === "PENDING_REVIEW" && (
                          <>
                            <button onClick={() => handleModerate(s.id, "APPROVED")} disabled={modLoading === s.id}
                              className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50" title="Approve">
                              <Check size={16} />
                            </button>
                            <button onClick={() => handleModerate(s.id, "REJECTED")} disabled={modLoading === s.id}
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {s.moderationStatus === "APPROVED" && (
                          <button onClick={() => handleModerate(s.id, "PENDING_REVIEW")} disabled={modLoading === s.id}
                            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50" title="Send back to review">
                            <Clock size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50/30">
            <p className="text-sm text-muted">Page {page} of {totalPages} ({total} total)</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft size={14} /> Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-gray-50 disabled:opacity-50">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        <BulkActionsBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          actions={[
            { label: "Approve", action: "approve" },
            { label: "Reject", action: "reject", variant: "destructive", requiresConfirmation: true },
            { label: "Send Back", action: "pending" },
          ]}
          onAction={async (action) => {
            setLoading(true)
            try {
              const { error } = await api.post("/api/admin/services/bulk", { ids: selectedIds, action })
              if (error) throw new Error(error)
              setSelectedIds([])
              await fetchServices()
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "Bulk action failed")
            } finally {
              setLoading(false)
            }
          }}
          loading={loading}
        />
      </div>
    </div>
  )
}
