"use client"

import { Search, X } from "@/components/ui/icons"

interface ApprovalFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  onClearSearch: () => void
}

export function ApprovalFilters({ search, onSearchChange, onClearSearch }: ApprovalFiltersProps) {
  return (
    <div className="relative max-w-md">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="text"
        placeholder="Search by name, email, or category..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
      />
      {search && (
        <button onClick={onClearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
