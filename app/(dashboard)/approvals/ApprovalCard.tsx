"use client"

import Link from "next/link"
import { cn, isValidUrl } from "@/lib/utils"
import {
  ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle,
  FileText, Building2, MapPin, User, Phone, Mail, Globe,
  ExternalLink, Loader2, BadgeCheck, Search,
} from "@/components/ui/icons"
import type { PendingUser, KycDocument } from "./types"

interface ApprovalCardProps {
  user: PendingUser
  isExpanded: boolean
  actionLoading: string | null
  rejectInput: string | null
  rejectReason: string
  onToggle: (userId: string) => void
  onApprove: (userId: string) => void
  onRejectClick: (userId: string) => void
  onRejectConfirm: (userId: string) => void
  onRejectCancel: () => void
  onRejectReasonChange: (reason: string) => void
}

const docTypeLabel = (type: string) => {
  const map: Record<string, string> = { NATIONAL_ID: "National ID", PASSPORT: "Passport" }
  return map[type] || type
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

export function ApprovalCard({ user, isExpanded, actionLoading, rejectInput, rejectReason, onToggle, onApprove, onRejectClick, onRejectConfirm, onRejectCancel, onRejectReasonChange }: ApprovalCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => onToggle(user.id)}
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
                        <span key={s} className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">{s}</span>
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
                        {doc.documentNumber && <p className="text-xs text-muted">{doc.documentNumber}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        doc.status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" :
                        doc.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {doc.status}
                      </span>
                      <div className="flex gap-2">
                        {doc.frontImage && (
                          isValidUrl(doc.frontImage) ? (
                            <a href={doc.frontImage} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-gray-50">
                              <ExternalLink size={10} /> Front
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted">Invalid URL</span>
                          )
                        )}
                        {doc.backImage && (
                          isValidUrl(doc.backImage) ? (
                            <a href={doc.backImage} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-gray-50">
                              <ExternalLink size={10} /> Back
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted">Invalid URL</span>
                          )
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
                onClick={() => onApprove(user.id)}
                disabled={actionLoading === user.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50"
              >
                {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {actionLoading === user.id ? "Approving..." : "Approve"}
              </button>

              {rejectInput === user.id ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <input type="text" value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/15 w-full sm:w-56"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onRejectConfirm(user.id)
                      if (e.key === "Escape") onRejectCancel()
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => onRejectConfirm(user.id)} disabled={actionLoading === user.id || !rejectReason.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50">
                      {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Reject
                    </button>
                    <button onClick={onRejectCancel}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => onRejectClick(user.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-50 px-5 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-100">
                  <XCircle size={16} />
                  Reject
                </button>
              )}
            </div>

            <Link href={`/users/${user.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-gray-50">
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
}
