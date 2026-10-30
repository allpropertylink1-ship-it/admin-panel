"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Plus, Pencil, Eye, Archive } from "@/components/ui/icons"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  authorName: string
  categoryId: string | null
  status: string
  featured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
}

export default function BlogListPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<"publish" | "archive" | "delete" | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (searchQuery) params.set("search", searchQuery)
      params.set("page", "1")
      params.set("limit", "100")

      const { data, error } = await api.get<{ posts: BlogPost[]; total: number }>(
        `/api/admin/blog/posts?${params.toString()}`
      )
      if (error || !data) throw new Error(error || "No data")
      setPosts(data.posts)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, searchQuery])

  useEffect(() => { void (async () => { await fetchPosts() })() }, [fetchPosts])

  async function handlePublish(id: string) {
    setActionLoading(id)
    try {
      const { error } = await api.post(`/api/admin/blog/posts/${id}/publish`)
      if (error) throw new Error(error)
      await fetchPosts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this post? It will be removed from the site.")) return
    setActionLoading(id)
    try {
      const { error } = await api.delete(`/api/admin/blog/posts/${id}`)
      if (error) throw new Error(error)
      await fetchPosts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return
    if (bulkAction === "delete" && !confirm(`Delete ${selectedIds.size} post(s)? This cannot be undone.`)) return

    setActionLoading("bulk")
    try {
      for (const id of selectedIds) {
        if (bulkAction === "publish") {
          await api.post(`/api/admin/blog/posts/${id}/publish`)
        } else {
          await api.delete(`/api/admin/blog/posts/${id}`)
        }
      }
      setSelectedIds(new Set())
      setBulkAction(null)
      await fetchPosts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bulk action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredCount = posts.filter((p) => selectedIds.has(p.id)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Blog Posts</h1>
          <p className="mt-1 text-sm text-muted">{posts.length} posts · drafts, published, archived</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/blog/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            New Post
          </button>
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
        <div className="grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="blog-filter-status">Status</label>
            <select
              id="blog-filter-status"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED"); setSelectedIds(new Set()) }}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="blog-search">Search</label>
            <input
              id="blog-search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds(new Set()) }}
              placeholder="Search title, author…"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleBulkAction}
              disabled={selectedIds.size === 0 || !bulkAction || actionLoading === "bulk"}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                bulkAction === "publish"
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : bulkAction === "archive"
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-error text-white hover:bg-error-hover"
              }`}
            >
              {actionLoading === "bulk" ? <Loader2 size={16} className="animate-spin" /> : `${bulkAction?.toUpperCase()} (${filteredCount})`}
            </button>
            <select
              value={bulkAction || ""}
              onChange={(e) => setBulkAction(e.target.value as "publish" | "archive" | "delete" | "")}
              disabled={selectedIds.size === 0 || actionLoading === "bulk"}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">Bulk action…</option>
              <option value="publish">Publish selected</option>
              <option value="archive">Archive selected</option>
              <option value="delete">Delete selected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <p className="text-sm font-medium text-foreground/60">No posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Published</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => {
                          const next = new Set(selectedIds)
                          if (next.has(p.id)) next.delete(p.id)
                          else next.add(p.id)
                          setSelectedIds(next)
                        }}
                        className="rounded border-primary text-primary bg-transparent focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{p.title}</p>
                      {p.excerpt && <p className="max-w-xs truncate text-xs text-muted/70" title={p.excerpt}>{p.excerpt}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{p.authorName}</td>
                    <td className="px-4 py-3 text-sm text-muted">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          p.status === "PUBLISHED"
                            ? "border-emerald/30 bg-emerald/10 text-emerald-700"
                            : p.status === "DRAFT"
                              ? "border-amber/30 bg-amber/10 text-amber-700"
                              : "border-border bg-gray-50 text-muted"
                        }`}
                      >
                        {p.status === "PUBLISHED" ? "Published" : p.status === "DRAFT" ? "Draft" : "Archived"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted tabular-nums">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={13} /> View
                        </a>
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        {p.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(p.id)}
                            disabled={actionLoading === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald/30 bg-emerald/50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald/100 transition-colors disabled:opacity-50"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleArchive(p.id)}
                          disabled={actionLoading === p.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                        >
                          <Archive size={13} /> Archive
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
