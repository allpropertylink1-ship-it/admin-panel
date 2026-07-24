"use client"

import { Search, X } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

const statusFilters = ["", "ACTIVE", "SUSPENDED", "INACTIVE"]
const statusLabels: Record<string, string> = { "": "All", ACTIVE: "Active", SUSPENDED: "Suspended", INACTIVE: "Inactive" }

interface AgentFiltersProps {
  search: string
  statusFilter: string
  onSearchChange: (s: string) => void
  onStatusFilterChange: (s: string) => void
}

export default function AgentFilters({ search, statusFilter, onSearchChange, onStatusFilterChange }: AgentFiltersProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        {statusFilters.map((sf) => (
          <button key={sf} onClick={() => onStatusFilterChange(sf)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              statusFilter === sf
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            )}>
            {statusLabels[sf]}
          </button>
        ))}
      </div>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text" placeholder="Search by name, email, or code..."
          value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>
    </>
  )
}
