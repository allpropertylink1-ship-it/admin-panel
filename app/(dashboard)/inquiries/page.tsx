"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  RefreshCw,
  Inbox,
  ExternalLink,
  Eye,
} from "lucide-react"

interface Property {
  id: string
  title: string
  slug: string
}

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  responseMessage: string | null
  createdAt: string
  property: Property | null
}

interface InquiriesResponse {
  inquiries: Inquiry[]
  pagination: { total: number; page: number; totalPages: number; limit: number }
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Read", value: "READ" },
  { label: "Responded", value: "RESPONDED" },
  { label: "Closed", value: "CLOSED" },
]

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Pending" },
  READ: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", label: "Read" },
  RESPONDED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400", label: "Responded" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Closed" },
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="h-4 w-36 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="h-4 w-48 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
          <td className="px-4 py-4"><div className="ml-auto h-4 w-16 rounded bg-gray-200" /></td>
        </tr>
      ))}
    </>
  )
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("")
  const [search, setSearch] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [respondModal, setRespondModal] = useState<{ id: string; name: string; message: string } | null>(null)
  const [respondText, setRespondText] = useState("")
  const [respondSending, setRespondSending] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filter) params.set("status", filter)
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const { data: result, error } = await api.get<InquiriesResponse>(`/api/admin/inquiries?${params}`)
      if (error || !result) throw new Error(error || "No data")
      setInquiries(result.inquiries)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch {
      setError("Failed to load inquiries. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [filter, search, page])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  async function updateInquiry(id: string, data: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const { data: _, error } = await api.patch(`/api/admin/inquiries/${id}`, data)
      if (error) throw new Error("Failed to update")
      await fetchInquiries()
    } catch {
      setError("Failed to update inquiry.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRespond() {
    if (!respondModal || !respondText.trim()) return
    setRespondSending(true)
    try {
      const { data: _, error } = await api.patch(`/api/admin/inquiries/${respondModal.id}`, { status: "RESPONDED", responseMessage: respondText.trim() })
      if (error) throw new Error("Failed to respond")
      setRespondModal(null)
      setRespondText("")
      await fetchInquiries()
    } catch {
      setError("Failed to send response.")
    } finally {
      setRespondSending(false)
    }
  }

  function handleSearchChange(v: string) {
    setSearchValue(v)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => { setSearch(v); setPage(1) }, 350))
  }

  function clearSearch() {
    setSearchValue("")
    setSearch("")
    setPage(1)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...")
      }
    }
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
          <p className="mt-1 text-sm text-muted">{total} total inquiries</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
          {searchValue && (
            <button onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1) }}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter === f.value ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
          <button onClick={fetchInquiries}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 transition-colors">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Inquiry</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Property</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonRows />
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center text-muted">
                      <Inbox className="mb-2 opacity-30" size={40} />
                      <p className="text-sm font-medium">No inquiries found</p>
                      <p className="mt-1 text-xs text-muted/60">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => {
                  const statusStyle = statusConfig[inq.status] || statusConfig.PENDING
                  const isExpanded = expandedId === inq.id
                  return (
                    <tr key={inq.id} className="transition-colors hover:bg-gray-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                            className="rounded p-0.5 text-muted transition-colors hover:bg-gray-200"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span className="font-medium text-foreground">{inq.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${inq.email}`} className="text-xs text-muted hover:text-primary transition-colors">
                          {inq.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-xs text-muted">{inq.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inq.property ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://allpropertylink.co.ke"}/properties/${inq.property.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
                          >
                            <span className="max-w-[120px] truncate">{inq.property.title}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted/50">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">
                        {formatDate(inq.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {inq.status === "PENDING" && (
                            <button
                              onClick={() => updateInquiry(inq.id, { status: "READ" })}
                              disabled={actionLoading === inq.id}
                              className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
                              title="Mark as Read"
                            >
                              {actionLoading === inq.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                            </button>
                          )}
                          {inq.status === "READ" && (
                            <button
                              onClick={() => setRespondModal({ id: inq.id, name: inq.name, message: inq.message })}
                              className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
                              title="Respond"
                            >
                              <Send size={15} />
                            </button>
                          )}
                          {inq.status === "RESPONDED" && (
                            <button
                              onClick={() => updateInquiry(inq.id, { status: "CLOSED" })}
                              disabled={actionLoading === inq.id}
                              className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                              title="Close"
                            >
                              {actionLoading === inq.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            </button>
                          )}
                          {inq.status !== "PENDING" && inq.status !== "READ" && inq.status !== "RESPONDED" && (
                            <span className="text-xs text-muted/40 px-1">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded detail row */}
        {expandedId && !loading && (
          <div className="border-t border-border bg-gray-50/30 px-6 py-4">
            {(() => {
              const inq = inquiries.find((i) => i.id === expandedId)
              if (!inq) return null
              return (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-muted" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Full Message</h4>
                    </div>
                    <p className="whitespace-pre-wrap rounded-lg bg-white border border-border/50 p-4 text-sm text-foreground leading-relaxed">{inq.message}</p>
                  </div>
                  {inq.responseMessage && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Send size={14} className="text-green-500" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600">Response</h4>
                      </div>
                      <p className="whitespace-pre-wrap rounded-lg bg-green-50/70 border border-green-100 p-4 text-sm text-foreground leading-relaxed">{inq.responseMessage}</p>
                    </div>
                  )}
                  {inq.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Phone size={12} />
                      <a href={`tel:${inq.phone}`} className="hover:text-primary transition-colors">{inq.phone}</a>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50/30">
            <p className="text-xs text-muted tabular-nums">
              {((page - 1) * limit) + 1}&ndash;{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((p, idx) =>
                p === "..." ? (
                  <span key={`e-${idx}`} className="px-1 text-xs text-muted">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                      page === p ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-gray-100"
                    )}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {respondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setRespondModal(null); setRespondText("") }}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Send size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Respond to {respondModal.name}</h3>
                  <p className="text-xs text-muted">Send a response to this inquiry</p>
                </div>
              </div>
              <button onClick={() => { setRespondModal(null); setRespondText("") }}
                className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted uppercase tracking-wider">Original message</p>
                <div className="rounded-lg bg-gray-50 border border-border/50 p-3.5">
                  <p className="text-sm text-foreground leading-relaxed">{respondModal.message}</p>
                </div>
              </div>
              <div>
                <label htmlFor="response" className="mb-1.5 block text-xs font-medium text-foreground">
                  Your response
                </label>
                <textarea
                  id="response"
                  rows={5}
                  value={respondText}
                  onChange={(e) => setRespondText(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => { setRespondModal(null); setRespondText("") }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRespond} disabled={respondSending || !respondText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 shadow-sm">
                {respondSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
