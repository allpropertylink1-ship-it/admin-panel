"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "@/components/ui/icons"

interface ListFreshnessProps {
  /** Epoch ms of the last successful fetch, or null before first load. */
  lastUpdated: number | null
  onRefresh: () => void
  onClearCache: () => void
  refreshing?: boolean
}

function formatAge(ageMs: number): string {
  const s = Math.max(0, Math.floor(ageMs / 1000))
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

/**
 * "Updated Xs ago + Refresh + Clear cache" indicator for list headers.
 * Tick updates the label locally; actual freshness is backed by the
 * api-client GET cache (cleared on Refresh / Clear cache).
 */
export function ListFreshness({ lastUpdated, onRefresh, onClearCache, refreshing }: ListFreshnessProps) {
  // Null until the first 5s tick fires; render falls back to "just now".
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (lastUpdated === null) return
    const t = window.setInterval(() => setNow(Date.now()), 5000)
    return () => window.clearInterval(t)
  }, [lastUpdated])

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {lastUpdated !== null && (
        <span aria-live="off" className="tabular-nums">
          Updated {now === null ? "just now" : formatAge(now - lastUpdated)}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-card disabled:opacity-50"
      >
        <RefreshCw size={13} className={refreshing ? "animate-spin" : undefined} />
        Refresh
      </button>
      <button
        type="button"
        onClick={onClearCache}
        title="Clear cached list data"
        className="rounded-lg border border-border px-2.5 py-1.5 font-medium text-muted transition-colors hover:bg-card hover:text-foreground"
      >
        Clear cache
      </button>
    </div>
  )
}
