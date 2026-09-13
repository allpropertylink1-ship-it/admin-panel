"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { AlertCircle, Loader2, Mail, CheckCircle, Trash2 } from "@/components/ui/icons"
import { TablePagination } from "@/components/shared/TablePagination"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  resolved: boolean
  createdAt: string
}

interface MessagesResponse {
  messages: ContactMessage[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const limit = 20

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (search) params.set("search", search)
      if (unreadOnly) params.set("unread", "1")
      const { data, error } = await api.get<MessagesResponse>(`/api/admin/messages?${params}`)
      if (error || !data) throw new Error(error || "No data")
      setMessages(data.messages)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setUnreadCount(data.unreadCount)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [page, search, unreadOnly])

  useEffect(() => { void (async () => { await fetchMessages() })() }, [fetchMessages])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function markRead(msg: ContactMessage, read: boolean) {
    setActionLoading(msg.id)
    try {
      const { error } = await api.patch(`/api/admin/messages/${msg.id}`, { read })
      if (error) throw new Error(error)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read } : m)))
      if (selected?.id === msg.id) setSelected({ ...selected, read })
      setUnreadCount((c) => (read ? Math.max(0, c - 1) : c + 1))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setActionLoading(null)
    }
  }

  async function markResolved(msg: ContactMessage, resolved: boolean) {
    setActionLoading(msg.id)
    try {
      const { error } = await api.patch(`/api/admin/messages/${msg.id}`, { resolved })
      if (error) throw new Error(error)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, resolved } : m)))
      if (selected?.id === msg.id) setSelected({ ...selected, resolved })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      const { error } = await api.delete(`/api/admin/messages/${id}`)
      if (error) throw new Error(error)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (selected?.id === id) setSelected(null)
      await fetchMessages()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Contact Messages</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={() => { setUnreadOnly((v) => !v); setPage(1) }}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          Unread only
        </label>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, subject, message…"
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
          <button onClick={fetchMessages} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Retry</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <Mail size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => { setSelected(m); if (!m.read) void markRead(m, true) }}
                    className={cn("cursor-pointer transition-colors hover:bg-gray-50/60", !m.read && "bg-primary/[0.04]")}
                  >
                    <td className="px-4 py-3">
                      <p className={cn("text-sm", !m.read ? "font-semibold text-foreground" : "text-foreground")}>{m.name}</p>
                      <p className="text-xs text-muted">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate text-sm text-foreground" title={m.subject || undefined}>{m.subject || "—"}</p>
                      <p className="max-w-xs truncate text-xs text-muted/70">{m.message}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {!m.read && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Unread</span>
                        )}
                        {m.resolved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle size={12} />Resolved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {!m.resolved && (
                          <button
                            onClick={() => markResolved(m, true)}
                            disabled={actionLoading === m.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={13} />
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={actionLoading === m.id}
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

        {totalPages > 1 && (
          <TablePagination page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={setPage} />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">{selected.subject || "No subject"}</h2>
            <p className="mt-1 text-xs text-muted">
              From {selected.name} ({selected.email}) · {new Date(selected.createdAt).toLocaleString()}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{selected.message}</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              {!selected.resolved && (
                <button
                  onClick={() => { void markResolved(selected, true); setSelected({ ...selected, resolved: true }) }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  Mark resolved
                </button>
              )}
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your message"}`)}`}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Reply
              </a>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
