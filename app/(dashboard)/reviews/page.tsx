"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, Loader2, Star, Trash2 } from "@/components/ui/icons"
import { TablePagination } from "@/components/shared/TablePagination"

interface Review {
  id: string
  targetType: string
  targetId: string
  rating: number
  comment: string | null
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string }
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const TARGET_TYPES = ["", "PROPERTY", "SERVICE_LISTING", "USER"]

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [targetType, setTargetType] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const limit = 20

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (search) params.set("search", search)
      if (targetType) params.set("targetType", targetType)
      const { data, error } = await api.get<ReviewsResponse>(`/api/admin/reviews?${params}`)
      if (error || !data) throw new Error(error || "No data")
      setReviews(data.reviews)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }, [page, search, targetType])

  useEffect(() => { void (async () => { await fetchReviews() })() }, [fetchReviews])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      const { error } = await api.delete(`/api/admin/reviews/${id}`)
      if (error) throw new Error(error)
      setReviews((prev) => prev.filter((r) => r.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete review")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Reviews</h1>
          <p className="mt-1 text-sm text-muted">{total} total customer reviews</p>
        </div>
        <select
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(1) }}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Filter by target type"
        >
          <option value="">All targets</option>
          {TARGET_TYPES.slice(1).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search comment text or target ID…"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Search
        </button>
        {(search || searchInput) && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1) }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={fetchReviews} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Retry</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <Star size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Comment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{r.user.firstName} {r.user.lastName}</p>
                      <p className="text-xs text-muted">{r.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{r.targetType}</p>
                      <p className="max-w-[140px] truncate text-[11px] text-muted" title={r.targetId}>{r.targetId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <Star size={14} className="text-amber-500" />
                        {r.rating}/5
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate text-sm text-foreground" title={r.comment || undefined}>{r.comment || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={actionLoading === r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <TablePagination page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
