"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Shield, ShieldCheck, ShieldX, AlertCircle, Loader2,
  Search, CheckCircle, XCircle, Clock, FileText, RefreshCcw, ImageIcon,
} from "lucide-react"
import ImageLightbox from "@/components/ImageLightbox"
import PdfViewer from "@/components/PdfViewer"
import { resolvePdfUrl } from "@/lib/pdf-utils"

interface UserInfo {
  id: string; firstName: string; lastName: string; email: string; avatar: string | null; kycStatus?: string
}

interface KycDocument {
  id: string; documentType: string; documentNumber: string | null
  status: string; frontImage: string | null; backImage: string | null
  rejectionReason: string | null; createdAt: string; verifiedAt: string | null
  user: UserInfo
}

interface KycResponse {
  documents: KycDocument[]; total: number; page: number; totalPages: number
}

interface UserDocsResponse {
  documents: KycDocument[]; total: number
}

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
]

const statusCfg: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  VERIFIED: { bg: "bg-green-100", text: "text-green-800", label: "Verified" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
}

const docLabels: Record<string, string> = {
  NATIONAL_ID: "National ID", PASSPORT: "Passport", DRIVERS_LICENSE: "Driver's License",
  BUSINESS_PERMIT: "Business Permit", BUSINESS_REGISTRATION: "Business Registration", KRA_PIN: "KRA PIN",
}

const coreDocTypes = ["NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT"]

function initials(fn: string, ln: string) { return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function ImgWithFallback({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 text-muted", className)} style={style}>
        <ImageIcon size={20} />
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} />
}

export default function KycPage() {
  const [docs, setDocs] = useState<KycDocument[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("PENDING")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null)
  const [userDocs, setUserDocs] = useState<KycDocument[]>([])
  const [userDocsLoading, setUserDocsLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectForDoc, setRejectForDoc] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ images: { src: string; label: string }[]; index: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const p = new URLSearchParams()
      if (filter) p.set("status", filter)
      p.set("page", String(page))
      p.set("limit", "50")
      const { data: r, error } = await api.get<KycResponse>(`/api/admin/kyc?${p}`)
      if (error || !r) throw new Error(error || "No data")
      setDocs(r.documents)
      setTotal(r.total)
      setTotalPages(r.totalPages)
      if (r.documents.length > 0) {
        if (!selectedDoc || !r.documents.find((d) => d.id === selectedDoc.id)) {
          setSelectedDoc(r.documents[0])
        }
      } else { setSelectedDoc(null); setUserDocs([]) }
    } catch { setError("Failed to load KYC documents.") }
    finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // When selectedDoc changes, fetch ALL docs for that user
  useEffect(() => {
    if (!selectedDoc) { setUserDocs([]); return }
    setUserDocsLoading(true)
    api.get<UserDocsResponse>(`/api/admin/kyc/user/${selectedDoc.user.id}`)
      .then(({ data, error }) => {
        if (error || !data) return
        setUserDocs(data.documents)
      })
      .catch(() => {})
      .finally(() => setUserDocsLoading(false))
  }, [selectedDoc?.id])

  const updateDoc = useCallback(async (id: string, data: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/kyc/${id}`, data)
      if (error) throw new Error(error)
      setRejectReason("")
      setRejectForDoc(null)
      setError("")
      await fetchDocs()
      // Re-fetch user docs
      if (selectedDoc) {
        const r = await api.get<UserDocsResponse>(`/api/admin/kyc/user/${selectedDoc.user.id}`)
        if (r.data) setUserDocs(r.data.documents)
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update KYC document.") }
    finally { setActionLoading(null) }
  }, [fetchDocs, selectedDoc])

  const filtered = docs.filter((d) =>
    !search || `${d.user.firstName} ${d.user.lastName} ${d.user.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const selIdx = selectedDoc ? filtered.findIndex((d) => d.id === selectedDoc.id) : -1

  const navigate = useCallback((dir: number) => {
    const i = selIdx + dir
    if (i >= 0 && i < filtered.length) {
      setSelectedDoc(filtered[i])
      setRejectReason("")
      setRejectForDoc(null)
      if (listRef.current) {
        const el = listRef.current.children[i] as HTMLElement
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selIdx, filtered])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") { (e.target as HTMLElement).blur(); return }
        return
      }
      if (e.key === "ArrowDown" || e.key === "n" || e.key === "N") navigate(1)
      else if (e.key === "ArrowUp" || e.key === "p" || e.key === "P") navigate(-1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate, lightbox])

  const openLightbox = (images: { src: string; label: string }[], index: number) => {
    if (images.length === 0) return
    if (images[index]?.src.match(/\.pdf/i)) {
      window.open(resolvePdfUrl(images[index].src), "_blank", "noopener,noreferrer")
      return
    }
    setLightbox({ images, index })
  }

  const pendingUserDocs = userDocs.filter((d) => d.status === "PENDING")

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0">
      {lightbox && <ImageLightbox {...lightbox} onClose={() => setLightbox(null)} />}

      {/* Left panel */}
      <div className="flex w-[420px] flex-shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">KYC Verification</h1>
              <p className="text-xs text-muted">{total} total · {docs.filter((d) => d.status === "PENDING").length} pending</p>
            </div>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1) }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.value ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <Shield size={32} className="mb-2" />
              <p className="text-sm">No submissions found</p>
            </div>
          ) : filtered.map((doc) => {
            const sc = statusCfg[doc.status] || statusCfg.PENDING
            return (
              <button
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setRejectReason(""); setRejectForDoc(null) }}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-gray-50",
                  selectedDoc?.id === doc.id && "bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {doc.user.avatar ? (
                      <img src={doc.user.avatar} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.classList.add("flex", "h-8", "w-8", "items-center", "justify-center", "rounded-full", "bg-primary/10", "text-xs", "font-bold", "text-primary") }}
                      />
                    ) : (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(doc.user.firstName, doc.user.lastName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {doc.user.firstName} {doc.user.lastName}
                      </p>
                      <p className="truncate text-xs text-muted">{doc.user.email}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0", sc.bg, sc.text)}>
                    <span className={cn("h-2 w-2 rounded-full", doc.status === "PENDING" ? "bg-amber-500" : doc.status === "VERIFIED" ? "bg-green-500" : "bg-red-500")} />
                    {sc.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                  <span>{docLabels[doc.documentType] || doc.documentType}</span>
                  <span>·</span>
                  <span>{timeAgo(doc.createdAt)}</span>
                </div>
                {(doc.frontImage || doc.backImage) && (
                  <div className="mt-2 flex gap-1.5">
                    {doc.frontImage && (
                      doc.frontImage.match(/\.pdf/i) ? (
                        <a href={resolvePdfUrl(doc.frontImage)} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.frontImage} alt="" className="h-9 w-14 rounded object-cover" />
                      )
                    )}
                    {doc.backImage && (
                      doc.backImage.match(/\.pdf/i) ? (
                        <a href={resolvePdfUrl(doc.backImage)} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.backImage} alt="" className="h-9 w-14 rounded object-cover" />
                      )
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-xs text-muted">Pg {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded px-2 py-1 text-xs text-muted hover:bg-gray-100 disabled:opacity-30">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded px-2 py-1 text-xs text-muted hover:bg-gray-100 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50/50">
        {selectedDoc ? (
          <>
            {/* User header */}
            <div className="border-b border-border bg-white px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selectedDoc.user.avatar ? (
                    <img src={selectedDoc.user.avatar} alt="" className="h-12 w-12 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
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
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                      {pendingUserDocs.length} pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* All user documents */}
            <div className="flex-1 space-y-4 p-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {userDocsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted" /></div>
              ) : userDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted">
                  <Shield size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No documents found for this user</p>
                </div>
              ) : (
                userDocs.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-border bg-white shadow-sm">
                    {/* Document header */}
                    <div className="flex items-center justify-between border-b border-border px-5 py-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {docLabels[doc.documentType] || doc.documentType}
                          {coreDocTypes.includes(doc.documentType) && (
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Required</span>
                          )}
                          {!coreDocTypes.includes(doc.documentType) && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">Optional</span>
                          )}
                        </h3>
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          doc.status === "PENDING" && "bg-amber-100 text-amber-700",
                          doc.status === "VERIFIED" && "bg-green-100 text-green-700",
                          doc.status === "REJECTED" && "bg-red-100 text-red-700"
                        )}>
                          {doc.status === "PENDING" && <Clock size={12} />}
                          {doc.status === "VERIFIED" && <CheckCircle size={12} />}
                          {doc.status === "REJECTED" && <XCircle size={12} />}
                          {statusCfg[doc.status]?.label || doc.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        Submitted {timeAgo(doc.createdAt)}
                      </div>
                    </div>

                    {/* Document images */}
                    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                      {doc.frontImage ? (
                        <div className="flex flex-col">
                          <label className="mb-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                            {doc.documentType === "BUSINESS_PERMIT" || doc.documentType === "BUSINESS_REGISTRATION" || doc.documentType === "KRA_PIN" ? "Document Image" : "Front Image"}
                          </label>
                          {doc.frontImage.match(/\.pdf/i) ? (
                            <PdfViewer url={doc.frontImage} filename={`${docLabels[doc.documentType] || doc.documentType} — Front`} compact />
                          ) : (
                            <button onClick={() => openLightbox([{ src: doc.frontImage!, label: `${docLabels[doc.documentType] || doc.documentType} — ${selectedDoc!.user.firstName} ${selectedDoc!.user.lastName}` }], 0)}
                              className="group relative overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
                            >
                              <ImgWithFallback src={doc.frontImage} alt={doc.documentType}
                                className="h-56 w-full object-contain p-2"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                                <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">Click to zoom</span>
                              </div>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-muted/50 bg-white py-14 text-xs text-muted">No image</div>
                      )}

                      {doc.backImage ? (
                        <div className="flex flex-col">
                          <label className="mb-1.5 text-xs font-medium text-muted uppercase tracking-wider">Back Image</label>
                          {doc.backImage.match(/\.pdf/i) ? (
                            <PdfViewer url={doc.backImage} filename={`${docLabels[doc.documentType] || doc.documentType} — Back`} compact />
                          ) : (
                            <button onClick={() => openLightbox([{ src: doc.backImage!, label: `Back — ${docLabels[doc.documentType] || doc.documentType}` }], 0)}
                              className="group relative overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
                            >
                              <ImgWithFallback src={doc.backImage} alt="Back"
                                className="h-56 w-full object-contain p-2"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                                <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">Click to zoom</span>
                              </div>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-muted/50 bg-white py-14 text-xs text-muted">No image</div>
                      )}
                    </div>

                    {/* Document info */}
                    <div className="border-t border-border px-5 py-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <div><span className="text-muted">Type:</span> <span className="ml-1 font-medium text-foreground">{docLabels[doc.documentType] || doc.documentType}</span></div>
                        {doc.documentNumber && <div><span className="text-muted">Number:</span> <span className="ml-1 font-mono text-xs text-foreground">{doc.documentNumber}</span></div>}
                        {doc.verifiedAt && <div><span className="text-muted">Reviewed:</span> <span className="ml-1 text-foreground">{fmtDate(doc.verifiedAt)}</span></div>}
                      </div>
                      {doc.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          <span className="font-medium">Rejection reason:</span> {doc.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Approve/Reject for PENDING docs */}
                    {doc.status === "PENDING" && (
                      <div className="border-t border-border px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => updateDoc(doc.id, { status: "VERIFIED" })}
                            disabled={actionLoading === doc.id}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Approve
                          </button>
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              ref={rejectForDoc === doc.id ? inputRef : undefined}
                              value={rejectForDoc === doc.id ? rejectReason : ""}
                              onChange={(e) => setRejectReason(e.target.value)}
                              onFocus={() => setRejectForDoc(doc.id)}
                              placeholder="Rejection reason..."
                              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted focus:border-primary focus:outline-none"
                              onKeyDown={(e) => { if (e.key === "Enter") updateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" }) }}
                            />
                            <button
                              onClick={() => updateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" })}
                              disabled={actionLoading === doc.id}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="border-t border-border bg-gray-50/50 px-6 py-2 text-[11px] text-muted">
              <span className="font-medium">Shortcuts:</span>
              <kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">↑</kbd>
              <kbd className="mr-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">↓</kbd> Navigate users
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-muted">
            <Shield size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a submission to review</p>
            <p className="mt-1 text-xs">All documents for that user will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    NONE: { bg: "bg-gray-100", text: "text-gray-600", label: "Not Verified" },
    PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    VERIFIED: { bg: "bg-green-100", text: "text-green-700", label: "Verified" },
    REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  }
  const c = cfg[status] || cfg.NONE
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", c.bg, c.text)}>{c.label}</span>
}