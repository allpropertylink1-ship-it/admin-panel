"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { AlertCircle, Loader2, Flag, Users, Building2, Copy } from "@/components/ui/icons"
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

interface DuplicateGroup {
  key: string
  members: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null }[]
}

interface IssuesResponse {
  users: QueueUser[]
  totalUsers: number
  page: number
  totalPages: number
  orphans: OrphanRow[]
  duplicates: DuplicateGroup[]
  summary: {
    blankEmails: number
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

const ISSUE_CODES = ["", "NO_EMAIL", "NO_PHONE", "PASSWORD_RESET_PENDING", "KYC_INCOMPLETE", "ACCOUNT_PENDING", "ROLE_TRADE_MISMATCH", "COMPANY_HTML", "NO_LOCATION", "NO_COVER", "NO_PHOTOS", "LEGACY_PHOTOS", "NO_PIN"]

export default function IssuesPage() {
  const [data, setData] = useState<IssuesResponse | null>(null)
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [rep, setRep] = useState("all")
  const [code, setCode] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [reassignFor, setReassignFor] = useState<string | null>(null)
  const [mergeWinners, setMergeWinners] = useState<Record<string, string>>({})
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
      const { data: d, error } = await api.get<IssuesResponse>(`/api/admin/issues?${p}`)
      if (error || !d) throw new Error(error || "No data")
      setData(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load issues")
    } finally {
      setLoading(false)
    }
  }, [page, search, rep, code])

  const fetchReps = useCallback(async () => {
    const { data } = await api.get<{ agents: Rep[] }>(`/api/admin/agents?limit=100`)
    if (data?.agents) setReps(data.agents.filter((r) => r.status === "ACTIVE"))
  }, [])

  useEffect(() => { void (async () => { await fetchIssues() })() }, [fetchIssues])
  useEffect(() => { void (async () => { await fetchReps() })() }, [fetchReps])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleReassign(userId: string, repId: string | null) {
    setActionLoading(userId)
    setActionError("")
    try {
      const { error } = await api.patch(`/api/admin/users/${userId}`, { aplAgentId: repId })
      if (error) throw new Error(error)
      setReassignFor(null)
      await fetchIssues()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to reassign")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleMerge(groupKey: string, members: DuplicateGroup["members"]) {
    const winnerId = mergeWinners[groupKey] || members[0].id
    const losers = members.filter((m) => m.id !== winnerId)
    if (losers.length === 0) return
    if (!window.confirm(`Merge ${losers.length} duplicate(s) into the selected account? Their houses, services and ID documents move over; duplicates are retired. This cannot be undone.`)) return
    setActionLoading(`merge-${groupKey}`)
    setActionError("")
    try {
      for (const loser of losers) {
        const { error } = await api.post(`/api/admin/issues/duplicates/merge`, { winnerId, loserId: loser.id })
        if (error) throw new Error(error)
      }
      await fetchIssues()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to merge")
    } finally {
      setActionLoading(null)
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Issues Queue</h1>
        <p className="mt-1 text-sm text-muted">Every account and listing problem in one place — reassign, merge, or follow the link to fix it where it lives.</p>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Blank emails", value: summary.blankEmails },
            { label: "Pending resets", value: summary.pendingResets },
            { label: "Unassigned", value: summary.unassigned },
            { label: "KYC open", value: summary.kycOpen },
            { label: "Ownerless houses", value: summary.orphanListings },
            { label: "Duplicate groups", value: summary.duplicateGroups },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {actionError && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle size={16} /> {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone…"
            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="touch-target rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        </form>
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
          aria-label="Filter by issue code">
          <option value="">All issue types</option>
          {ISSUE_CODES.slice(1).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton columns={[{ width: "w-40" }, { width: "w-32" }, { width: "w-24" }, { width: "w-20" }]} rows={8} />
      ) : error ? (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle size={16} /> {error}
        </p>
      ) : (
        <>
          <section aria-label="People with issues" className="overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              <Users size={16} /> People ({data?.totalUsers ?? 0})
            </h2>
            {(data?.users ?? []).length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted" role="status">Nobody needs attention under these filters.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(data?.users ?? []).map((u) => (
                  <li key={u.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{u.firstName} {u.lastName}</p>
                        <p className="truncate text-xs text-muted">{u.email || "No email"} · {u.phone || "No phone"} · {u.rep ? u.rep.fullName : "Unassigned"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/users/${u.id}`} className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-gray-50">Open</Link>
                        <button type="button" onClick={() => setReassignFor(reassignFor === u.id ? null : u.id)}
                          disabled={actionLoading === u.id}
                          className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-gray-50 disabled:opacity-50">
                          {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : "Move"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.issues.map((i) => (
                        <span key={i.code} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">{i.code}</span>
                      ))}
                      {u.listings.map((l) => (
                        <span key={`${l.kind}-${l.id}`} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                          {l.kind}: {l.title.slice(0, 40)} ({l.issues.length})
                        </span>
                      ))}
                    </div>
                    {reassignFor === u.id && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2">
                        <select id={`rep-${u.id}`} defaultValue={u.rep?.id || ""}
                          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground"
                          aria-label={`Move ${u.firstName} ${u.lastName} to representative`}>
                          <option value="">Unassigned pile</option>
                          {reps.map((r) => (
                            <option key={r.id} value={r.id}>{r.fullName}</option>
                          ))}
                        </select>
                        <button type="button"
                          onClick={() => {
                            const sel = document.getElementById(`rep-${u.id}`) as HTMLSelectElement | null
                            void handleReassign(u.id, sel?.value || null)
                          }}
                          className="touch-target rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">
                          Confirm move
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <TablePagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} total={data?.totalUsers ?? 0} pageSize={pageSize} onPageChange={setPage} />
          </section>

          <section aria-label="Ownerless houses" className="overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              <Building2 size={16} /> Houses with no owner ({data?.orphans.length ?? 0})
            </h2>
            {(data?.orphans ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted" role="status">No ownerless houses.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(data?.orphans ?? []).map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                      <p className="text-xs text-muted">{o.issues.map((i) => i.code).join(" · ") || "needs an owner"}</p>
                    </div>
                    <Link href={`/properties/${o.slug}`} className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-gray-50">Open house</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Possible duplicates" className="overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              <Copy size={16} /> Possible duplicates ({data?.duplicates.length ?? 0} groups)
            </h2>
            {(data?.duplicates ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted" role="status">No duplicate names found.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(data?.duplicates ?? []).map((g) => (
                  <li key={g.key} className="px-4 py-3">
                    <p className="text-sm font-semibold capitalize text-foreground">{g.key}</p>
                    <div className="mt-2 space-y-1.5">
                      {g.members.map((m) => (
                        <label key={m.id} className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                          <input type="radio" name={`winner-${g.key}`} value={m.id}
                            defaultChecked={mergeWinners[g.key] === m.id || (!mergeWinners[g.key] && g.members[0].id === m.id)}
                            onChange={() => setMergeWinners((prev) => ({ ...prev, [g.key]: m.id }))}
                            className="h-4 w-4 accent-primary" />
                          <span className="font-medium text-foreground">Keep this one</span>
                          <span className="truncate">{m.email || "No email"} · {m.phone || "No phone"}</span>
                          <Link href={`/users/${m.id}`} className="shrink-0 font-semibold text-primary hover:underline">Open</Link>
                        </label>
                      ))}
                    </div>
                    <button type="button" onClick={() => void handleMerge(g.key, g.members)}
                      disabled={actionLoading === `merge-${g.key}`}
                      className="touch-target mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      {actionLoading === `merge-${g.key}` ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                      Merge into kept account
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
