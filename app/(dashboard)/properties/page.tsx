"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Eye, Globe, GlobeOff,
  AlertCircle, Building2, Download,
} from "@/components/ui/icons"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { TablePagination } from "@/components/shared/TablePagination"
import { PropertyFilters } from "./PropertyFilters"
import { PropertyModal } from "./PropertyModal"
import type { Property, PropertiesResponse } from "./types"

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  EXPIRED: { bg: "bg-purple-100", text: "text-purple-800", label: "Expired" },
  ARCHIVED: { bg: "bg-gray-200", text: "text-gray-600", label: "Archived" },
}

const purposeTabs = [
  { key: "ALL", label: "All", purpose: "", type: "" },
  { key: "FOR_SALE", label: "For Sale", purpose: "FOR_SALE", type: "" },
  { key: "FOR_RENT_LONG_TERM", label: "For Rent", purpose: "FOR_RENT_LONG_TERM", type: "" },
  { key: "FOR_RENT_SHORT_TERM", label: "Airbnbs", purpose: "FOR_RENT_SHORT_TERM", type: "" },
  { key: "LAND", label: "Land", purpose: "", type: "LAND" },
] as const

const propertyColumns = [
  { width: "w-48" }, { width: "w-24" }, { width: "w-20" }, { width: "w-24" }, { width: "w-28" }, { width: "w-20" }, { width: "w-12" }, { width: "w-24" },
]

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [purposeFilter, setPurposeFilter] = useState("")
  const [activeTab, setActiveTab] = useState<typeof purposeTabs[number]["key"]>("ALL")
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const limit = 20

  const fetchTabCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {}
      await Promise.all(
        purposeTabs.map(async (tab) => {
          const params = new URLSearchParams()
          params.set("limit", "1")
          if (tab.purpose) params.set("listingPurpose", tab.purpose)
          if (tab.type) params.set("type", tab.type)
          const { data } = await api.get<PropertiesResponse>(`/api/admin/properties?${params}`)
          counts[tab.key] = data?.pagination?.total || 0
        })
      )
      setTabCounts(counts)
    } catch {
      // ignore count errors
    }
  }, [])

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter) params.set("type", typeFilter)
      if (purposeFilter) params.set("listingPurpose", purposeFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const { data: result, error } = await api.get<PropertiesResponse>(`/api/admin/properties?${params}`)
      if (error || !result) throw new Error(error || "No data")
      setProperties(result.properties)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch {
      setError("Failed to load properties. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, purposeFilter, page])

  useEffect(() => {
    void (async () => { await fetchProperties() })()
  }, [fetchProperties])

  useEffect(() => {
    setTimeout(() => { void fetchTabCounts() }, 0)
  }, [fetchTabCounts])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function handleTabChange(tabKey: typeof purposeTabs[number]["key"]) {
    setActiveTab(tabKey)
    const tab = purposeTabs.find(t => t.key === tabKey)
    if (tab) {
      setPurposeFilter(tab.purpose)
      setTypeFilter(tab.type)
      setPage(1)
    }
  }

  function openPropertyDetail(prop: Property) {
    setSelectedProperty(prop)
  }

  function formatPrice(price: number | null, currency: string, listingPurpose?: string | null) {
    if (price == null) return "Price on request"
    const formatted = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price)
    if (listingPurpose === "FOR_RENT_SHORT_TERM") return `${formatted}/night`
    if (listingPurpose === "FOR_RENT_LONG_TERM") return `${formatted}/month`
    return formatted
  }

  function typeLabel(type: string) {
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  function purposeBadge(purpose: string | null | undefined) {
    if (!purpose) return null
    return (
      <span className="ml-1.5 rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
        {purpose === "FOR_RENT_SHORT_TERM" ? "Airbnb" : purpose === "FOR_RENT_LONG_TERM" ? "Rent" : "Sale"}
      </span>
    )
  }

  function landBadge(type: string) {
    if (type !== "LAND") return null
    return (
      <span className="ml-1.5 rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
        Land & Plots
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted">{total} total properties</p>
        </div>
        <button
          type="button"
          onClick={() => { window.location.href = "/api/admin/exports/properties" }}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Purpose Tabs with Counts */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1">
        {purposeTabs.map((tab) => (
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

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <PropertyFilters
          typeFilter={typeFilter}
          purposeFilter={purposeFilter}
          searchInput={searchInput}
          onTypeChange={(t) => { setTypeFilter(t); setPage(1) }}
          onPurposeChange={(p) => { setPurposeFilter(p); setPage(1) }}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onClearSearch={() => { setSearchInput(""); setSearch(""); setPage(1) }}
        />

        {error && (
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 text-sm text-red-700 border-b-red-100 bg-error-50">
            <AlertCircle size={16} />
            {error}
            <button
              onClick={fetchProperties}
              className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted">Published</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableSkeleton columns={propertyColumns} />
              </tbody>
            </table>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Building2 size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No properties found</p>
            <p className="mt-1 text-xs text-muted/60">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox"
                      checked={properties.length > 0 && selectedIds.length === properties.length}
                      onChange={() => {
                        if (selectedIds.length === properties.length) { setSelectedIds([]) }
                        else { setSelectedIds(properties.map(p => p.id)) }
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted">Published</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((p) => {
                  const statusStyle = statusConfig[p.moderationStatus] || statusConfig.DRAFT
                  return (
                    <tr key={p.id} onClick={() => openPropertyDetail(p)}
                      className={cn("cursor-pointer transition-colors hover:bg-gray-50/60", selectedIds.includes(p.id) && "bg-primary/5")}>
                      <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-sm font-medium text-foreground" title={p.title}>{p.title}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{formatPrice(p.price, p.currency, p.listingPurpose)}</td>
                      <td className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-muted">{typeLabel(p.propertyType)}</span>
                        {purposeBadge(p.listingPurpose)}
                        {landBadge(p.propertyType)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{p.city}</td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {p.agent ? `${p.agent.firstName} ${p.agent.lastName}` : <span className="italic text-muted/50">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.isPublished ? (
                        <Globe size={16} className="mx-auto text-green-600" />
                      ) : (
                        <GlobeOff size={16} className="mx-auto text-muted/50" />
                      )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openPropertyDetail(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors">
                            <Eye size={13} />
                            View
                          </button>
                          <Link
                            href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://allpropertylink.co.ke"}/properties/${encodeURIComponent((p.city || "kenya").toLowerCase())}/${p.slug}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
                            <Globe size={13} />
                            Site
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
            { label: "Delete", action: "delete", variant: "destructive", requiresConfirmation: true },
            { label: "Approve", action: "approve", requiresConfirmation: true },
            { label: "Reject", action: "reject", variant: "destructive", requiresConfirmation: true },
            { label: "Publish", action: "publish" },
            { label: "Unpublish", action: "unpublish" },
          ]}
          onAction={async (action) => {
            setLoading(true)
            try {
              const { error } = await api.post("/api/admin/properties/bulk", { ids: selectedIds, action })
              if (error) throw new Error(error)
              setSelectedIds([])
              await fetchProperties()
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "Bulk action failed")
            } finally {
              setLoading(false)
            }
          }}
          loading={loading}
        />
      </div>

      <PropertyModal
        property={selectedProperty}
        open={selectedProperty !== null}
        onClose={() => { setSelectedProperty(null) }}
      />
    </div>
  )
}
