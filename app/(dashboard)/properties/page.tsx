"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import {
  Search, X, ChevronLeft, ChevronRight, Eye, Globe, GlobeOff,
  AlertCircle, Building2, Download, Check, Loader2, MapPin, Home,
  Bed, Bath, User, Mail, Phone, Calendar, DollarSign, Expand,
} from "@/components/ui/icons"

interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Property {
  id: string
  slug: string
  title: string
  price: number
  currency: string
  propertyType: string
  listingPurpose: string | null
  city: string
  moderationStatus: string
  isPublished: boolean
  isFeatured: boolean
  rejectionReason: string | null
  createdAt: string
  agent: Agent | null
}

interface PropertiesResponse {
  properties: Property[]
  pagination: { total: number; page: number; totalPages: number; limit: number }
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  EXPIRED: { bg: "bg-purple-100", text: "text-purple-800", label: "Expired" },
  ARCHIVED: { bg: "bg-gray-200", text: "text-gray-600", label: "Archived" },
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          <td className="w-10 px-2 py-3"><div className="h-4 w-4 rounded bg-gray-200" /></td>
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              {j === 6 ? (
                <div className="mx-auto h-4 w-4 animate-pulse rounded bg-gray-200" />
              ) : j === 7 ? (
                <div className="ml-auto h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
              ) : (
                <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-gray-200" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [purposeFilter, setPurposeFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [propertyDetail, setPropertyDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const limit = 20

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
    fetchProperties()
  }, [fetchProperties])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function openPropertyDetail(prop: Property) {
    setSelectedProperty(prop)
    setPropertyDetail(null)
    setDetailLoading(true)
    try {
      const { data } = await api.get<Record<string, any>>(`/api/admin/properties/${prop.id}`)
      if (data?.property) setPropertyDetail(data.property)
    } catch { }
    setDetailLoading(false)
  }

  function formatPrice(price: number, currency: string, listingPurpose?: string | null) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted">{total} total properties</p>
        </div>
        <a
          href="/api/admin/exports/properties"
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </a>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1">Type:</span>
            {["", "HOUSE", "APARTMENT", "LAND", "COMMERCIAL"].map((t) => (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
                className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
                  typeFilter === t ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
                )}>
                {t || "All"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1">Purpose:</span>
            {["", "FOR_SALE", "FOR_RENT_LONG_TERM", "FOR_RENT_SHORT_TERM"].map((p) => (
              <button key={p} onClick={() => { setPurposeFilter(p); setPage(1) }}
                className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
                  purposeFilter === p ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
                )}>
                {p ? { FOR_SALE: "For Sale", FOR_RENT_LONG_TERM: "Long-term", FOR_RENT_SHORT_TERM: "Short-term / Airbnb" }[p] : "All"}
              </button>
            ))}
          </div>
          <div className="ml-auto">
                <form onSubmit={handleSearch} className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <label htmlFor="search-properties" className="sr-only">Search properties</label>
                  <input
                    id="search-properties"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by title..."
                    className="w-64 rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSearch(""); setPage(1) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                </form>
          </div>
        </div>

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
                <SkeletonRows />
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
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted">{typeLabel(p.propertyType)}</span>
                        {p.listingPurpose && (
                          <span className="ml-1.5 rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {p.listingPurpose === "FOR_RENT_SHORT_TERM" ? "Airbnb" : p.listingPurpose === "FOR_RENT_LONG_TERM" ? "Rent" : "Sale"}
                          </span>
                        )}
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
                            href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://allpropertylink.co.ke"}/properties/${p.slug}`}
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
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50/30">
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
              <span className="ml-2 text-xs text-muted/50">({total} total)</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
                const pageNum = startPage + i
                if (pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "min-w-[32px] rounded-lg px-2 py-1.5 text-sm transition-all",
                      page === pageNum
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
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

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { setSelectedProperty(null); setPropertyDetail(null) }}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 size={20} className="shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">{selectedProperty.title}</h3>
                  <p className="text-xs text-muted">{selectedProperty.city}{selectedProperty.agent ? ` — ${selectedProperty.agent.firstName} ${selectedProperty.agent.lastName}` : ""}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedProperty(null); setPropertyDetail(null) }} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
            ) : propertyDetail ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: <DollarSign size={14} />, label: "Price", value: formatPrice(propertyDetail.price, propertyDetail.currency, propertyDetail.listingPurpose) },
                    { icon: <Home size={14} />, label: "Type", value: typeLabel(propertyDetail.propertyType) },
                    { icon: <MapPin size={14} />, label: "Location", value: [propertyDetail.city, propertyDetail.region].filter(Boolean).join(", ") || "—" },
                    { icon: <Bed size={14} />, label: "Bedrooms", value: propertyDetail.bedrooms != null ? String(propertyDetail.bedrooms) : "—" },
                    { icon: <Bath size={14} />, label: "Bathrooms", value: propertyDetail.bathrooms != null ? String(propertyDetail.bathrooms) : "—" },
                    { icon: <Expand size={14} />, label: "Area", value: propertyDetail.area ? `${propertyDetail.area} sqft` : "—" },
                    { icon: <Globe size={14} />, label: "Published", value: propertyDetail.isPublished ? "Yes" : "No" },
                    { icon: <Calendar size={14} />, label: "Created", value: new Date(propertyDetail.createdAt).toLocaleDateString() },
                    { icon: <Calendar size={14} />, label: "Updated", value: propertyDetail.updatedAt ? new Date(propertyDetail.updatedAt).toLocaleDateString() : "—" },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg bg-gray-50/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted mb-1">{f.icon} {f.label}</div>
                      <p className="text-sm font-medium text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Agent / Owner</p>
                  {propertyDetail.agent ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                        {propertyDetail.agent.firstName?.[0]}{propertyDetail.agent.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{propertyDetail.agent.firstName} {propertyDetail.agent.lastName}</p>
                        <p className="text-xs text-muted">{propertyDetail.agent.email}{propertyDetail.agent.phone ? ` | ${propertyDetail.agent.phone}` : ""}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No agent assigned</p>
                  )}
                </div>

                {propertyDetail.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Images ({propertyDetail.images.length})</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {(typeof propertyDetail.images === "string" ? JSON.parse(propertyDetail.images) : propertyDetail.images).map((img: string, i: number) => (
                        <img key={i} src={img} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted">Failed to load property details</div>
            )}

            <div className="border-t border-border px-6 py-4">
              <button onClick={() => { setSelectedProperty(null); setPropertyDetail(null) }} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
