"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import ImageLightbox from "@/components/ImageLightbox"
import { BulkActionsBar } from "@/components/BulkActionsBar"
import KycList from "./KycList"
import KycDetail from "./KycDetail"
import type { KycDocument, KycResponse, UserDocsResponse } from "./types"

export default function KycPage() {
  const [docs, setDocs] = useState<KycDocument[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("PENDING")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null)
  const [userDocs, setUserDocs] = useState<KycDocument[]>([])
  const [userDocsLoading, setUserDocsLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectForDoc, setRejectForDoc] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ images: { src: string; label: string }[]; index: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const p = new URLSearchParams()
      if (filter) p.set("status", filter)
      if (search) p.set("search", search)
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
  }, [filter, page, search])

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
    const newStatus = data.status as string
    const prevDocs = docs.map(d => ({ ...d }))
    setDocs(cur => cur.map(d => d.id === id ? { ...d, status: newStatus, rejectionReason: newStatus === "REJECTED" ? (data.rejectionReason as string) || d.rejectionReason : d.rejectionReason } : d))
    setSelectedDoc(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
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
    } catch (e) {
      setDocs(prevDocs)
      setSelectedDoc(prev => prev?.id === id ? { ...prev, status: prevDocs.find(d => d.id === id)?.status || prev.status } : prev)
      setError(e instanceof Error ? e.message : "Failed to update KYC document.")
    } finally { setActionLoading(null) }
  }, [fetchDocs, selectedDoc, docs])

  const selIdx = selectedDoc ? docs.findIndex((d) => d.id === selectedDoc.id) : -1

  const navigate = useCallback((dir: number) => {
    const i = selIdx + dir
    if (i >= 0 && i < docs.length) {
      setSelectedDoc(docs[i])
      setRejectReason("")
      setRejectForDoc(null)
      if (listRef.current) {
        const el = listRef.current.children[i] as HTMLElement
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selIdx, docs])

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
      window.open(images[index].src, "_blank", "noopener,noreferrer")
      return
    }
    setLightbox({ images, index })
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === docs.length) { setSelectedIds([]) }
    else { setSelectedIds(docs.map(d => d.id)) }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleFilterChange = (f: string) => { setFilter(f); setPage(1) }
  const handleSearchChange = (s: string) => { setSearch(s); setPage(1) }
  const handleSelectDoc = (doc: KycDocument) => { setSelectedDoc(doc); setRejectReason(""); setRejectForDoc(null) }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0">
      {lightbox && <ImageLightbox {...lightbox} onClose={() => setLightbox(null)} />}

      <KycList
        docs={docs}
        total={total}
        selectedDoc={selectedDoc}
        selectedIds={selectedIds}
        search={search}
        filter={filter}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onSelectDoc={handleSelectDoc}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onPageChange={setPage}
        listRef={listRef}
      />

      <KycDetail
        selectedDoc={selectedDoc}
        userDocs={userDocs}
        userDocsLoading={userDocsLoading}
        actionLoading={actionLoading}
        error={error}
        rejectReason={rejectReason}
        rejectForDoc={rejectForDoc}
        onUpdateDoc={updateDoc}
        onRejectReasonChange={setRejectReason}
        onRejectForDocChange={setRejectForDoc}
        onOpenLightbox={openLightbox}
        onRetry={fetchDocs}
      />

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Approve", action: "approve", requiresConfirmation: true },
          { label: "Reject", action: "reject", variant: "destructive", requiresConfirmation: true },
        ]}
        onAction={async (action) => {
          setLoading(true)
          try {
            const { error } = await api.post("/api/admin/kyc/bulk", { ids: selectedIds, action })
            if (error) throw new Error(error)
            setSelectedIds([])
            await fetchDocs()
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Bulk action failed")
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
      />
    </div>
  )
}
