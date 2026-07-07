"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Shield, ShieldCheck, ShieldX, AlertCircle, Loader2, User, CalendarDays,
  Search, CheckCircle, XCircle, Clock, ArrowRight,
} from "lucide-react"
import ImageLightbox from "@/components/ImageLightbox"

interface UserInfo {
  id: string; firstName: string; lastName: string; email: string; avatar: string | null
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

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
]

const statusCfg: Record<string, { bg: string; text: string; label: string; icon: typeof Shield }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending", icon: Clock },
  VERIFIED: { bg: "bg-green-100", text: "text-green-800", label: "Verified", icon: ShieldCheck },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected", icon: ShieldX },
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
  const [selected, setSelected] = useState<KycDocument | null>(null)
  const [rejectReason, setRejectReason] = useState("")
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
        if (!selected || !r.documents.find((d) => d.id === selected.id)) {
          setSelected(r.documents[0])
        }
      } else setSelected(null)
    } catch { setError("Failed to load KYC documents.") }
    finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const updateDoc = useCallback(async (id: string, data: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/kyc/${id}`, data)
      if (error) throw new Error("Failed to update")
      setRejectReason("")
      await fetchDocs()
    } catch { setError("Failed to update KYC document.") }
    finally { setActionLoading(null) }
  }, [fetchDocs])

  const approve = useCallback(() => { if (selected) updateDoc(selected.id, { status: "VERIFIED" }) }, [selected, updateDoc])
  const reject = useCallback(() => {
    if (selected) updateDoc(selected.id, { status: "REJECTED", rejectionReason: rejectReason || "Document does not meet requirements" })
  }, [selected, rejectReason, updateDoc])

  // Filter by search
  const filtered = docs.filter((d) =>
    !search || `${d.user.firstName} ${d.user.lastName} ${d.user.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const selIdx = selected ? filtered.findIndex((d) => d.id === selected.id) : -1

  const navigate = useCallback((dir: number) => {
    const i = selIdx + dir
    if (i >= 0 && i < filtered.length) {
      setSelected(filtered[i])
      setRejectReason("")
      if (listRef.current) {
        const el = listRef.current.children[i] as HTMLElement
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selIdx, filtered])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") { (e.target as HTMLElement).blur(); return }
        return
      }
      if (e.key === "a" || e.key === "A") approve()
      else if (e.key === "r" || e.key === "R") {
        if (e.shiftKey) reject()
        else inputRef.current?.focus()
      }
      else if (e.key === "ArrowDown" || e.key === "n" || e.key === "N") navigate(1)
      else if (e.key === "ArrowUp" || e.key === "p" || e.key === "P") navigate(-1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [approve, reject, navigate, lightbox])

  const openLightbox = (side: "front" | "back") => {
    if (!selected) return
    const imgs = []
    if (selected.frontImage) imgs.push({ src: selected.frontImage, label: "Front — " + `${selected.user.firstName} ${selected.user.lastName}` })
    if (selected.backImage) imgs.push({ src: selected.backImage, label: "Back — " + `${selected.user.firstName} ${selected.user.lastName}` })
    setLightbox({ images: imgs, index: side === "front" ? 0 : Math.min(1, imgs.length - 1) })
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0">
      {/* Lightbox */}
      {lightbox && <ImageLightbox {...lightbox} onClose={() => setLightbox(null)} />}

      {/* Left panel — submission list */}
      <div className="flex w-[420px] flex-shrink-0 flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">KYC Verification</h1>
              <p className="text-xs text-muted">{total} total · {docs.filter((d) => d.status === "PENDING").length} pending review</p>
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

        {/* List */}
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
            const SI = sc.icon
            return (
              <button
                key={doc.id}
                onClick={() => { setSelected(doc); setRejectReason("") }}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-gray-50",
                  selected?.id === doc.id && "bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {doc.user.avatar ? (
                      <img src={doc.user.avatar} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
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
                    <SI size={10} /> {sc.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                  <span>{docLabels[doc.documentType] || doc.documentType}</span>
                  <span>·</span>
                  <span>{timeAgo(doc.createdAt)}</span>
                </div>
                {(doc.frontImage || doc.backImage) && (
                  <div className="mt-2 flex gap-1.5">
                    {doc.frontImage && <img src={doc.frontImage} alt="" className="h-9 w-14 rounded object-cover" />}
                    {doc.backImage && <img src={doc.backImage} alt="" className="h-9 w-14 rounded object-cover" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Pagination */}
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

      {/* Right panel — detail view */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50/50">
        {selected ? (
          <>
            {/* User header */}
            <div className="border-b border-border bg-white px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selected.user.avatar ? (
                    <img src={selected.user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {initials(selected.user.firstName, selected.user.lastName)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {selected.user.firstName} {selected.user.lastName}
                    </h2>
                    <p className="text-sm text-muted">{selected.user.email}</p>
                  </div>
                </div>
                {(() => {
                  const sc = statusCfg[selected.status] || statusCfg.PENDING
                  const SI = sc.icon
                  return (
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", sc.bg, sc.text)}>
                      <SI size={14} /> {sc.label}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Document images */}
            <div className="grid flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-2">
              {selected.frontImage ? (
                <div className="flex flex-col">
                  <label className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Front Image</label>
                  <button
                    onClick={() => openLightbox("front")}
                    className="group relative flex-1 overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <img
                      src={selected.frontImage}
                      alt="Front of document"
                      className="h-full w-full object-contain p-2"
                      style={{ minHeight: "280px", maxHeight: "400px" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                      <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        Click to zoom
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-muted/50 bg-white py-20 text-xs text-muted">
                  No front image
                </div>
              )}

              {selected.backImage ? (
                <div className="flex flex-col">
                  <label className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Back Image</label>
                  <button
                    onClick={() => openLightbox("back")}
                    className="group relative flex-1 overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <img
                      src={selected.backImage}
                      alt="Back of document"
                      className="h-full w-full object-contain p-2"
                      style={{ minHeight: "280px", maxHeight: "400px" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                      <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        Click to zoom
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-muted/50 bg-white py-20 text-xs text-muted">
                  No back image
                </div>
              )}
            </div>

            {/* Document info + actions */}
            <div className="border-t border-border bg-white px-6 py-4">
              <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted">Document:</span> <span className="ml-1 font-medium text-foreground">{docLabels[selected.documentType] || selected.documentType}</span></div>
                {selected.documentNumber && <div><span className="text-muted">Number:</span> <span className="ml-1 font-mono text-xs text-foreground">{selected.documentNumber}</span></div>}
                <div><span className="text-muted">Submitted:</span> <span className="ml-1 text-foreground">{fmtDate(selected.createdAt)}</span></div>
                {selected.verifiedAt && <div><span className="text-muted">Reviewed:</span> <span className="ml-1 text-foreground">{fmtDate(selected.verifiedAt)}</span></div>}
              </div>

              {selected.rejectionReason && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="font-medium">Rejection reason:</span> {selected.rejectionReason}
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {selected.status === "PENDING" && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={approve}
                    disabled={actionLoading === selected.id}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === selected.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Approve
                    <span className="ml-1 rounded bg-green-500 px-1.5 py-0.5 text-[10px]">A</span>
                  </button>

                  <div className="flex flex-1 items-center gap-2">
                    <input
                      ref={inputRef}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)..."
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
                      onKeyDown={(e) => { if (e.key === "Enter") reject() }}
                    />
                    <button
                      onClick={reject}
                      disabled={actionLoading === selected.id}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Reject
                      <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px]">⇧R</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="border-t border-border bg-gray-50/50 px-6 py-2 text-[11px] text-muted">
              <span className="font-medium">Shortcuts:</span> <kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">A</kbd> Approve · <kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">R</kbd> Focus reason · <kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">⇧R</kbd> Reject · <kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">↑</kbd><kbd className="mx-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono">↓</kbd> Navigate
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-muted">
            <Shield size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a submission to review</p>
            <p className="mt-1 text-xs">Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  )
}