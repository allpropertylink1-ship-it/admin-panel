"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  GlobeOff,
  AlertCircle,
  Building2,
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const limit = 20

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
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
  }, [search, page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

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

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
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
                    <tr key={p.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-sm font-medium text-foreground" title={p.title}>{p.title}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{formatPrice(p.price, p.currency)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{typeLabel(p.propertyType)}</td>
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://allpropertylink.co.ke"}/properties/${p.slug}`}
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
      </div>
    </div>
  )
}
