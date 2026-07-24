"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "@/components/ui/icons"

interface PropertyFiltersProps {
  typeFilter: string
  purposeFilter: string
  searchInput: string
  onTypeChange: (t: string) => void
  onPurposeChange: (p: string) => void
  onSearchInputChange: (v: string) => void
  onSearch: (e: React.FormEvent) => void
  onClearSearch: () => void
}

export function PropertyFilters({ typeFilter, purposeFilter, searchInput, onTypeChange, onPurposeChange, onSearchInputChange, onSearch, onClearSearch }: PropertyFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted mr-1">Type:</span>
        {["", "HOUSE", "APARTMENT", "LAND", "COMMERCIAL"].map((t) => (
          <button key={t} onClick={() => onTypeChange(t)}
            className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
              typeFilter === t ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {t || "All"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted mr-1">Purpose:</span>
        {["", "FOR_SALE", "FOR_RENT_LONG_TERM", "FOR_RENT_SHORT_TERM"].map((p) => (
          <button key={p} onClick={() => onPurposeChange(p)}
            className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-all border border-border",
              purposeFilter === p ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {p ? { FOR_SALE: "For Sale", FOR_RENT_LONG_TERM: "Long-term", FOR_RENT_SHORT_TERM: "Short-term / Airbnb" }[p] : "All"}
          </button>
        ))}
      </div>
      <div className="ml-auto">
        <form onSubmit={onSearch} className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="search-properties" className="sr-only">Search properties</label>
          <input id="search-properties" type="text" value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by title..."
            className="w-64 rounded-xl border border-border bg-card/80 px-4 py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {searchInput && (
            <button type="button" onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
