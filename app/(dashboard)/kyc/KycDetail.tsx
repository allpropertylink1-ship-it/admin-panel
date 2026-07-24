"use client"

import { useRef } from "react"
import { Shield, AlertCircle, Loader2, CheckCircle, XCircle, RefreshCcw, Clock, User, FileText, ArrowUp, ArrowDown } from "@/components/ui/icons"
import PdfViewer from "@/components/PdfViewer"
import { cn, isValidUrl } from "@/lib/utils"
import { docLabels, timeAgo, fmtDate, initials, ImgWithFallback, Skeleton, EmptyState, StatusBadge, DocStatusBadge } from "./utils"
import type { KycDocument } from "./types"

interface KycDetailProps {
  selectedDoc: KycDocument | null
  userDocs: KycDocument[]
  userDocsLoading: boolean
  actionLoading: string | null
  error: string
  rejectReason: string
  rejectForDoc: string | null
  onUpdateDoc: (id: string, data: Record<string, unknown>) => void
  onRejectReasonChange: (reason: string) => void
  onRejectForDocChange: (docId: string | null) => void
  onOpenLightbox: (images: { src: string; label: string }[], index: number) => void
  onRetry?: () => void
}

export default function KycDetail({
  selectedDoc, userDocs, userDocsLoading, actionLoading, error,
  rejectReason, rejectForDoc, onUpdateDoc, onRejectReasonChange, onRejectForDocChange, onOpenLightbox, onRetry,
}: KycDetailProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!selectedDoc) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto bg-background">
        <EmptyState icon={Shield} title="Select a submission to review"
          description="All documents for that user will appear here"
        />
      </div>
    )
  }

  const pendingUserDocs = userDocs.filter((d) => d.status === "PENDING")

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      {/* User header */}
      <div className="border-b border-border bg-gradient-to-r from-card to-background px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {selectedDoc.user.avatar && isValidUrl(selectedDoc.user.avatar) ? (
              <img src={selectedDoc.user.avatar} alt=""
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/15"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 text-lg font-bold text-primary shadow-sm ring-2 ring-primary/10">
                {initials(selectedDoc.user.firstName, selectedDoc.user.lastName)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {selectedDoc.user.firstName} {selectedDoc.user.lastName}
              </h2>
              <p className="text-sm text-muted">{selectedDoc.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={selectedDoc.user.kycStatus || ""} />
            {pendingUserDocs.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                <Clock size={10} />
                {pendingUserDocs.length} pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-50 px-4 py-3 text-sm text-error">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            {onRetry && (
              <button onClick={onRetry} className="text-sm font-medium text-error underline hover:text-error/80">Retry</button>
            )}
          </div>
        )}

        {userDocsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : userDocs.length === 0 ? (
          <EmptyState icon={Shield} title="No documents found"
            description="This user has not submitted any KYC documents yet"
          />
        ) : (
          userDocs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Document header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">
                    {docLabels[doc.documentType] || doc.documentType}
                  </h3>
                  <span className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>
                  <DocStatusBadge status={doc.status} />
                </div>
                <div className="text-xs text-muted">
                  Submitted <span className="font-medium text-foreground">{timeAgo(doc.createdAt)}</span>
                </div>
              </div>

              {/* Document images */}
              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                {doc.frontImage ? (
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-[11px] font-semibold text-muted uppercase tracking-widest">
                      Front Image
                    </label>
                    {isValidUrl(doc.frontImage) ? (
                      doc.frontImage.match(/\.pdf/i) ? (
                        <PdfViewer url={doc.frontImage} filename={`${docLabels[doc.documentType] || doc.documentType} \u2014 Front`} compact />
                      ) : (
                        <button onClick={() => onOpenLightbox([{ src: doc.frontImage!, label: `${docLabels[doc.documentType] || doc.documentType} \u2014 ${selectedDoc.user.firstName} ${selectedDoc.user.lastName}` }], 0)}
                          className="group relative overflow-hidden rounded-lg border border-border bg-white transition-all hover:shadow-md active:scale-[0.99]"
                        >
                          <ImgWithFallback src={doc.frontImage} alt={doc.documentType}
                            className="h-52 w-full object-contain p-2"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
                            <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              Click to zoom
                            </span>
                          </div>
                        </button>
                      )
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-error/50 bg-error-5 py-14 text-xs text-error">
                        Invalid image URL
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <label className="mb-2 text-[11px] font-semibold text-muted uppercase tracking-widest">Front Image</label>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-card py-14 text-xs text-muted">
                      No front image provided
                    </div>
                  </div>
                )}

                {doc.backImage ? (
                  <div className="flex flex-col">
                    <label className="mb-2 text-[11px] font-semibold text-muted uppercase tracking-widest">Back Image</label>
                    {isValidUrl(doc.backImage) ? (
                      doc.backImage.match(/\.pdf/i) ? (
                        <PdfViewer url={doc.backImage} filename={`${docLabels[doc.documentType] || doc.documentType} \u2014 Back`} compact />
                      ) : (
                        <button onClick={() => onOpenLightbox([{ src: doc.backImage!, label: `Back \u2014 ${docLabels[doc.documentType] || doc.documentType}` }], 0)}
                          className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md active:scale-[0.99]"
                        >
                          <img src={doc.backImage} alt="Back"
                            className="h-52 w-full object-contain p-2"
                            onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.parentElement!.querySelector(".fallback")?.classList.remove("hidden") }}
                          />
                          <ImgWithFallback src="" alt="Back" className="hidden fallback absolute inset-0 h-full w-full" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
                            <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              Click to zoom
                            </span>
                          </div>
                        </button>
                      )
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-error/50 bg-error-5 py-14 text-xs text-error">
                        Invalid image URL
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <label className="mb-2 text-[11px] font-semibold text-muted uppercase tracking-widest">Back Image</label>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-card py-14 text-xs text-muted/60">
                      No back image provided
                    </div>
                  </div>
                )}
              </div>

              {/* Business Permit PDF */}
              {doc.businessPermit && (
                <div className="border-t border-border px-5 py-4">
                  <label className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-muted uppercase tracking-widest">
                    <span className="rounded-full bg-warning/10 p-1"><FileText size={12} className="text-warning" /></span>
                    Business Permit
                    <span className="font-normal normal-case text-muted/60">(Optional)</span>
                  </label>
                  {isValidUrl(doc.businessPermit) ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-warning/5 px-4 py-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10">
                        <FileText size={20} className="text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">Business Permit Document</p>
                        <p className="text-xs text-muted">Uploaded as PDF</p>
                      </div>
                      <PdfViewer url={doc.businessPermit} filename={`Business Permit \u2014 ${selectedDoc.user.firstName} ${selectedDoc.user.lastName}`} compact />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-error/50 bg-error-5 px-4 py-3">
                      <span className="text-xs text-error">Invalid document URL</span>
                    </div>
                  )}
                </div>
              )}

              {/* Document info */}
              <div className="border-t border-border px-5 py-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                  <div>
                    <span className="text-muted">Type:</span>
                    <span className="ml-1.5 font-medium text-foreground">{docLabels[doc.documentType] || doc.documentType}</span>
                  </div>
                  {doc.documentNumber && (
                    <div>
                      <span className="text-muted">Number:</span>
                      <span className="ml-1.5 font-mono text-xs font-medium text-foreground">{doc.documentNumber}</span>
                    </div>
                  )}
                  {doc.verifiedAt && (
                    <div>
                      <span className="text-muted">Reviewed:</span>
                      <span className="ml-1.5 font-medium text-foreground">{fmtDate(doc.verifiedAt)}</span>
                    </div>
                  )}
                </div>
                {doc.rejectionReason && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-error-50 px-3 py-2 text-xs text-error">
                    <XCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span><span className="font-medium">Rejected:</span> {doc.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* Bio data */}
              {doc.bioData && (
                <div className="border-t border-border px-5 py-3">
                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted uppercase tracking-widest">
                    <User size={11} />
                    Identity Details
                  </label>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-muted">First Name:</span>
                      <span className="ml-1.5 font-medium text-foreground">{doc.bioData.firstName || "\u2014"}</span>
                    </div>
                    <div>
                      <span className="text-muted">Middle Name:</span>
                      <span className="ml-1.5 font-medium text-foreground">{doc.bioData.middleName || "\u2014"}</span>
                    </div>
                    <div>
                      <span className="text-muted">Last Name:</span>
                      <span className="ml-1.5 font-medium text-foreground">{doc.bioData.lastName || "\u2014"}</span>
                    </div>
                    <div>
                      <span className="text-muted">Phone:</span>
                      <span className="ml-1.5 font-medium text-foreground">{doc.bioData.phone || "\u2014"}</span>
                    </div>
                    <div>
                      <span className="text-muted">Email:</span>
                      <span className="ml-1.5 font-medium text-foreground">{doc.bioData.email || "\u2014"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-border px-5 py-3">
                {doc.status === "PENDING" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onUpdateDoc(doc.id, { status: "VERIFIED" })}
                      disabled={actionLoading === doc.id}
                      className="flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-success/90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </button>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        ref={rejectForDoc === doc.id ? inputRef : undefined}
                        value={rejectForDoc === doc.id ? rejectReason : ""}
                        onChange={(e) => onRejectReasonChange(e.target.value)}
                        onFocus={() => onRejectForDocChange(doc.id)}
                        placeholder="Rejection reason..."
                        className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 py-2 text-xs placeholder:text-muted/60 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/15"
                        onKeyDown={(e) => { if (e.key === "Enter") onUpdateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" }) }}
                      />
                      <button
                        onClick={() => onUpdateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" })}
                        disabled={actionLoading === doc.id}
                        className="flex items-center gap-1.5 rounded-xl bg-error px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-error/90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                      >
                        {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {doc.status === "VERIFIED" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onUpdateDoc(doc.id, { status: "PENDING" })}
                      disabled={actionLoading === doc.id}
                      className="flex items-center gap-1.5 rounded-xl bg-warning px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-warning/90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                      Unverify
                    </button>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        value={rejectForDoc === doc.id ? rejectReason : ""}
                        onChange={(e) => onRejectReasonChange(e.target.value)}
                        onFocus={() => onRejectForDocChange(doc.id)}
                        placeholder="Reason for unverifying (optional)..."
                        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs placeholder:text-muted/60 focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/15"
                        onKeyDown={(e) => { if (e.key === "Enter") onUpdateDoc(doc.id, { status: "PENDING", rejectionReason: rejectReason || undefined }) }}
                      />
                    </div>
                  </div>
                )}

                {doc.status === "REJECTED" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onUpdateDoc(doc.id, { status: "PENDING", rejectionReason: undefined })}
                      disabled={actionLoading === doc.id}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                      Re-open for Resubmission
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className={cn("flex items-center gap-2 border-t border-border bg-card/50 px-4 py-2.5 text-[11px] text-muted", userDocs.length === 0 && !userDocsLoading && "hidden")}>
        <span className="font-medium text-foreground/60">Shortcuts:</span>
        <kbd className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
          <ArrowUp size={10} /> <span>or</span> <span className="font-sans uppercase">P</span>
        </kbd>
        <kbd className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
          <ArrowDown size={10} /> <span>or</span> <span className="font-sans uppercase">N</span>
        </kbd>
        <span>Navigate users</span>
      </div>
    </div>
  )
}
