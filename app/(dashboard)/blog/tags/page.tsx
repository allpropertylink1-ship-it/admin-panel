"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { Plus, Pencil, Trash2, AlertCircle } from "@/components/ui/icons"

interface BlogTag {
  id: string
  name: string
  slug: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export default function BlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formColor, setFormColor] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const COLORS = [
    "slate", "gray", "zinc", "neutral", "stone",
    "red", "orange", "amber", "yellow", "lime",
    "green", "emerald", "teal", "cyan", "sky",
    "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
    "primary", "error", "accent", "gold",
  ]

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: err } = await api.get<{ tags: BlogTag[]; total: number }>("/api/admin/blog/tags")
      if (err || !data) throw new Error(err || "No data")
      setTags(data.tags)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tags")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void (async () => { await fetchTags() })() }, [fetchTags])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await api.patch(`/api/admin/blog/tags/${editingId}`, { name: formName, color: formColor || null })
        if (error) throw new Error(error)
      } else {
        const { error } = await api.post("/api/admin/blog/tags", { name: formName, color: formColor || null })
        if (error) throw new Error(error)
      }
      setEditingId(null)
      setFormName("")
      setFormColor("")
      await fetchTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tag: BlogTag) => {
    setEditingId(tag.id)
    setFormName(tag.name)
    setFormColor(tag.color || "")
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormName("")
    setFormColor("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag? Posts using it will lose the tag assignment.")) return
    setDeletingId(id)
    try {
      const { error } = await api.delete(`/api/admin/blog/tags/${id}`)
      if (error) throw new Error(error)
      await fetchTags()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Blog Tags</h1>
          <p className="mt-1 text-sm text-muted">Organize posts with tags</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditingId(editingId ? null : null)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {editingId ? "Cancel" : "New Tag"}
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

      {editingId ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="tag-name">Name</label>
              <input
                id="tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="tag-color">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`w-8 h-8 rounded-lg border border-border transition-colors ${formColor === c ? "ring-2 ring-primary" : "hover:border-primary/30"}`}
                    style={{ backgroundColor: c === "gold" ? "#d97706" : c }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Pick a color for the tag badge</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={handleCancel} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50" disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50" disabled={saving || !formName.trim()}>
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Color</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">
                      No tags yet. Create your first tag.
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{tag.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{tag.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium border ${
                          tag.color ? `border-${tag.color}/30 bg-${tag.color}/10 text-${tag.color}` : "border-border bg-gray-50 text-muted"
                        }`}>
                          {tag.color || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(tag)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            disabled={deletingId === tag.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
