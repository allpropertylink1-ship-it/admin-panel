"use client"

import { FileText, Search, X, Shield, Download } from "@/components/ui/icons"
import { TablePagination } from "@/components/shared/TablePagination"
import { cn } from "@/lib/utils"
import { FILTERS, statusCfg, docLabels, timeAgo, initials, ImgWithFallback, Skeleton, EmptyState, DocStatusBadge, isValidUrl } from "./utils"
import type { KycDocument } from "./types"

interface KycListProps {
  docs: KycDocument[]
  total: number
  selectedDoc: KycDocument | null
  selectedIds: string[]
  search: string
  filter: string
  loading: boolean
  page: number
  totalPages: number
  onSelectDoc: (doc: KycDocument) => void
  onSearchChange: (s: string) => void
  onFilterChange: (f: string) => void
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onPageChange: (p: number) => void
  listRef: React.RefObject<HTMLDivElement | null>
}

export default function KycList({
  docs, total, selectedDoc, selectedIds, search, filter, loading, page, totalPages,
  onSelectDoc, onSearchChange, onFilterChange, onToggleSelect, onToggleSelectAll, onPageChange, listRef,
}: KycListProps) {
  const pendingCount = docs.filter((d) => d.status === "PENDING").length

  return (
    <div className="flex w-[420px] flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">KYC Verification</h1>
            <p className="mt-0.5 text-xs text-muted">
              <span className="font-medium text-foreground">{total}</span> total
              {pendingCount > 0 && (
                <span className="ml-1.5">
                  · <span className="font-medium text-warning">{pendingCount}</span> pending
                </span>
              )}
            </p>
          </div>
          <a
            href="/api/admin/exports/kyc"
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-all inline-flex items-center gap-1.5"
          >
            <Download size={14} />
            Export
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {search && (
            <button onClick={() => onSearchChange("")}
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
                onClick={() => onFilterChange(f.value)}
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

      {/* Bulk select */}
      {docs.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <input type="checkbox"
            checked={docs.length > 0 && selectedIds.length === docs.length}
            onChange={onToggleSelectAll}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-xs text-muted">
            {selectedIds.length > 0
              ? `${selectedIds.length} of ${docs.length} selected`
              : "Select all"}
          </span>
        </div>
      )}

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
        ) : docs.length === 0 ? (
          <EmptyState icon={Shield} title="No submissions found"
            description={search ? "Try a different search term" : "No KYC submissions match this filter"}
          />
        ) : docs.map((doc) => {
          const sc = statusCfg[doc.status] || statusCfg.PENDING
          return (
            <button
              key={doc.id}
              onClick={() => onSelectDoc(doc)}
              className={cn(
                "w-full border-b border-border px-4 py-3 text-left transition-all",
                selectedDoc?.id === doc.id
                  ? "bg-primary/5 shadow-[inset_3px_0_0_0_#286255]"
                  : "hover:bg-gray-50/40",
                selectedIds.includes(doc.id) && "bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <input type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={() => onToggleSelect(doc.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex min-w-0 items-center gap-2.5">
                  {doc.user.avatar && isValidUrl(doc.user.avatar) ? (
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
                    isValidUrl(doc.frontImage) ? (
                      doc.frontImage.match(/\.pdf/i) ? (
                        <a href={doc.frontImage} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded-lg bg-error-50 text-error/60 hover:bg-error-50/80 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.frontImage} alt="" className="h-9 w-14 rounded-lg object-cover ring-1 ring-black/5" />
                      )
                    ) : (
                      <div className="flex h-9 w-14 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-muted">Invalid URL</div>
                    )
                  )}
                  {doc.backImage && (
                    isValidUrl(doc.backImage) ? (
                      doc.backImage.match(/\.pdf/i) ? (
                        <a href={doc.backImage} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 w-14 items-center justify-center rounded-lg bg-error-50 text-error/60 hover:bg-error-50/80 transition-colors"
                          title="View PDF"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <ImgWithFallback src={doc.backImage} alt="" className="h-9 w-14 rounded-lg object-cover ring-1 ring-black/5" />
                      )
                    ) : (
                      <div className="flex h-9 w-14 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-muted">Invalid URL</div>
                    )
                  )}
                  {doc.businessPermit && (
                    isValidUrl(doc.businessPermit) ? (
                      <a href={doc.businessPermit} target="_blank" rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning/60 hover:bg-warning/20 transition-colors"
                        title="View Business Permit"
                      >
                        <FileText size={14} />
                      </a>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-muted">!</div>
                    )
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <TablePagination page={page} totalPages={totalPages} total={total} pageSize={50} onPageChange={onPageChange} />
    </div>
  )
}
