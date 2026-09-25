"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  AlertCircle, Loader2, Flag,
  ChevronDown, CheckCircle2, X,
} from "@/components/ui/icons"
import { TablePagination } from "@/components/shared/TablePagination"
import { TableSkeleton } from "@/components/shared/TableSkeleton"

interface QueueIssue {
  code: string
  label: string
  fixHref: string
}

interface QueueListing {
  kind: string
  id: string
  title: string
  slug: string | null
  issues: QueueIssue[]
}

interface QueueUser {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  createdAt: string
  rep: { id: string; fullName: string; agentCode: string } | null
  issues: QueueIssue[]
  listings: QueueListing[]
}

interface OrphanRow {
  id: string
  title: string
  slug: string
  issues: QueueIssue[]
}

interface DuplicateMember {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  createdAt: string
  listings: number
}

interface DuplicateGroup {
  key: string
  members: DuplicateMember[]
  dismissedPairs?: string[][]
}

interface IssuesResponse {
  users: QueueUser[]
  totalUsers: number
  page: number
  totalPages: number
  orphans: OrphanRow[]
  duplicates: DuplicateGroup[]
  dismissed: DuplicateGroup[]
  summary: {
    noContacts: number
    pendingResets: number
    unassigned: number
    kycOpen: number
    orphanListings: number
    duplicateGroups: number
  }
}

interface Rep {
  id: string
  fullName: string
  agentCode: string
  status: string
}

const ISSUE_CODES = ["", "NO_EMAIL", "NO_PHONE", "PASSWORD_RESET_PENDING", "KYC_INCOMPLETE", "ACCOUNT_PENDING", "ROLE_TRADE_MISMATCH", "COMPANY_HTML", "NO_LOCATION", "NO_COVER", "NO_PHOTOS", "LEGACY_PHOTOS", "NO_PIN", "TRADE_MISMATCH"]

const CRITICAL_USER_CODES = new Set(["NO_EMAIL", "NO_PHONE", "ACCOUNT_PENDING"])

type KindTab = "users" | "orphans" | "duplicates"

function severityOf(user: QueueUser): "critical" | "warning" {
  return user.issues.some((i) => CRITICAL_USER_CODES.has(i.code)) ? "critical" : "warning"
}

// ---------------------------------------------------------------------------
// Small building blocks (panel tokens, 44px targets, aria-correct)
// ---------------------------------------------------------------------------

function Toast({ toast, onClose }: { toast: { kind: "success" | "error"; text: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(t)
  }, [toast, onClose])
  if (!toast) return null
  return (
    <div aria-live="polite" role="status"
      className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        toast.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700")}>
      {toast.kind === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
      <span className="min-w-0 flex-1">{toast.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="touch-target rounded-lg p-1 hover:bg-black/5">
        <X size={14} />
      </button>
    </div>
  )
}

function ConfirmModal({ open, title, lines, confirmLabel, danger, loading, onConfirm, onClose }: {
  open: boolean
  title: string
  lines: string[]
  confirmLabel: string
  danger?: boolean
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <div className="space-y-1.5 px-5 py-4">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            {lines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={loading}
            className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={cn("touch-target inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-hover")}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactRepairRow({ userId, hasEmail, hasPhone, busy, onSave }: {
  userId: string
  hasEmail: boolean
  hasPhone: boolean
  busy: boolean
  onSave: (patch: { email?: string; phone?: string }) => Promise<void>
}) {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
      <p className="text-xs font-semibold text-foreground">Unreachable account — add a way to reach them</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {!hasEmail && (
          <div>
            <label htmlFor={`contact-email-${userId}`} className="block text-[11px] font-semibold text-muted">Email address</label>
            <input id={`contact-email-${userId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" autoComplete="off"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        )}
        {!hasPhone && (
          <div>
            <label htmlFor={`contact-phone-${userId}`} className="block text-[11px] font-semibold text-muted">Phone number</label>
            <input id={`contact-phone-${userId}`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547…" autoComplete="off"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        )}
      </div>
      <button type="button" disabled={busy || (!email.trim() && !phone.trim())}
        onClick={() => {
          const patch: { email?: string; phone?: string } = {}
          if (email.trim()) patch.email = email.trim()
          if (phone.trim()) patch.phone = phone.trim()
          void onSave(patch)
        }}
        className="touch-target mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {busy && <Loader2 size={14} className="animate-spin" />}
        Save contact
      </button>
    </div>
  )
}

function IssueChip({ code }: { code: string }) {  const critical = CRITICAL_USER_CODES.has(code)
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
      critical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
      {critical && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-500" />}
      {code}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IssuesPage() {
  const [data, setData] = useState<IssuesResponse | null>(null)
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<KindTab>("users")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [rep, setRep] = useState("all")
  const [code, setCode] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState<QueueUser | null>(null)
  const [moveRep, setMoveRep] = useState("")
  const [confirm, setConfirm] = useState<null | {
    title: string
    lines: string[]
    confirmLabel: string
    danger?: boolean
    run: () => Promise<void>
  }>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [mergeWinners, setMergeWinners] = useState<Record<string, string>>({})
  const [showDismissed, setShowDismissed] = useState(false)
  const pageSize = 20

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const p = new URLSearchParams()
      p.set("page", String(page))
      p.set("pageSize", String(pageSize))
      if (search) p.set("search", search)
      if (rep !== "all") p.set("rep", rep)
      if (code) p.set("code", code)
      if (showDismissed) p.set("showDismissed", "1")
      const { data: d, error } = await api.get<IssuesResponse>(`/api/admin/issues?${p}`)
      if (error || !d) throw new Error(error || "No data")
      setData(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load issues")
    } finally {
      setLoading(false)
    }
  }, [page, search, rep, code, showDismissed])

  const fetchReps = useCallback(async () => {
    const { data } = await api.get<{ agents: Rep[] }>(`/api/admin/agents?limit=100`)
    if (data?.agents) setReps(data.agents.filter((r) => r.status === "ACTIVE"))
  }, [])

  useEffect(() => { void (async () => { await fetchIssues() })() }, [fetchIssues])
  useEffect(() => { void (async () => { await fetchReps() })() }, [fetchReps])

  const closeToast = useCallback(() => setToast(null), [])

  async function runConfirm() {
    if (!confirm) return
    setConfirmBusy(true)
    try {
      await confirm.run()
      setConfirm(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function pickCard(filter: { tab?: KindTab; code?: string; rep?: string }) {
    if (filter.tab) setTab(filter.tab)
    setCode(filter.code ?? "")
    setRep(filter.rep ?? "all")
    setPage(1)
  }

  async function doReassign(userId: string, repId: string | null) {
    setActionLoading(userId)
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, { aplAgentId: repId })
      if (error) throw new Error(error)
      setMoveTarget(null)
      setToast({ kind: "success", text: repId ? "Person moved to the chosen representative." : "Person moved to the Unassigned pile." })
      await fetchIssues()
    } catch (err: unknown) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Failed to move" })
    } finally {
      setActionLoading(null)
    }
  }

  async function doMerge(groupKey: string, members: DuplicateGroup["members"]) {
    const winnerId = mergeWinners[groupKey] || members[0].id
    const losers = members.filter((m) => m.id !== winnerId)
    if (losers.length === 0) return
    setActionLoading(`merge-${groupKey}`)
    try {
      for (const loser of losers) {
        const { error } = await api.post(`/api/admin/issues/duplicates/merge`, { winnerId, loserId: loser.id })
        if (error) throw new Error(error)
      }
      setToast({ kind: "success", text: `Merged ${losers.length} duplicate${losers.length === 1 ? "" : "s"} — houses, services and ID documents moved over.` })
      await fetchIssues()
    } catch (err: unknown) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Failed to merge" })
    } finally {
      setActionLoading(null)
    }
  }

  async function doDismiss(groupKey: string, members: DuplicateGroup["members"]) {
    const pairs: [string, string][] = []
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) pairs.push([members[i].id, members[j].id])
    }
    setActionLoading(`dismiss-${groupKey}`)
    try {
      for (const [a, b] of pairs) {
        const { error } = await api.post(`/api/admin/issues/duplicates/dismiss`, { userId1: a, userId2: b })
        if (error) throw new Error(error)
      }
      setToast({ kind: "success", text: "Marked as separate people — they left the queue. Reversible below." })
      await fetchIssues()
    } catch (err: unknown) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Failed to dismiss" })
    } finally {
      setActionLoading(null)
    }
  }

  async function doUndismiss(groupKey: string, members: DuplicateGroup["members"]) {
    setActionLoading(`dismiss-${groupKey}`)
    try {
      const pairs: [string, string][] = []
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) pairs.push([members[i].id, members[j].id])
      }
      for (const [a, b] of pairs) {
        const { error } = await api.post(`/api/admin/issues/duplicates/undismiss`, { userId1: a, userId2: b })
        if (error) throw new Error(error)
      }
      setToast({ kind: "success", text: "Verdict undone — the group is back in the queue." })
      await fetchIssues()
    } catch (err: unknown) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Failed to undo" })
    } finally {
      setActionLoading(null)
    }
  }

  const summary = data?.summary
  const tabs: { key: KindTab; label: string; count: number }[] = [
    { key: "users", label: "People", count: data?.totalUsers ?? 0 },
    { key: "orphans", label: "Ownerless houses", count: data?.orphans.length ?? 0 },
    { key: "duplicates", label: "Duplicates", count: data?.duplicates.length ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Issues Queue</h1>
        <p className="mt-1 text-sm text-muted">Everyone and everything that needs a human — most urgent first. Red means blocked, amber means incomplete.</p>
      </div>

      <Toast toast={toast} onClose={closeToast} />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Issue summary — select a card to filter">
          {[
            { label: "No way to reach", value: summary.noContacts, hint: "No email and no phone", danger: true, run: () => pickCard({ tab: "users", code: "" }) },
            { label: "Ownerless houses", value: summary.orphanListings, hint: "No owner at all", danger: true, run: () => pickCard({ tab: "orphans" }) },
            { label: "Duplicate groups", value: summary.duplicateGroups, hint: "Compare, merge or keep", danger: false, run: () => pickCard({ tab: "duplicates" }) },
            { label: "Pending resets", value: summary.pendingResets, hint: "Must set passwords", danger: false, run: () => pickCard({ tab: "users", code: "PASSWORD_RESET_PENDING" }) },
            { label: "KYC open", value: summary.kycOpen, hint: "ID check unfinished", danger: false, run: () => pickCard({ tab: "users", code: "KYC_INCOMPLETE" }) },
            { label: "Unassigned", value: summary.unassigned, hint: "People with no rep", danger: false, run: () => pickCard({ tab: "users", rep: "unassigned" }) },
          ].map((s) => (
            <button key={s.label} type="button" onClick={s.run}
              className={cn("touch-target rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30",
                s.danger && s.value > 0 && "border-red-200 bg-red-50/40")}>
              <p className="flex items-center gap-1.5 text-2xl font-bold text-foreground tabular-nums">
                {s.danger && s.value > 0 && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />}
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted">{s.hint} — tap to view</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-border bg-gray-50/50 p-1" role="tablist" aria-label="Queue sections">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("touch-target flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none",
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground")}>
            {t.label}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "users" && (
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone…"
            aria-label="Search people"
            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1) }}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Filter by representative">
            <option value="all">All reps</option>
            <option value="unassigned">Unassigned pile</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>{r.fullName} ({r.agentCode})</option>
            ))}
          </select>
          <select value={code} onChange={(e) => { setCode(e.target.value); setPage(1) }}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Filter by issue type">
            <option value="">All issue types</option>
            {ISSUE_CODES.slice(1).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="touch-target rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        </form>
      )}

      {loading ? (
        <TableSkeleton columns={[{ width: "w-40" }, { width: "w-32" }, { width: "w-24" }, { width: "w-20" }]} rows={8} />
      ) : error ? (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle size={16} /> {error}
        </p>
      ) : tab === "users" ? (
        <section aria-label="People with issues" className="overflow-hidden rounded-xl border border-border bg-card">
          {(data?.users ?? []).length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted" role="status">Nobody needs attention under these filters.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(data?.users ?? []).map((u) => {
                const open = !!expanded[u.id]
                const sev = severityOf(u)
                return (
                  <li key={u.id}>
                    <button type="button" onClick={() => setExpanded((p) => ({ ...p, [u.id]: !p[u.id] }))}
                      aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${u.firstName} ${u.lastName}`}
                      className="touch-target flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50/60">
                      <span aria-hidden="true" className={cn("h-2.5 w-2.5 shrink-0 rounded-full", sev === "critical" ? "bg-red-500" : "bg-amber-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{u.firstName} {u.lastName}</span>
                        <span className="block truncate text-xs text-muted">
                          {u.email || "No email"} · {u.phone || "No phone"} · {u.rep ? u.rep.fullName : "Unassigned"}
                          {u.issues.length > 0 && ` · ${u.issues[0].label}`}
                          {u.listings.length > 0 && ` · ${u.listings.length} listing${u.listings.length === 1 ? "" : "s"} flagged`}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                        {u.issues.length + u.listings.reduce((n, l) => n + l.issues.length, 0)}
                      </span>
                      <ChevronDown size={16} className={cn("shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
                    </button>
                    {open && (
                      <div className="space-y-3 border-t border-border bg-gray-50/40 px-4 py-3">
                        <ul className="space-y-1.5">
                          {u.issues.map((i) => (
                            <li key={i.code}>
                              <Link href={i.fixHref} className="group inline-flex items-start gap-2 text-xs text-muted hover:text-primary">
                                <IssueChip code={i.code} />
                                <span className="group-hover:underline">{i.label}</span>
                              </Link>
                            </li>
                          ))}
                          {u.listings.map((l) => (
                            <li key={`${l.kind}-${l.id}`} className="text-xs text-muted">
                              <span className="font-medium text-foreground">{l.kind === "property" ? "House" : "Service"}: {l.title.slice(0, 60)}</span>
                              <span className="ml-1.5">{l.issues.map((i) => i.code).join(" · ")}</span>
                              {" — "}
                              <Link href={l.issues[0]?.fixHref || "/properties"} className="font-semibold text-primary hover:underline">Fix</Link>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/users/${u.id}`}
                            className="touch-target inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-primary hover:bg-gray-50">
                            Open person
                          </Link>
                          <button type="button" onClick={() => { setMoveTarget(u); setMoveRep(u.rep?.id || "") }}
                            className="touch-target inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-gray-50">
                            Move to rep…
                          </button>
                        </div>
                        {(u.issues.some((i) => i.code === "NO_EMAIL" || i.code === "NO_PHONE")) && (
                          <ContactRepairRow
                            userId={u.id}
                            hasEmail={!!u.email}
                            hasPhone={!!u.phone}
                            busy={actionLoading === `contact-${u.id}`}
                            onSave={async (patch) => {
                              setActionLoading(`contact-${u.id}`)
                              try {
                                const { error } = await api.patch(`/api/admin/users/${u.id}`, patch)
                                if (error) throw new Error(error)
                                setToast({ kind: "success", text: "Contact saved — the person can now log in." })
                                await fetchIssues()
                              } catch (err: unknown) {
                                setToast({ kind: "error", text: err instanceof Error ? err.message : "Failed to save contact" })
                              } finally {
                                setActionLoading(null)
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <TablePagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} total={data?.totalUsers ?? 0} pageSize={pageSize} onPageChange={setPage} />
        </section>
      ) : tab === "orphans" ? (
        <section aria-label="Ownerless houses" className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border bg-red-50/40 px-4 py-2.5 text-xs text-red-800">
            These houses belong to nobody — claim each one for its real owner from the house page.
          </p>
          {(data?.orphans ?? []).length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted" role="status">No ownerless houses. Everything is claimed.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(data?.orphans ?? []).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {o.issues.map((i) => <IssueChip key={i.code} code={i.code} />)}
                      {o.issues.length === 0 && <span className="text-xs text-muted">needs an owner</span>}
                    </p>
                  </div>
                  <Link href="/properties" className="touch-target rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-gray-50">
                    Find owner
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section aria-label="Possible duplicates" className="space-y-4">
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted">
            Same name, side by side — compare the contact columns first (your rule: contacts decide). Merge moves everything into the kept account; <strong>Not duplicates</strong> files the verdict permanently.
          </p>
          {(data?.duplicates ?? []).length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted" role="status">No duplicate names found.</p>
          ) : (
            (data?.duplicates ?? []).map((g) => (
              <article key={g.key} className="overflow-hidden rounded-xl border border-border bg-card">
                <h3 className="border-b border-border px-4 py-3 text-sm font-semibold capitalize text-foreground">{g.key}</h3>
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-gray-50/60 text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">Keep?</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Email</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Phone</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Listings</th>
                        <th scope="col" className="px-4 py-2.5"><span className="sr-only">Open</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {g.members.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input type="radio" name={`winner-${g.key}`} value={m.id}
                                defaultChecked={mergeWinners[g.key] === m.id || (!mergeWinners[g.key] && g.members[0].id === m.id)}
                                onChange={() => setMergeWinners((prev) => ({ ...prev, [g.key]: m.id }))}
                                className="h-4 w-4 accent-primary" aria-label={`Keep ${m.email || m.phone || m.id}`} />
                              <span className="font-medium text-foreground">Keep</span>
                            </label>
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-2.5 text-muted">{m.email || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted tabular-nums">{m.phone || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 text-muted tabular-nums">{m.listings}</td>
                          <td className="px-4 py-2.5">
                            <Link href={`/users/${m.id}`} className="font-semibold text-primary hover:underline">Open</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {g.dismissedPairs && g.dismissedPairs.length > 0 && (
                  <p className="border-t border-border bg-gray-50/60 px-4 py-2 text-[11px] text-muted">
                    {g.dismissedPairs.length} pair{g.dismissedPairs.length === 1 ? "" : "s"} already judged separate.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                  <button type="button"
                    onClick={() => {
                      const winnerId = mergeWinners[g.key] || g.members[0].id
                      const loserCount = g.members.length - 1
                      const winner = g.members.find((m) => m.id === winnerId)
                      setConfirm({
                        title: `Merge into ${winner?.email || winner?.phone || "kept account"}?`,
                        lines: [
                          `${loserCount} duplicate${loserCount === 1 ? "" : "s"} will be retired.`,
                          "Their houses, services and ID documents move to the kept account.",
                          "Blank contact details are filled in from the retired ones.",
                          "This cannot be undone.",
                        ],
                        confirmLabel: "Merge now",
                        danger: true,
                        run: () => doMerge(g.key, g.members),
                      })
                    }}
                    disabled={actionLoading === `merge-${g.key}` || actionLoading === `dismiss-${g.key}`}
                    className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    {actionLoading === `merge-${g.key}` ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                    Merge into kept account
                  </button>
                  <button type="button"
                    onClick={() => {
                      setConfirm({
                        title: "These are separate people?",
                        lines: [
                          `${g.members.length} accounts leave the queue.`,
                          "The verdict is saved permanently with your name on it.",
                          "You can undo it anytime under “Decided groups”.",
                        ],
                        confirmLabel: "Yes, keep separate",
                        run: () => doDismiss(g.key, g.members),
                      })
                    }}
                    disabled={actionLoading === `dismiss-${g.key}` || actionLoading === `merge-${g.key}`}
                    className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-gray-50 disabled:opacity-50">
                    {actionLoading === `dismiss-${g.key}` ? <Loader2 size={14} className="animate-spin" /> : null}
                    Not duplicates — keep separate
                  </button>
                </div>
              </article>
            ))
          )}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <button type="button" onClick={() => setShowDismissed((v) => !v)} aria-expanded={showDismissed}
              className="touch-target flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-gray-50/60">
              <span>Decided groups ({data?.dismissed.length ?? 0})</span>
              <ChevronDown size={16} className={cn("text-muted transition-transform duration-200", showDismissed && "rotate-180")} />
            </button>
            {showDismissed && (
              <ul className="divide-y divide-border border-t border-border">
                {(data?.dismissed ?? []).length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-muted" role="status">No decided groups yet.</li>
                ) : (
                  (data?.dismissed ?? []).map((g) => (
                    <li key={g.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold capitalize text-foreground">{g.key}</p>
                        <p className="truncate text-[11px] text-muted">{g.members.length} accounts · judged separate</p>
                      </div>
                      <button type="button" onClick={() => void doUndismiss(g.key, g.members)}
                        disabled={actionLoading === `dismiss-${g.key}`}
                        className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-gray-50 disabled:opacity-50">
                        {actionLoading === `dismiss-${g.key}` ? <Loader2 size={14} className="animate-spin" /> : "Undo"}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setMoveTarget(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Move ${moveTarget.firstName} ${moveTarget.lastName}`}
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Move person</h3>
              <p className="mt-0.5 text-xs text-muted">
                {moveTarget.firstName} {moveTarget.lastName} · currently {moveTarget.rep ? moveTarget.rep.fullName : "Unassigned"}
              </p>
            </div>
            <div className="space-y-2 px-5 py-4">
              <label htmlFor="move-rep-select" className="block text-xs font-semibold text-foreground">Representative</label>
              <select id="move-rep-select" value={moveRep} onChange={(e) => setMoveRep(e.target.value)}
                className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Unassigned pile</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>{r.fullName} ({r.agentCode})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button type="button" onClick={() => setMoveTarget(null)} disabled={actionLoading === moveTarget.id}
                className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={() => void doReassign(moveTarget.id, moveRep || null)} disabled={actionLoading === moveTarget.id}
                className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {actionLoading === moveTarget.id && <Loader2 size={14} className="animate-spin" />}
                Confirm move
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm !== null}
        title={confirm?.title || ""}
        lines={confirm?.lines || []}
        confirmLabel={confirm?.confirmLabel || "Confirm"}
        danger={confirm?.danger}
        loading={confirmBusy}
        onConfirm={runConfirm}
        onClose={() => { if (!confirmBusy) setConfirm(null) }}
      />
    </div>
  )
}
