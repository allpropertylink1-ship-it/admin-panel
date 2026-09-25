"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  AlertCircle, Download, Check, XCircle, Clock, Eye, Wrench,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"
import { ServiceFilters } from "./ServiceFilters"
import { ServiceModal } from "./ServiceModal"
import type { ServiceListing, ServicesResponse } from "./types"

const MODERATION_BADGES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-50 text-gray-600",
}

const providerTabs = [
  { key: "ALL", label: "All", userType: "" },
  { key: "FUNDI", label: "Fundis", userType: "FUNDI" },
  { key: "SERVICE_PROVIDER", label: "Service Providers", userType: "SERVICE_PROVIDER" },
] as const

function formatPrice(price: number | null, currency: string) {
  if (price === null) return "\u2014"
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price)
}

const serviceColumns = [
  { width: "w-48" }, { width: "w-24" }, { width: "w-28" }, { width: "w-20" }, { width: "w-20" }, { width: "w-20" }, { width: "w-24" },
]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceListing[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [activeTab, setActiveTab] = useState<typeof providerTabs[number]["key"]>("ALL")
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modLoading, setModLoading] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null)
  const limit = 20

  const fetchTabCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {}
      await Promise.all(
        providerTabs.map(async (tab) => {
          const params = new URLSearchParams()
          params.set("limit", "1")
          if (tab.userType) params.set("userType", tab.userType)
          const { data } = await api.get<ServicesResponse>(`/api/admin/services?${params}`)
          counts[tab.key] = data?.pagination?.total || 0
        })
      )
      setTabCounts(counts)
    } catch {
      // ignore count errors
    }
  }, [])

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

  useEffect(() => { void (async () => { await fetchServices() })() }, [fetchServices])

  useEffect(() => {
    setTimeout(() => { void fetchTabCounts() }, 0)
  }, [fetchTabCounts])

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1) }

  function handleTabChange(tabKey: typeof providerTabs[number]["key"]) {
    setActiveTab(tabKey)
    const tab = providerTabs.find(t => t.key === tabKey)
    if (tab) {
      setUserTypeFilter(tab.userType)
      setPage(1)
    }
  }

  function openServiceDetail(svc: ServiceListing) {
    setSelectedService(svc)
  }

  function providerBadge(userTypes: string[] | null | undefined) {
    if (!userTypes || userTypes.length === 0) return null
    const isFundi = userTypes.includes("FUNDI")
    const isProvider = userTypes.includes("SERVICE_PROVIDER")
    if (isFundi && isProvider) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
          Fundi & Provider
        </span>
      )
    }
    if (isFundi) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
          Fundi
        </span>
      )
    }
    if (isProvider) {
      return (
        <span className="inline-flex items-center rounded-full bg-green/10 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
          Provider
        </span>
      )
    }
    return null
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Fundis & Service Providers</h1>
          <p className="mt-1 text-sm text-muted">{total} total service listings</p>
        </div>
        <button className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2" disabled>
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Provider Tabs with Counts */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1">
        {providerTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "touch-target flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border border-border",
              activeTab === tab.key
                ? "bg-accent text-white border-accent shadow-sm"
                : "text-muted hover:text-foreground hover:border-primary/30"
            )}
          >
            <span>{tab.label}</span>
            {tabCounts[tab.key] !== undefined && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-muted/10 text-muted"
              )}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <ServiceFilters
        userTypeFilter={userTypeFilter}
        statusFilter={statusFilter}
        searchInput={searchInput}
        onUserTypeChange={(ut) => { setUserTypeFilter(ut); setPage(1) }}
        onStatusChange={(s) => { setStatusFilter(s); setPage(1) }}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onClearSearch={() => { setSearchInput(""); setSearch(""); setPage(1) }}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">

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
                      {providerBadge(s.user?.userTypes)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{formatPrice(s.price, s.currency)}</td>
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

      <ServiceModal
        service={selectedService}
        open={selectedService !== null}
        onClose={() => { setSelectedService(null) }}
      />
    </div>
  )
}