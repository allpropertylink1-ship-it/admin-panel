"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "@/components/ui/icons"

interface UserFiltersProps {
  searchValue: string
  activeFilter: string
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  onFilterChange: (f: string) => void
}

const FILTERS = ["All", "Active", "Pending", "Suspended"]

// NOTE: user-type selection lives ONLY in the page-level tabs above
// (which include CUSTOMER). This filter keeps search + status only so the
// two controls can never disagree.

export function UserFilters({ searchValue, activeFilter, onSearchChange, onClearSearch, onFilterChange }: UserFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
          {searchValue && (
            <button onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => onFilterChange(f)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeFilter === f ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

    </>
  )
}
