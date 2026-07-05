"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  Globe,
  GlobeOff,
  Star,
  StarOff,
  AlertCircle,
  Loader2,
} from "lucide-react"

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
  total: number
  page: number
  totalPages: number
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
]

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_REVIEW: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  EXPIRED: { bg: "bg-purple-100", text: "text-purple-800", label: "Expired" },
  ARCHIVED: { bg: "bg-gray-200", text: "text-gray-600", label: "Archived" },
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectInput, setRejectInput] = useState<{ id: string; reason: string } | null>(null)
  const limit = 20

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filter) params.set("status", filter)
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const { data: result, error } = await api.get<PropertiesResponse>(`/api/admin/properties?${params}`)
      if (error || !result) throw new Error(error || "No data")
      setProperties(result.properties)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch {
      setError("Failed to load properties. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [filter, search, page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  async function updateProperty(id: string, data: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const { data: _, error } = await api.patch(`/api/admin/properties/${id}`, data)
      if (error) throw new Error("Failed to update")
      setRejectInput(null)
      await fetchProperties()
    } catch {
      setError("Failed to update property.")
    } finally {
      setActionLoading(null)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price)
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
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1) }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title..."
                className="w-64 rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </form>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-b border-border bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <GlobeOff size={40} className="mb-3" />
            <p className="text-sm">No properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
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
                    <tr key={p.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-sm font-medium text-foreground">{p.title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{formatPrice(p.price, p.currency)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{typeLabel(p.propertyType)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{p.city}</td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {p.agent ? `${p.agent.firstName} ${p.agent.lastName}` : "—"}
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
                          <GlobeOff size={16} className="mx-auto text-muted" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.moderationStatus === "PENDING_REVIEW" && (
                            <>
                              <button
                                onClick={() => updateProperty(p.id, { moderationStatus: "APPROVED" })}
                                disabled={actionLoading === p.id}
                                className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                                title="Approve"
                              >
                                {actionLoading === p.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                              </button>
                              {rejectInput?.id === p.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={rejectInput.reason}
                                    onChange={(e) => setRejectInput({ ...rejectInput, reason: e.target.value })}
                                    placeholder="Reason..."
                                    className="w-32 rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        updateProperty(p.id, { moderationStatus: "REJECTED", rejectionReason: rejectInput.reason })
                                      }
                                      if (e.key === "Escape") setRejectInput(null)
                                    }}
                                  />
                                  <button
                                    onClick={() => updateProperty(p.id, { moderationStatus: "REJECTED", rejectionReason: rejectInput.reason })}
                                    disabled={actionLoading === p.id || !rejectInput.reason.trim()}
                                    className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                    title="Confirm reject"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                  <button
                                    onClick={() => setRejectInput(null)}
                                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-gray-100"
                                    title="Cancel"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRejectInput({ id: p.id, reason: "" })}
                                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                            </>
                          )}
                          {p.moderationStatus === "APPROVED" && (
                            <>
                              <button
                                onClick={() => updateProperty(p.id, { isPublished: !p.isPublished })}
                                disabled={actionLoading === p.id}
                                className={cn(
                                  "rounded-lg p-1.5 transition-colors disabled:opacity-50",
                                  p.isPublished ? "text-green-600 hover:bg-green-50" : "text-muted hover:bg-gray-100"
                                )}
                                title={p.isPublished ? "Unpublish" : "Publish"}
                              >
                                {actionLoading === p.id ? <Loader2 size={16} className="animate-spin" /> : p.isPublished ? <Globe size={16} /> : <GlobeOff size={16} />}
                              </button>
                              <button
                                onClick={() => updateProperty(p.id, { isFeatured: !p.isFeatured })}
                                disabled={actionLoading === p.id}
                                className={cn(
                                  "rounded-lg p-1.5 transition-colors disabled:opacity-50",
                                  p.isFeatured ? "text-amber-500 hover:bg-amber-50" : "text-muted hover:bg-gray-100"
                                )}
                                title={p.isFeatured ? "Unfeature" : "Feature"}
                              >
                                {actionLoading === p.id ? <Loader2 size={16} className="animate-spin" /> : p.isFeatured ? <Star size={16} /> : <StarOff size={16} />}
                              </button>
                            </>
                          )}
                          <Link
                            href={`https://allpropertylink.com/properties/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-gray-100"
                            title="View on site"
                          >
                            <Eye size={16} />
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
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} /> Previous
              </button>
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
      </div>
    </div>
  )
}
