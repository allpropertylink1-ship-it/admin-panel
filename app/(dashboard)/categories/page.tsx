"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, Check, Loader2, Plus, Pencil, Trash2, Wrench } from "@/components/ui/icons"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  type: string
  parentId: string | null
  createdAt: string
  _count: { serviceListings: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", description: "", icon: "", type: "BOTH", parentId: "" })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedResult, setSeedResult] = useState("")
  const [mergeSource, setMergeSource] = useState("")
  const [mergeTarget, setMergeTarget] = useState("")
  const [mergePreview, setMergePreview] = useState<{ sourceName: string; targetName: string; listings: number; children: number } | null>(null)
  const [mergeLoading, setMergeLoading] = useState(false)
  const [mergeResult, setMergeResult] = useState("")

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<{ categories: Category[] }>("/api/admin/categories")
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
    setForm({ name: "", description: "", icon: "", type: "BOTH", parentId: "" })
    setFormError("")
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "",
      type: cat.type,
      parentId: cat.parentId || "",
    })
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
    setFormLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        icon: form.icon || undefined,
        type: form.type,
        parentId: form.parentId || undefined,
      }
      const { error } = editing
        ? await api.patch(`/api/admin/categories/${editing.id}`, payload)
        : await api.post("/api/admin/categories", payload)
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
      const { error } = await api.delete(`/api/admin/categories/${id}`)
      if (error) throw new Error(error)
      await fetchCategories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSeedTaxonomy() {
    setSeedLoading(true)
    setSeedResult("")
    try {
      const { data, error } = await api.post<{ started?: boolean; running?: boolean }>("/api/admin/categories/seed-taxonomy", {})
      if (error || !data) throw new Error(error || "No data")
      if (data.running) {
        setSeedResult("The sector menu is already loading — refresh this page in a few seconds.")
        return
      }
      // The server loads ~200 shelves in the background (takes ~30s).
      // Poll until a new sector root appears, then refresh.
      setSeedResult("Loading the sector menu in the background… this takes about 30 seconds. Please wait.")
      for (let i = 0; i < 18; i++) {
        await new Promise((r) => setTimeout(r, 5000))
        try {
          const check = await api.get<{ categories: Category[] }>("/api/admin/categories")
          if (check.data?.categories.some((c) => c.slug === "pets-veterinary")) {
            setSeedResult("Sector menu loaded.")
            await fetchCategories()
            return
          }
        } catch { /* keep polling */ }
      }
      setSeedResult("Still loading — refresh this page in a few seconds to see the sectors.")
      await fetchCategories()
    } catch (err: unknown) {
      setSeedResult(err instanceof Error ? err.message : "Failed to load sector menu")
    } finally {
      setSeedLoading(false)
    }
  }

  async function handleMergePreview() {
    setMergeLoading(true)
    setMergePreview(null)
    setMergeResult("")
    try {
      const source = categories.find((c) => c.id === mergeSource)
      const target = categories.find((c) => c.id === mergeTarget)
      if (!source || !target) throw new Error("Pick both a duplicate and its target")
      if (source.id === target.id) throw new Error("Duplicate and target must differ")
      const { data, error } = await api.post<{ plan: { sourceName: string; targetName: string; listings: number; children: number }[] }>(
        "/api/admin/categories/merge",
        { merges: [{ sourceId: source.id, targetSlug: target.slug }], dryRun: true }
      )
      if (error || !data) throw new Error(error || "No data")
      setMergePreview(data.plan[0])
    } catch (err: unknown) {
      setMergeResult(err instanceof Error ? err.message : "Preview failed")
    } finally {
      setMergeLoading(false)
    }
  }

  async function handleMergeConfirm() {
    if (!mergePreview) return
    setMergeLoading(true)
    setMergeResult("")
    try {
      const source = categories.find((c) => c.id === mergeSource)
      const target = categories.find((c) => c.id === mergeTarget)
      if (!source || !target) throw new Error("Pick both a duplicate and its target")
      const { data, error } = await api.post<{ moved: number }>("/api/admin/categories/merge", {
        merges: [{ sourceId: source.id, targetSlug: target.slug }],
      })
      if (error || !data) throw new Error(error || "No data")
      setMergeResult(`Joined “${source.name}” into “${target.name}” — ${data.moved} advert(s) moved.`)
      setMergePreview(null)
      setMergeSource("")
      setMergeTarget("")
      await fetchCategories()
    } catch (err: unknown) {
      setMergeResult(err instanceof Error ? err.message : "Join failed")
    } finally {
      setMergeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Service Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} categories · used by fundi &amp; service listings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleSeedTaxonomy}
          disabled={seedLoading}
          title="Load the 17 sector groups and their services (safe to re-run)"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {seedLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Load sector menu
        </button>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
        </div>
      </div>

      {seedResult && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {seedResult}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Join duplicates</h2>
        <p className="mt-0.5 text-xs text-muted">Move all adverts from a duplicate shelf into the correct one, then remove the empty duplicate. Preview first — joining cannot be undone.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="merge-source">Duplicate shelf</label>
            <select
              id="merge-source"
              value={mergeSource}
              onChange={(e) => { setMergeSource(e.target.value); setMergePreview(null); setMergeResult("") }}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select duplicate…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c._count.serviceListings})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground" htmlFor="merge-target">Correct shelf</label>
            <select
              id="merge-target"
              value={mergeTarget}
              onChange={(e) => { setMergeTarget(e.target.value); setMergePreview(null); setMergeResult("") }}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select target…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleMergePreview}
              disabled={mergeLoading || !mergeSource || !mergeTarget}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {mergeLoading ? "Checking…" : "Preview"}
            </button>
            {mergePreview && (
              <button
                onClick={handleMergeConfirm}
                disabled={mergeLoading || mergePreview.children > 0}
                title={mergePreview.children > 0 ? "Has sub-shelves — re-home them first" : "Move adverts and remove duplicate"}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                Join ({mergePreview.listings})
              </button>
            )}
          </div>
        </div>
        {mergePreview && (
          <p className="mt-2 text-xs text-muted" role="status">
            “{mergePreview.sourceName}” → “{mergePreview.targetName}”: {mergePreview.listings} advert(s) will move
            {mergePreview.children > 0 ? ` — blocked: ${mergePreview.children} sub-shelf/shelves inside` : ""}.
          </p>
        )}
        {mergeResult && (
          <p className="mt-2 text-xs text-muted" role="status">{mergeResult}</p>
        )}
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
            <Wrench size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No categories yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Listings</th>
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
                    <td className="px-4 py-3 text-xs text-muted">{c.type}</td>
                    <td className="px-4 py-3 text-sm text-foreground tabular-nums">{c._count.serviceListings}</td>
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
                          disabled={actionLoading === c.id || c._count.serviceListings > 0}
                          title={c._count.serviceListings > 0 ? "Cannot delete: listings use this category" : "Delete"}
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
                placeholder="e.g. Plumbing"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-type">Type</label>
                <select
                  id="cat-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="BOTH">BOTH</option>
                  <option value="FUNDI">FUNDI</option>
                  <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-icon">Icon</label>
                <input
                  id="cat-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="optional"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cat-parent">Parent (optional)</label>
              <select
                id="cat-parent"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">None (root category)</option>
                {categories.filter((c) => c.id !== editing?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
