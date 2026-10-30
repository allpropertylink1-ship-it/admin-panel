"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, ImageIcon, Link } from "@/components/ui/icons"

interface BlogCategory {
  id: string
  name: string
  slug: string
  color: string | null
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  coverImageAlt: string | null
  categoryId: string | null
  status: string
  featured: boolean
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
}

interface NewEditFormProps {
  isEdit: boolean
  postId?: string
  onSuccess: () => void
}

export default function BlogNewEditForm({ isEdit, postId, onSuccess }: NewEditFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    coverImageAlt: "",
    categoryId: "",
    status: "DRAFT",
    scheduledAt: "",
    seoTitle: "",
    seoDescription: "",
    featured: false,
  })

  const [uploadingCover, setUploadingCover] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const uploadCoverImage = async (file: File) => {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "blogs")
      const res = await fetch("/api/upload/public", {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Upload failed (${res.status})`)
      }
      const data = await res.json()
      setForm({ ...form, coverImage: data.url })
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Cover image upload failed")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadCoverImage(file)
  }

  const fetchPost = useCallback(async () => {
    if (!isEdit || !postId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get<{ post: BlogPost }>(`/api/admin/blog/posts/${postId}`)
      if (!data) throw new Error("No data")
      setForm({
        title: data.post.title,
        slug: data.post.slug,
        excerpt: data.post.excerpt || "",
        content: data.post.content,
        coverImage: data.post.coverImage || "",
        coverImageAlt: data.post.coverImageAlt || "",
        categoryId: data.post.categoryId || "",
        status: data.post.status,
        scheduledAt: data.post.publishedAt ? new Date(data.post.publishedAt).toISOString().slice(0, 16) : "",
        seoTitle: data.post.seoTitle || "",
        seoDescription: data.post.seoDescription || "",
        featured: data.post.featured,
      })
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [isEdit, postId])

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get<{ categories: BlogCategory[] }>("/api/blog/categories")
      if (data?.categories) setCategories(data.categories)
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    void (async () => {
      if (isEdit && postId) await fetchPost()
      await fetchCategories()
    })()
  }, [isEdit, postId, fetchPost, fetchCategories])

  const getEditorHTML = () => editorRef.current?.innerHTML || ""

  const formatCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value ?? undefined)
  }

  const insertImage = () => {
    const url = prompt("Image URL (e.g. /uploads/blogs/hero.jpg):")
    if (!url) return
    editorRef.current?.focus()
    document.execCommand("insertImage", false, url)
  }

  const insertLink = () => {
    const url = prompt("Link URL:")
    if (!url) return
    editorRef.current?.focus()
    document.execCommand("createLink", false, url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!form.title.trim()) {
      setFormError("Title is required")
      return
    }
    if (!getEditorHTML().trim() && !form.content.trim()) {
      setFormError("Content is required")
      return
    }

    setSaving(true)
    try {
      const slug = form.slug.trim() || form.title.trim()
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug,
        excerpt: form.excerpt.trim() || undefined,
        content: getEditorHTML() || form.content,
        coverImage: form.coverImage.trim() || undefined,
        coverImageAlt: form.coverImageAlt.trim() || undefined,
        categoryId: form.categoryId || undefined,
        status: form.status,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        featured: form.featured,
      }

      // Scheduled publishing: pass a future publishedAt so the post goes live at that time
      if (form.status === "SCHEDULED" && form.scheduledAt) {
        payload.status = "PUBLISHED"
        payload.publishedAt = form.scheduledAt
      }

      const { error } = isEdit && postId
        ? await api.patch(`/api/admin/blog/posts/${postId}`, payload)
        : await api.post("/api/admin/blog/posts", payload)

      if (error) throw new Error(error)
      onSuccess()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-title">Title</label>
            <input
              id="post-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Nairobi Market Trends 2026"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-slug">Slug</label>
            <input
              id="post-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g. nairobi-market-trends-2026"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-muted">Auto-generated from title if left blank</p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-category">Category</label>
            <select
              id="post-category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-status">Status</label>
            <select
              id="post-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" })}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Publish now</option>
              <option value="SCHEDULED">Schedule for later</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          {form.status === "SCHEDULED" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-scheduled-at">Publish at</label>
              <input
                id="post-scheduled-at"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-xs text-muted">Post will be published automatically at this time.</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              id="post-featured"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="rounded border-primary text-primary bg-transparent focus:ring-primary"
            />
            <label className="text-sm font-medium text-foreground" htmlFor="post-featured">Featured post</label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Content</h2>
          <div className="flex gap-2">
            <button onClick={() => formatCommand("bold")} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-gray-50"><strong>B</strong></button>
            <button onClick={() => formatCommand("italic")} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-gray-50"><em>I</em></button>
            <button onClick={() => formatCommand("formatBlock", "<h2>")} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-gray-50">H2</button>
            <button onClick={() => formatCommand("formatBlock", "<p>")} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-gray-50">P</button>
            <button onClick={() => formatCommand("insertUnorderedList")} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-gray-50"><PlusIcon size={12} /></button>
            <button onClick={insertImage} className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:bg-gray-50"><ImageIcon size={14} /></button>
            <button onClick={insertLink} className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:bg-gray-50"><Link size={14} /></button>
          </div>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: form.content }}
          onInput={(e) => setForm({ ...form, content: (e.target as HTMLDivElement).innerHTML })}
          className="rounded-xl border border-border bg-white min-h-[400px] p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          spellCheck
        />
        {formError && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            {formError}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-excerpt">Excerpt (intro)</label>
            <textarea
              id="post-excerpt"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={3}
              placeholder="Short intro shown on listing cards"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-muted">Auto-generated from content if left blank</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-cover-alt">Cover image alt text</label>
            <input
              id="post-cover-alt"
              value={form.coverImageAlt}
              onChange={(e) => setForm({ ...form, coverImageAlt: e.target.value })}
              placeholder="Descriptive alt text for accessibility"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-cover-image">Cover image</label>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <input
                id="post-cover-image"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="/uploads/blogs/hero.jpg"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <label
                  className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("post-cover-file")?.click()}
                >
                  <input
                    id="post-cover-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverFileChange}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                  {uploadingCover ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ImageIcon size={14} />
                  )}
                  <span className="text-xs">{uploadingCover ? "Uploading…" : "Upload file"}</span>
                </label>
              </div>
            </div>
            {form.coverImage && (
              <p className="mt-1 text-xs text-muted">Stored at {form.coverImage}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-seo-title">SEO title</label>
            <input
              id="post-seo-title"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder="Overrides page title for search engines"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="post-seo-description">SEO description</label>
            <textarea
              id="post-seo-description"
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              rows={2}
              placeholder="Meta description for search results"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/blog")}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Archive this post? It will be removed from the site.")) {
                setSaving(true)
                api.delete(`/api/admin/blog/posts/${postId}`).then(({ error }) => {
                  if (error) setFormError(error)
                  else onSuccess()
                }).finally(() => setSaving(false))
              }
            }}
            disabled={saving}
            className="rounded-xl border border-error px-4 py-2 text-sm font-medium text-error hover:bg-error-50 transition-colors disabled:opacity-50"
          >
            Archive
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
        </button>
      </div>
    </form>
  )
}

function PlusIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
