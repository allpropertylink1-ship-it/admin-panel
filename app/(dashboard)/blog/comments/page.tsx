"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, Loader2, Trash2 } from "@/components/ui/icons"

interface BlogComment {
  id: string
  postId: string
  authorName: string
  authorEmail: string | null
  content: string
  status: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  post?: {
    id: string
    slug: string
    title: string
  }
}

interface PostOption {
  id: string
  slug: string
  title: string
}

export default function BlogCommentsPage() {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [posts, setPosts] = useState<PostOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPost, setFilterPost] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterPost) params.set("postId", filterPost)
      params.set("page", "1")
      params.set("limit", "100")

      const { data, error: err } = await api.get<{ comments: BlogComment[]; total: number }>(
        `/api/admin/blog/comments?${params.toString()}`
      )
      if (err || !data) throw new Error(err || "No data")
      setComments(data.comments)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPost])

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error: err } = await api.get<{ posts: PostOption[] }>("/api/blog/posts?limit=100&featured=false")
      if (err || !data) throw new Error(err || "No data")
      setPosts(data.posts)
    } catch {
      // Non-fatal — posts dropdown is optional
    }
  }, [])

  useEffect(() => {
    void (async () => { await Promise.all([fetchComments(), fetchPosts()]) })()
  }, [fetchComments, fetchPosts])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/blog/comments/${id}`, { status: "APPROVED" })
      if (error) throw new Error(error)
      await fetchComments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve comment")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/blog/comments/${id}`, { status: "REJECTED" })
      if (error) throw new Error(error)
      await fetchComments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject comment")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSpam = async (id: string) => {
    setActionLoading(id)
    try {
      const { error } = await api.patch(`/api/admin/blog/comments/${id}`, { status: "SPAM" })
      if (error) throw new Error(error)
      await fetchComments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark as spam")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return
    setDeletingId(id)
    try {
      const { error } = await api.delete(`/api/admin/blog/comments/${id}`)
      if (error) throw new Error(error)
      await fetchComments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "border-emerald/30 bg-emerald/10 text-emerald-700"
      case "PENDING": return "border-amber/30 bg-amber/10 text-amber-700"
      case "REJECTED": return "border-rose/30 bg-rose/10 text-rose-700"
      case "SPAM": return "border-border bg-gray-50 text-muted"
      default: return "border-border bg-gray-50 text-muted"
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "APPROVED": return "Approved"
      case "PENDING": return "Pending"
      case "REJECTED": return "Rejected"
      case "SPAM": return "Spam"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Comment Moderation</h1>
          <p className="mt-1 text-sm text-muted">Review, approve, reject, or mark as spam</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Dismiss</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="comment-filter-status">Status</label>
            <select
              id="comment-filter-status"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as "all" | "PENDING" | "APPROVED" | "REJECTED" | "SPAM") }}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SPAM">Spam</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="comment-filter-post">Post</label>
            <select
              id="comment-filter-post"
              value={filterPost}
              onChange={(e) => setFilterPost(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All posts</option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <p className="text-sm font-medium text-foreground/60">No comments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Comment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Post</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comments.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted whitespace-pre-wrap line-clamp-2">{c.content}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-foreground">{c.authorName}</span>
                      {c.authorEmail && (
                        <p className="text-xs text-muted">{c.authorEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{c.post?.title || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColor(c.status)}`}
                      >
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted tabular-nums">
                      {new Date(c.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(c.id)}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald/30 bg-emerald/50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald/100 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(c.id)}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose/30 bg-rose/50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose/100 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === "APPROVED" && (
                          <button
                            onClick={() => handleReject(c.id)}
                            disabled={actionLoading === c.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose/30 bg-rose/50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose/100 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleSpam(c.id)}
                          disabled={actionLoading === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Spam
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
