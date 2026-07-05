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
  total: number
  page: number
  totalPages: number
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Read", value: "READ" },
  { label: "Responded", value: "RESPONDED" },
  { label: "Closed", value: "CLOSED" },
]

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  READ: { bg: "bg-blue-100", text: "text-blue-800", label: "Read" },
  RESPONDED: { bg: "bg-green-100", text: "text-green-800", label: "Responded" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-700", label: "Closed" },
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [respondModal, setRespondModal] = useState<{ id: string; name: string; message: string } | null>(null)
  const [respondText, setRespondText] = useState("")
  const [respondSending, setRespondSending] = useState(false)
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
      setTotal(result.total)
      setTotalPages(result.totalPages)
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
          <p className="mt-1 text-sm text-muted">{total} total inquiries</p>
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
                placeholder="Search by name or email..."
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
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <MessageSquare size={40} className="mb-3" />
            <p className="text-sm">No inquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquiries.map((inq) => {
                  const statusStyle = statusConfig[inq.status] || statusConfig.PENDING
                  const isExpanded = expandedId === inq.id
                  return (
                    <tr key={inq.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                            className="rounded p-0.5 text-muted transition-colors hover:bg-gray-200"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span className="text-sm font-medium text-foreground">{inq.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        <a href={`mailto:${inq.email}`} className="hover:text-primary">
                          {inq.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {inq.phone ? (
                          <a href={`tel:${inq.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone size={12} /> {inq.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {inq.property ? (
                          <a
                            href={`https://allpropertylink.com/properties/${inq.property.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            {inq.property.title}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-xs truncate text-sm text-muted">
                          {inq.message}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                        {formatDate(inq.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setRespondModal({ id: inq.id, name: inq.name, message: inq.message })}
                              className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary-50"
                            title="Respond"
                          >
                            <Send size={16} />
                          </button>
                          {inq.status !== "READ" && (
                            <button
                              onClick={() => updateInquiry(inq.id, { status: "READ" })}
                              disabled={actionLoading === inq.id}
                              className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary-50 disabled:opacity-50"
                              title="Mark as Read"
                            >
                              {actionLoading === inq.id ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                            </button>
                          )}
                          {inq.status !== "CLOSED" && (
                            <button
                              onClick={() => updateInquiry(inq.id, { status: "CLOSED" })}
                              disabled={actionLoading === inq.id}
                              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-50"
                              title="Close"
                            >
                              {actionLoading === inq.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {expandedId && (
          <div className="border-t border-border bg-gray-50/50 px-6 py-4">
            {(() => {
              const inq = inquiries.find((i) => i.id === expandedId)
              if (!inq) return null
              return (
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Full Message</h4>
                    <p className="whitespace-pre-wrap rounded-lg bg-white p-4 text-sm text-foreground">{inq.message}</p>
                  </div>
                  {inq.responseMessage && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">Response</h4>
                      <p className="whitespace-pre-wrap rounded-lg bg-green-50 p-4 text-sm text-foreground">{inq.responseMessage}</p>
                    </div>
                  )}
                </div>
              )
            })()}
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

      {respondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-lg font-semibold text-foreground">Respond to {respondModal.name}</h3>
              <button
                onClick={() => { setRespondModal(null); setRespondText("") }}
                className="rounded-lg p-1 text-muted transition-colors hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Original message</p>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-foreground">{respondModal.message}</p>
              </div>
              <div>
                <label htmlFor="response" className="mb-1.5 block text-sm font-medium text-foreground">
                  Your response
                </label>
                <textarea
                  id="response"
                  rows={5}
                  value={respondText}
                  onChange={(e) => setRespondText(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => { setRespondModal(null); setRespondText("") }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={respondSending || !respondText.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
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
