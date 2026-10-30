"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, Loader2, Plus, Pencil, Trash2 } from "@/components/ui/icons"

interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  _count: { posts: number }
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BlogCategory | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", color: "" })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<{ categories: BlogCategory[] }>("/api/admin/blog/categories")
      if (error || !data) throw new Error(error || "No data")
      setCategories(data.categories)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void (async () => { await fetchCategories() })() }, [fetchCategories])

  function openCreate() {
    setEditing(null)
    setForm({ name: "", slug: "", description: "", color: "" })
    setFormError("")
    setShowModal(true)
  }

  function openEdit(cat: BlogCategory) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", color: cat.color || "" })
    setFormError("")
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!form.name.trim()) {
      setFormError("Name is required")
      return
    }
    const slug = form.slug.trim() || form.name.trim()
    setFormLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description || undefined,
        color: form.color || undefined,
      }
      const { error } = editing
        ? await api.patch(`/api/admin/blog/categories/${editing.id}`, payload)
        : await api.post("/api/admin/blog/categories", payload)
      if (error) throw new Error(error)
      setShowModal(false)
      await fetchCategories()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save category")
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      const { error } = await api.delete(`/api/admin/blog/categories/${id}`)
      if (error) throw new Error(error)
      await fetchCategories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Blog Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} categories</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            Add Category
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

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <p className="text-sm font-medium text-foreground/60">No categories yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Posts</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      {c.description && <p className="max-w-xs truncate text-xs text-muted/70" title={c.description}>{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{c.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium border ${
                          c.color ? `border-${c.color}/30 bg-${c.color}/10 text-${c.color}` : "border-border bg-gray-50 text-muted"
                        }`}
                      >
                        {c.color || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted tabular-nums">{c._count.posts}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={actionLoading === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Delete
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Category" : "Add Category"}</h2>
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                {formError}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Market Trends"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-slug">Slug</label>
              <input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. market-trends"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-color">Accent color</label>
              <select
                id="cat-color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">None</option>
                <option value="teal">Teal</option>
                <option value="gold">Gold</option>
                <option value="amber">Amber</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {formLoading ? "Saving…" : editing ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
