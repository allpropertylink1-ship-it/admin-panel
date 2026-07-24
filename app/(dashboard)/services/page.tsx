"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Search, X, AlertCircle,
  Wrench, Download, Check, XCircle, Clock, Eye, Loader2,
  MapPin, User, Mail, Phone, Calendar, DollarSign,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"

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

const serviceColumns = [
  { width: "w-48" }, { width: "w-24" }, { width: "w-28" }, { width: "w-20" }, { width: "w-20" }, { width: "w-20" }, { width: "w-24" },
]

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
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceDetail, setServiceDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
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

  async function openServiceDetail(svc: Service) {
    setSelectedService(svc)
    setServiceDetail(null)
    setDetailLoading(true)
    try {
      const { data } = await api.get<Record<string, any>>(`/api/admin/services/${svc.id}`)
      if (data?.service) setServiceDetail(data.service)
    } catch { }
    setDetailLoading(false)
  }

  async function handleModerate(id: string, moderationStatus: string) {
    const prev = services.map(s => ({ ...s }))
    setServices(cur => cur.map(s => s.id === id ? { ...s, moderationStatus } : s))
    setModLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/services/${id}/moderate`, { moderationStatus })
      if (error) throw new Error(error)
    } catch {
      setServices(prev)
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
              <tbody><TableSkeleton columns={serviceColumns} /></tbody>
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
                  <tr key={s.id} onClick={() => openServiceDetail(s)}
                    className={cn("cursor-pointer transition-colors hover:bg-gray-50/60", selectedIds.includes(s.id) && "bg-primary/5")}>
                    <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openServiceDetail(s)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors">
                          <Eye size={13} />
                          View
                        </button>
                        {s.moderationStatus === "PENDING_REVIEW" && (
                          <>
                            <button onClick={() => handleModerate(s.id, "APPROVED")} disabled={modLoading === s.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors disabled:opacity-50">
                              <Check size={13} />
                              Approve
                            </button>
                            <button onClick={() => handleModerate(s.id, "REJECTED")} disabled={modLoading === s.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50">
                              <XCircle size={13} />
                              Reject
                            </button>
                          </>
                        )}
                        {s.moderationStatus === "APPROVED" && (
                          <button onClick={() => handleModerate(s.id, "PENDING_REVIEW")} disabled={modLoading === s.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10 transition-colors disabled:opacity-50">
                            <Clock size={13} />
                            Unapprove
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
          <TablePagination page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={setPage} />
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

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { setSelectedService(null); setServiceDetail(null) }}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Wrench size={20} className="shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">{selectedService.title}</h3>
                  <p className="text-xs text-muted">{selectedService.category?.name || ""}{selectedService.city ? ` — ${selectedService.city}` : ""}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedService(null); setServiceDetail(null) }} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
            ) : serviceDetail ? (
              <div className="p-6 space-y-6">
                {serviceDetail.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Description</p>
                    <p className="text-sm text-foreground">{serviceDetail.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: <DollarSign size={14} />, label: "Price", value: serviceDetail.price ? formatPrice(serviceDetail.price, serviceDetail.currency, serviceDetail.pricePeriod) : "—" },
                    { icon: <MapPin size={14} />, label: "Location", value: [serviceDetail.city, serviceDetail.region, serviceDetail.location].filter(Boolean).join(", ") || "—" },
                    { icon: <Wrench size={14} />, label: "Category", value: serviceDetail.category?.name || "—" },
                    { icon: <Check size={14} />, label: "Status", value: serviceDetail.moderationStatus === "PENDING_REVIEW" ? "Pending" : serviceDetail.moderationStatus },
                    { icon: <Calendar size={14} />, label: "Created", value: new Date(serviceDetail.createdAt).toLocaleDateString() },
                    { icon: <Eye size={14} />, label: "Views", value: String(serviceDetail.viewCount ?? 0) },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg bg-gray-50/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted mb-1">{f.icon} {f.label}</div>
                      <p className="text-sm font-medium text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Provider</p>
                  {serviceDetail.user ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                        {serviceDetail.user.firstName?.[0]}{serviceDetail.user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{serviceDetail.user.firstName} {serviceDetail.user.lastName}</p>
                        <p className="text-xs text-muted">{serviceDetail.user.email}{serviceDetail.user.phone ? ` | ${serviceDetail.user.phone}` : ""}</p>
                        {serviceDetail.user.companyName && <p className="text-xs text-primary">{serviceDetail.user.companyName}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No provider info</p>
                  )}
                </div>

                {serviceDetail.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Images ({serviceDetail.images.length})</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {(typeof serviceDetail.images === "string" ? JSON.parse(serviceDetail.images) : serviceDetail.images).map((img: string, i: number) => (
                        <img key={i} src={img} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted">Failed to load service details</div>
            )}

            <div className="border-t border-border px-6 py-4">
              <button onClick={() => { setSelectedService(null); setServiceDetail(null) }} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
