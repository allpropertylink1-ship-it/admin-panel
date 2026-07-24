"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "@/components/ui/icons"

interface UserFiltersProps {
  search: string
  searchValue: string
  activeFilter: string
  userTypeFilter: string
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  onFilterChange: (f: string) => void
  onUserTypeChange: (ut: string) => void
}

const FILTERS = ["All", "Active", "Pending", "Suspended"]
const USER_TYPE_TABS = ["", "PROPERTY_OWNER", "AGENT", "FUNDI", "SERVICE_PROVIDER"]
const USER_TYPE_LABELS: Record<string, string> = { "": "All Types", PROPERTY_OWNER: "Property Owners", AGENT: "Agents", FUNDI: "Fundis", SERVICE_PROVIDER: "Service Providers" }

export function UserFilters({ search, searchValue, activeFilter, userTypeFilter, onSearchChange, onClearSearch, onFilterChange, onUserTypeChange }: UserFiltersProps) {
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

      <div className="flex flex-wrap items-center gap-1.5">
        {USER_TYPE_TABS.map((ut) => (
          <button key={ut} onClick={() => onUserTypeChange(ut)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all border border-border",
              userTypeFilter === ut ? "bg-accent text-white border-accent shadow-sm" : "text-muted hover:text-foreground hover:border-primary/30"
            )}>
            {USER_TYPE_LABELS[ut] || ut}
          </button>
        ))}
      </div>
    </>
  )
}
