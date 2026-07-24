"use client"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "@/components/ui/icons"

interface TablePaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export function TablePagination({ page, totalPages, total, pageSize = 20, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50/30">
      <p className="text-xs text-muted tabular-nums">
        {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-muted">...</span>}
              <button onClick={() => onPageChange(p)}
                className={cn("min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  page === p ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-gray-100")}>
                {p}
              </button>
            </span>
          ))}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-100 disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}