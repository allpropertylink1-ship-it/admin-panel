"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Shield, ShieldCheck, ShieldX, Search, Loader2, XCircle, CheckCircle,
  RefreshCcw, FileText, X, Clock, ArrowUp, ArrowDown, ImageIcon,
  ChevronLeft, ChevronRight, AlertCircle, User,
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
  businessPermit: string | null
  bioData: { firstName?: string; middleName?: string; lastName?: string; phone?: string; email?: string } | null
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

const statusCfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  PENDING: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  VERIFIED: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Verified" },
  REJECTED: { dot: "bg-error", bg: "bg-error/10", text: "text-error", label: "Rejected" },
}

const userKycCfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  NONE: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600", label: "Not Verified" },
  PENDING: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  VERIFIED: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Verified" },
  REJECTED: { dot: "bg-error", bg: "bg-error/10", text: "text-error", label: "Rejected" },
}

const docLabels: Record<string, string> = {
  NATIONAL_ID: "National ID", PASSPORT: "Passport", DRIVERS_LICENSE: "Driver's License",
}

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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />
}

function EmptyState({ icon: Icon = Shield, title, description }: { icon?: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <Icon size={26} className="text-muted/50" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const c = userKycCfg[status] || userKycCfg.NONE
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

function DocStatusBadge({ status }: { status: string }) {
  const c = statusCfg[status] || statusCfg.PENDING
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
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
        {/* Header */}
        <div className="border-b border-border px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">KYC Verification</h1>
              <p className="mt-0.5 text-xs text-muted">
                <span className="font-medium text-foreground">{total}</span> total
                {docs.filter((d) => d.status === "PENDING").length > 0 && (
                  <span className="ml-1.5">
                    · <span className="font-medium text-warning">{docs.filter((d) => d.status === "PENDING").length}</span> pending
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="rounded-xl border border-border bg-card p-1">
            <div className="flex gap-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setPage(1) }}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    filter === f.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-gray-50 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-border px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Skeleton className="h-9 w-14 rounded" />
                    <Skeleton className="h-9 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Shield} title="No submissions found"
              description={search ? "Try a different search term" : "No KYC submissions match this filter"}
            />
          ) : filtered.map((doc) => {
            const sc = statusCfg[doc.status] || statusCfg.PENDING
            return (
              <button
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setRejectReason(""); setRejectForDoc(null) }}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition-all",
                  selectedDoc?.id === doc.id
                    ? "bg-primary/5 shadow-[inset_3px_0_0_0_#286255]"
                    : "hover:bg-gray-50/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {doc.user.avatar ? (
                      <img src={doc.user.avatar} alt=""
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-primary/10"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary">
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
                  <DocStatusBadge status={doc.status} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                  <span>{docLabels[doc.documentType] || doc.documentType}</span>
                  <span className="text-border">·</span>
                  <span>{timeAgo(doc.createdAt)}</span>
                </div>
                {(doc.frontImage || doc.backImage || doc.businessPermit) && (
                  <div className="mt-2 flex gap-1.5">
                    {doc.frontImage && (
                      doc.frontImage.match(/\.pdf/i) ? (
                        <a href={resolvePdfUrl(doc.frontImage)} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded-lg bg-error-50 text-error/60 hover:bg-error-50/80 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.frontImage} alt="" className="h-9 w-14 rounded-lg object-cover ring-1 ring-black/5" />
                      )
                    )}
                    {doc.backImage && (
                      doc.backImage.match(/\.pdf/i) ? (
                        <a href={resolvePdfUrl(doc.backImage)} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded-lg bg-error-50 text-error/60 hover:bg-error-50/80 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.backImage} alt="" className="h-9 w-14 rounded-lg object-cover ring-1 ring-black/5" />
                      )
                    )}
                    {doc.businessPermit && (
                      <a href={resolvePdfUrl(doc.businessPermit)} target="_blank" rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning/60 hover:bg-warning/20 transition-colors"
                        title="View Business Permit"
                      >
                        <FileText size={14} />
                      </a>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-xs text-muted">
              Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel — detail */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-background">
        {selectedDoc ? (
          <>
            {/* User header */}
            <div className="border-b border-border bg-gradient-to-r from-card to-background px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  {selectedDoc.user.avatar ? (
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
                  <span>{error}</span>
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
                          {doc.frontImage.match(/\.pdf/i) ? (
                            <PdfViewer url={doc.frontImage} filename={`${docLabels[doc.documentType] || doc.documentType} \u2014 Front`} compact />
                          ) : (
                            <button onClick={() => openLightbox([{ src: doc.frontImage!, label: `${docLabels[doc.documentType] || doc.documentType} \u2014 ${selectedDoc!.user.firstName} ${selectedDoc!.user.lastName}` }], 0)}
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
                          {doc.backImage.match(/\.pdf/i) ? (
                            <PdfViewer url={doc.backImage} filename={`${docLabels[doc.documentType] || doc.documentType} \u2014 Back`} compact />
                          ) : (
                            <button onClick={() => openLightbox([{ src: doc.backImage!, label: `Back \u2014 ${docLabels[doc.documentType] || doc.documentType}` }], 0)}
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
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-warning/5 px-4 py-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10">
                            <FileText size={20} className="text-warning" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">Business Permit Document</p>
                            <p className="text-xs text-muted">Uploaded as PDF</p>
                          </div>
                          <PdfViewer url={doc.businessPermit} filename={`Business Permit \u2014 ${selectedDoc!.user.firstName} ${selectedDoc!.user.lastName}`} compact />
                        </div>
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
                            onClick={() => updateDoc(doc.id, { status: "VERIFIED" })}
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
                              onChange={(e) => setRejectReason(e.target.value)}
                              onFocus={() => setRejectForDoc(doc.id)}
                              placeholder="Rejection reason..."
                              className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 py-2 text-xs placeholder:text-muted/60 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/15"
                              onKeyDown={(e) => { if (e.key === "Enter") updateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" }) }}
                            />
                            <button
                              onClick={() => updateDoc(doc.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" })}
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
                            onClick={() => updateDoc(doc.id, { status: "PENDING" })}
                            disabled={actionLoading === doc.id}
                            className="flex items-center gap-1.5 rounded-xl bg-warning px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-warning/90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                          >
                            {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                            Unverify
                          </button>
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              value={rejectForDoc === doc.id ? rejectReason : ""}
                              onChange={(e) => setRejectReason(e.target.value)}
                              onFocus={() => setRejectForDoc(doc.id)}
                              placeholder="Reason for unverifying (optional)..."
                              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs placeholder:text-muted/60 focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/15"
                              onKeyDown={(e) => { if (e.key === "Enter") updateDoc(doc.id, { status: "PENDING", rejectionReason: rejectReason || undefined }) }}
                            />
                          </div>
                        </div>
                      )}

                      {doc.status === "REJECTED" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => updateDoc(doc.id, { status: "PENDING", rejectionReason: undefined })}
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
            <div className="flex items-center gap-2 border-t border-border bg-card/50 px-4 py-2.5 text-[11px] text-muted">
              <span className="font-medium text-foreground/60">Shortcuts:</span>
              <kbd className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                <ArrowUp size={10} /> <span>or</span> <span className="font-sans uppercase">P</span>
              </kbd>
              <kbd className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                <ArrowDown size={10} /> <span>or</span> <span className="font-sans uppercase">N</span>
              </kbd>
              <span>Navigate users</span>
            </div>
          </>
        ) : (
          <EmptyState icon={Shield} title="Select a submission to review"
            description="All documents for that user will appear here"
          />
        )}
      </div>
    </div>
  )
}