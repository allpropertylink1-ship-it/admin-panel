"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  FileText,
  Shield,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface UserInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
}

interface KycDocument {
  id: string
  documentType: string
  documentNumber: string | null
  status: string
  frontImage: string | null
  backImage: string | null
  rejectionReason: string | null
  createdAt: string
  verifiedAt: string | null
  user: UserInfo
}

interface KycResponse {
  documents: KycDocument[]
  total: number
  page: number
  totalPages: number
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
]

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: typeof Shield }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending", icon: Shield },
  VERIFIED: { bg: "bg-green-100", text: "text-green-800", label: "Verified", icon: ShieldCheck },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected", icon: ShieldX },
}

const documentTypeLabels: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's License",
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function KycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectInput, setRejectInput] = useState<{ id: string; reason: string } | null>(null)
  const limit = 20

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filter) params.set("status", filter)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/kyc?${params}`)
      if (!res.ok) throw new Error("Failed to fetch KYC documents")
      const data: KycResponse = await res.json()
      setDocuments(data.documents)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError("Failed to load KYC documents. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  async function updateDocument(id: string, data: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update")
      setRejectInput(null)
      await fetchDocuments()
    } catch {
      setError("Failed to update KYC document.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
          <p className="mt-1 text-sm text-muted">{total} total submissions</p>
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
          <p className="ml-auto text-sm text-muted">
            {documents.length} of {total} shown
          </p>
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
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Shield size={40} className="mb-3" />
            <p className="text-sm">No KYC submissions found</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => {
              const statusStyle = statusConfig[doc.status] || statusConfig.PENDING
              const StatusIcon = statusStyle.icon
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "rounded-xl border p-5 transition-shadow hover:shadow-md",
                    doc.status === "PENDING" ? "border-amber-200 bg-amber-50/30" : "border-border bg-card"
                  )}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {doc.user.avatar ? (
                        <img
                          src={doc.user.avatar}
                          alt={`${doc.user.firstName} ${doc.user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {getInitials(doc.user.firstName, doc.user.lastName)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {doc.user.firstName} {doc.user.lastName}
                        </p>
                        <p className="text-xs text-muted">{doc.user.email}</p>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                      <StatusIcon size={12} />
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText size={14} className="text-muted" />
                      <span className="text-muted">Document:</span>
                      <span className="font-medium text-foreground">
                        {documentTypeLabels[doc.documentType] || doc.documentType}
                      </span>
                    </div>
                    {doc.documentNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted">Number:</span>
                        <span className="font-mono text-xs text-foreground">{doc.documentNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays size={14} className="text-muted" />
                      <span className="text-muted">Submitted:</span>
                      <span className="text-foreground">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {doc.frontImage && (
                    <div className="mb-4 flex gap-2">
                      <a
                        href={doc.frontImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-gray-50"
                      >
                        <ExternalLink size={12} /> Front
                      </a>
                      {doc.backImage && (
                        <a
                          href={doc.backImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-gray-50"
                        >
                          <ExternalLink size={12} /> Back
                        </a>
                      )}
                    </div>
                  )}

                  {doc.rejectionReason && (
                    <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      <span className="font-medium">Reason:</span> {doc.rejectionReason}
                    </div>
                  )}

                  {doc.status === "PENDING" && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <button
                        onClick={() => updateDocument(doc.id, { status: "VERIFIED" })}
                        disabled={actionLoading === doc.id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      {rejectInput?.id === doc.id ? (
                        <div className="flex flex-1 items-center gap-1">
                          <input
                            type="text"
                            value={rejectInput.reason}
                            onChange={(e) => setRejectInput({ ...rejectInput, reason: e.target.value })}
                            placeholder="Rejection reason..."
                            className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateDocument(doc.id, { status: "REJECTED", rejectionReason: rejectInput.reason })
                              }
                              if (e.key === "Escape") setRejectInput(null)
                            }}
                          />
                          <button
                            onClick={() => updateDocument(doc.id, { status: "REJECTED", rejectionReason: rejectInput.reason })}
                            disabled={actionLoading === doc.id || !rejectInput.reason.trim()}
                            className="rounded-lg bg-red-600 p-1.5 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            title="Confirm reject"
                          >
                            {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          </button>
                          <button
                            onClick={() => setRejectInput(null)}
                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-gray-100"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectInput({ id: doc.id, reason: "" })}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
