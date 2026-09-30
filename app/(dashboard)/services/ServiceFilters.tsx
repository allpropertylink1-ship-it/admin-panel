"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "@/components/ui/icons"

interface ServiceFiltersProps {
  statusFilter: string
  searchInput: string
  onStatusChange: (s: string) => void
  onSearchInputChange: (v: string) => void
  onSearch: (e: React.FormEvent) => void
  onClearSearch: () => void
}

export function ServiceFilters({ statusFilter, searchInput, onStatusChange, onSearchInputChange, onSearch, onClearSearch }: ServiceFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {["", "PENDING_REVIEW", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => onStatusChange(s)}
            className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
              statusFilter === s ? "bg-primary text-white border-primary shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {s ? { PENDING_REVIEW: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }[s] : "All Status"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="ml-auto">
          <form onSubmit={onSearch} className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search services..." className="w-64 rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
            {searchInput && (
              <button type="button" onClick={onClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
