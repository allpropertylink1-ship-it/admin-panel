"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, Loader2, Clock, Pencil, Trash2 } from "@/components/ui/icons"

interface BlogPostRevision {
  id: string
  title: string
  excerpt: string | null
  content: string
  createdAt: string
  createdBy: string | null
}

interface BlogPost {
  id: string
  slug: string
  title: string
  status: string
}

export default function BlogRevisionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const postId = Array.isArray(searchParams.id) ? searchParams.id[0] : searchParams.id
  const [post, setPost] = useState<BlogPost | null>(null)
  const [revisions, setRevisions] = useState<BlogPostRevision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    if (!postId) return
    try {
      const { data, error: err } = await api.get<{ post: BlogPost }>(`/api/admin/blog/posts/${postId}`)
      if (err || !data) throw new Error(err || "No data")
      setPost(data.post)
    } catch {
      // Non-fatal — revisions can still load
    }
  }, [postId])

  const fetchRevisions = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError("")
    try {
      const { data, error: err } = await api.get<{ revisions: BlogPostRevision[]; total: number }>(
        `/api/admin/blog/posts/${postId}/revisions`
      )
      if (err || !data) throw new Error(err || "No data")
      setRevisions(data.revisions)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load revisions")
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    void (async () => { await Promise.all([fetchPost(), fetchRevisions()]) })()
  }, [fetchPost, fetchRevisions])

  const handleRestore = async (id: string) => {
    if (!confirm("Restore this revision? It will replace the current post content.")) return
    setRestoringId(id)
    try {
      const { data, error } = await api.post<{ post: BlogPost }>(`/api/admin/blog/posts/${postId}/revisions/${id}/restore`)
      if (error) throw new Error(error)
      if (data?.post) setPost(data.post)
      await fetchRevisions()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to restore revision")
    } finally {
      setRestoringId(null)
    }
  }

  if (!postId) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Revision History</h1>
          <p className="mt-1 text-sm text-muted">{post?.title || "Post"}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/dashboard/blog/${postId}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            <Pencil size={16} />
            Edit post
          </a>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Dismiss</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <Clock size={32} className="mb-3 shrink-0" />
            <p className="text-sm font-medium text-foreground/60">No revisions yet</p>
            <p className="text-xs text-muted">Revisions are saved automatically when you edit a post&rsquo;s title, excerpt, or content.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Excerpt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Saved at</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Saved by</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revisions.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{r.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted whitespace-pre-wrap line-clamp-2">{r.excerpt || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted tabular-nums">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{r.createdBy || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRestore(r.id)}
                          disabled={restoringId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald/30 bg-emerald/50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald/100 transition-colors disabled:opacity-50"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors"
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

function handleDelete(_id: string) {
  // Placeholder — delete revision endpoint not yet implemented
  alert("Delete revision not yet implemented")
}
