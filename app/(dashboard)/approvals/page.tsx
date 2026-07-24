"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle,
  FileText, Building2, MapPin, User, Phone, Mail, Globe, Search,
  ExternalLink, Loader2, ShieldCheck, Ban, BadgeCheck,
} from "@/components/ui/icons"

interface KycDocument {
  id: string
  documentType: string
  documentNumber?: string
  status: string
  frontImage?: string
  backImage?: string
}

interface PendingUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  category?: string
  specialties: string[]
  companyName?: string
  contactPerson?: string
  website?: string
  location?: string
  city?: string
  estateSubLocation?: string

  createdAt: string
  kycDocuments: KycDocument[]
}

const docTypeLabel = (type: string) => {
  const map: Record<string, string> = { NATIONAL_ID: "National ID", PASSPORT: "Passport" }
  return map[type] || type
}

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectInput, setRejectInput] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => { fetchPendingUsers() }, [])

  async function fetchPendingUsers() {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<{ users: PendingUser[] }>("/api/admin/users/pending")
      if (error) throw new Error(error)
      setUsers(data?.users ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId)
    try {
      const { error } = await api.post(`/api/admin/users/${userId}/approve`, {})
      if (error) throw new Error("Failed to approve user")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(userId: string) {
    if (!rejectReason.trim()) return
    setActionLoading(userId)
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, {
        accountStatus: "SUSPENDED",
      })
      if (error) throw new Error("Failed to reject user")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setRejectInput(null)
      setRejectReason("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.category || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Pending Approvals</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} user{users.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 shadow-sm">
          {search ? (
            <>
              <Search size={40} className="mb-3 opacity-30 text-muted" />
              <p className="text-sm text-muted">No users match your search</p>
            </>
          ) : (
            <>
              <BadgeCheck size={40} className="mb-3 text-success" />
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="mt-1 text-xs text-muted">No pending approvals at this time</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => {
            const isExpanded = expanded === user.id
            return (
              <div
                key={user.id}
                className="rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : user.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {user.category && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                        {user.category}
                      </span>
                    )}
                    {user.specialties.length > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/5 text-primary">
                        {user.specialties[0]}
                        {user.specialties.length > 1 && ` +${user.specialties.length - 1}`}
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                    Pending
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="shrink-0 text-muted" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-5 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">User Information</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail icon={User} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
                        <Detail icon={Mail} label="Email" value={user.email} />
                        <Detail icon={Phone} label="Phone" value={user.phone || "\u2014"} />
                        <Detail icon={Building2} label="Role" value={user.role} />
                        <Detail icon={Building2} label="Category" value={user.category || "\u2014"} />
                        {user.specialties.length > 0 && (
                          <div className="flex items-start gap-2.5">
                            <Building2 size={15} className="mt-0.5 shrink-0 text-muted" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted">Specialties</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {user.specialties.map((s) => (
                                  <span key={s} className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Company Details</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail icon={Building2} label="Company" value={user.companyName || "\u2014"} />
                        <Detail icon={User} label="Contact Person" value={user.contactPerson || "\u2014"} />
                        <Detail icon={Globe} label="Website" value={user.website || "\u2014"} />
                        <Detail icon={MapPin} label="Location" value={user.location || "\u2014"} />
                        <Detail icon={MapPin} label="City" value={user.city || "\u2014"} />
                        <Detail icon={MapPin} label="Sub-Location" value={user.estateSubLocation || "\u2014"} />
                      </div>
                    </div>

                    {user.kycDocuments.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                          KYC Documents ({user.kycDocuments.length})
                        </h4>
                        <div className="divide-y divide-border rounded-xl border border-border">
                          {user.kycDocuments.map((doc) => (
                            <div key={doc.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="shrink-0 text-muted" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{docTypeLabel(doc.documentType)}</p>
                                  {doc.documentNumber && (
                                    <p className="text-xs text-muted">{doc.documentNumber}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  doc.status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" :
                                  doc.status === "REJECTED" ? "bg-red-50 text-red-700" :
                                  "bg-amber-50 text-amber-700"
                                )}>
                                  {doc.status}
                                </span>
                                <div className="flex gap-2">
                                  {doc.frontImage && (
                                    <a href={doc.frontImage} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-gray-50">
                                      <ExternalLink size={10} /> Front
                                    </a>
                                  )}
                                  {doc.backImage && (
                                    <a href={doc.backImage} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-gray-50">
                                      <ExternalLink size={10} /> Back
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          {actionLoading === user.id ? "Approving..." : "Approve"}
                        </button>

                        {rejectInput === user.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              className="rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/15 w-full sm:w-56"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleReject(user.id)
                                if (e.key === "Escape") { setRejectInput(null); setRejectReason("") }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id || !rejectReason.trim()}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Reject
                            </button>
                            <button
                              onClick={() => { setRejectInput(null); setRejectReason("") }}
                              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectInput(user.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-50 px-5 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-100"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      )}
                    </div>

                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-gray-50"
                    >
                      <ExternalLink size={16} />
                      Full Profile
                    </Link>
                  </div>

                  <p className="text-xs text-muted">
                    Registered {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  )
}