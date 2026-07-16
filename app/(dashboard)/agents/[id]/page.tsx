"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Loader2, ArrowLeft, Hash, Users, Building2, Banknote,
  CheckCircle, XCircle, DollarSign, Ban, Wallet, TrendingUp,
  Calendar, Phone, Mail, UserPlus, Home, Clock, AlertCircle,
  Search, Filter, ChevronDown, Plus, Eye, Lock,
} from "lucide-react"

interface ReferredUser {
  id: string; firstName: string; lastName: string; email: string | null
  phone: string | null; category: string | null; accountStatus: string
  kycStatus: string; createdAt: string; _count: { properties: number }
  properties: {
    id: string; title: string; slug: string; price: number; currency: string
    propertyType: string; moderationStatus: string; city: string
    createdAt: string; images: string[]
  }[]
}

interface CommissionRecord {
  id: string; amount: number; currency: string; status: string
  paidAt: string | null; notes: string | null; createdAt: string
  property: { id: string; title: string; slug: string; price: number; currency: string; images: string[] }
  user: { id: string; firstName: string; lastName: string; email: string }
}

interface PayoutRecord {
  id: string; amount: number; currency: string; method: string
  reference: string | null; status: string; notes: string | null
  paidAt: string | null; createdAt: string
}

interface AgentDetail {
  id: string; fullName: string; email: string; phone: string; agentCode: string
  status: string; suspendedAt: string | null; suspendedReason: string | null
  commissionRate: number; commissionType: string; commissionCap: number | null
  createdAt: string; _count: { users: number }
  _commissionCounts: { total: number; pending: number; paid: number; totalPaid: number }
  _payoutCounts?: { pending: number; paid: number; totalPaidAmount: number }
  users: ReferredUser[]
}

type Tab = "referrals" | "commissions" | "payouts"

const fmt = (n: number) => new Intl.NumberFormat("en-KE").format(n)
const fmtCurr = (n: number) => `KES ${fmt(n)}`

export default function AgentDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [referrals, setReferrals] = useState<ReferredUser[]>([])
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("referrals")
  const [editCommission, setEditCommission] = useState<{ id: string; amount: number; notes: string } | null>(null)
  const [showEditRate, setShowEditRate] = useState(false)
  const [editRate, setEditRate] = useState({ commissionType: "", commissionRate: 0, commissionCap: 0 })
  const [actionLoading, setActionLoading] = useState(false)
  const [resetPwLoading, setResetPwLoading] = useState(false)
  const [referralSearch, setReferralSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [agentRes, referralsRes, commissionsRes, payoutsRes] = await Promise.all([
        api.get<{ agent: AgentDetail }>(`/api/admin/agents/${agentId}`),
        api.get<{ users: ReferredUser[] }>(`/api/admin/commissions/agents/${agentId}/referrals`),
        api.get<{ commissions: CommissionRecord[] }>(`/api/admin/commissions/agents/${agentId}/commissions`),
        api.get<{ payouts: PayoutRecord[] }>(`/api/admin/payouts?agentId=${agentId}`),
      ])
      if (agentRes.data?.agent) setAgent(agentRes.data.agent)
      if (referralsRes.data?.users) setReferrals(referralsRes.data.users)
      if (commissionsRes.data?.commissions) setCommissions(commissionsRes.data.commissions)
      if (payoutsRes.data?.payouts) setPayouts(payoutsRes.data.payouts)
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleMarkPaid(id: string) {
    const { data } = await api.post<{ commission: CommissionRecord }>(`/api/admin/commissions/${id}/mark-paid`)
    if (data?.commission) setCommissions((prev) => prev.map((c) => (c.id === id ? data.commission : c)))
  }

  async function handleMarkUnpaid(id: string) {
    const { data } = await api.post<{ commission: CommissionRecord }>(`/api/admin/commissions/${id}/mark-unpaid`)
    if (data?.commission) setCommissions((prev) => prev.map((c) => (c.id === id ? data.commission : c)))
  }

  async function handleSuspend() {
    if (!agent) return
    setActionLoading(true)
    const { data } = await api.post<{ agent: AgentDetail }>(`/api/admin/agents/${agent.id}/suspend`, { suspendedReason: agent.suspendedReason || undefined })
    if (data?.agent) setAgent(data.agent)
    setActionLoading(false)
  }

  async function handleReactivate() {
    if (!agent) return
    setActionLoading(true)
    const { data } = await api.post<{ agent: AgentDetail }>(`/api/admin/agents/${agent.id}/reactivate`)
    if (data?.agent) setAgent(data.agent)
    setActionLoading(false)
  }

  async function handleResetPassword() {
    if (!agent) return
    setResetPwLoading(true)
    const { error } = await api.post(`/api/admin/agents/${agent.id}/reset-password`)
    if (!error) {
      alert("Password reset email sent to representative")
    } else {
      alert(error || "Failed to reset password")
    }
    setResetPwLoading(false)
  }

  async function handleUpdateCommission() {
    if (!editCommission) return
    const { data } = await api.patch<{ commission: CommissionRecord }>(`/api/admin/commissions/${editCommission.id}`, {
      amount: editCommission.amount, notes: editCommission.notes || null,
    })
    if (data?.commission) {
      setCommissions((prev) => prev.map((c) => (c.id === editCommission.id ? data.commission : c)))
      setEditCommission(null)
    }
  }

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary-100 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-primary-100 animate-pulse rounded" />
          <div className="h-4 w-32 bg-primary-100 animate-pulse rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-primary-100 animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-primary-100 animate-pulse rounded-xl" />
    </div>
  )

  if (!agent) return (
    <div className="py-24 text-center animate-fade-in">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50">
        <AlertCircle size={32} className="text-error" />
      </div>
      <p className="text-lg font-semibold text-foreground">APL Representative not found</p>
      <button onClick={() => router.push("/agents")} className="mt-4 text-sm text-accent hover:underline">
        Back to APL Representatives
      </button>
    </div>
  )

  const totalProperties = referrals.reduce((s, u) => s + u._count.properties, 0)
  const totalEarned = agent._commissionCounts.totalPaid || 0
  const pendingCommissionsTotal = commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + Number(c.amount), 0)
  const paidCommissionsTotal = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + Number(c.amount), 0)
  const pendingPayoutsTotal = payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0)
  const paidPayoutsTotal = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0)

  const filteredReferrals = referrals.filter((u) =>
    !referralSearch || `${u.firstName} ${u.lastName} ${u.email || ""}`.toLowerCase().includes(referralSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => router.push("/agents")} className="touch-target mt-1 rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-600 text-white text-lg font-bold shadow-sm shadow-accent/20">
            {agent.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">{agent.fullName}</h1>
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                agent.status === "ACTIVE" ? "bg-success/10 text-success ring-success/20" :
                agent.status === "SUSPENDED" ? "bg-error/10 text-error ring-error/20" :
                "bg-gray-100 text-gray-500 ring-gray-200"
              )}>
                <span className={cn(
                  "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                  agent.status === "ACTIVE" ? "bg-success" :
                  agent.status === "SUSPENDED" ? "bg-error" : "bg-gray-400"
                )} />
                {agent.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
                <Hash size={12} /> {agent.agentCode}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted flex-wrap">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {agent.email}</span>
              <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {agent.phone}</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                Onboarded {new Date(agent.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => router.push("/agents")}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-all inline-flex items-center gap-1.5">
              <ArrowLeft size={15} /> Back
            </button>
            <button onClick={handleResetPassword} disabled={resetPwLoading}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-all inline-flex items-center gap-1.5">
              <Lock size={15} /> {resetPwLoading ? "..." : "Reset Password"}
            </button>
            {agent.status === "ACTIVE" ? (
              <button onClick={handleSuspend} disabled={actionLoading}
                className="rounded-xl bg-warning px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                <Ban size={15} /> {actionLoading ? "..." : "Suspend"}
              </button>
            ) : (
              <button onClick={handleReactivate} disabled={actionLoading}
                className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                <CheckCircle size={15} /> {actionLoading ? "..." : "Reactivate"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={Users} label="Total Referrals" value={String(agent._count.users)} />
        <MetricCard icon={Building2} label="Properties" value={String(totalProperties)} />
        <MetricCard icon={Banknote} label="Pending Comm." value={fmtCurr(pendingCommissionsTotal)} color="text-warning" />
        <MetricCard icon={CheckCircle} label="Paid Comm." value={fmtCurr(paidCommissionsTotal)} color="text-success" />
        <MetricCard icon={TrendingUp} label="Total Earned" value={fmtCurr(totalEarned)} color="text-accent" />
        <MetricCard icon={Wallet} label="Pending Payouts" value={fmtCurr(pendingPayoutsTotal)} color="text-warning" />
      </div>

      {agent.suspendedReason && agent.status === "SUSPENDED" && (
        <div className="rounded-xl border border-error/20 bg-error-50 p-4 flex items-start gap-3">
          <Ban size={18} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-error">Suspended</p>
            <p className="text-sm text-error/80">{agent.suspendedReason}</p>
            {agent.suspendedAt && (
              <p className="text-xs text-error/60 mt-0.5">Since {new Date(agent.suspendedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1">
        {([{ key: "referrals" as Tab, label: "Referrals & Listings", icon: Building2, count: referrals.length },
          { key: "commissions" as Tab, label: "Commissions", icon: Banknote, count: commissions.length },
          { key: "payouts" as Tab, label: "Payout History", icon: Wallet, count: payouts.length },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "touch-target flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              tab === t.key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground hover:bg-background"
            )}>
            <t.icon size={16} />
            {t.label}
            {t.count !== undefined && (
              <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                tab === t.key ? "bg-white/20 text-white" : "bg-primary-50 text-primary"
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "referrals" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text" placeholder="Search referrals by name or email..."
              value={referralSearch} onChange={(e) => setReferralSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          {filteredReferrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
              <UserPlus size={32} className="mb-3 text-muted/40" />
              <p className="text-sm text-muted">{referralSearch ? "No referrals match your search." : "No referred users yet."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((user) => (
                <div key={user.id} className="rounded-xl border border-border bg-surface shadow-sm card-hover overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted">{user.email}{user.phone && ` · ${user.phone}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          user.accountStatus === "ACTIVE" ? "bg-success/10 text-success ring-success/20" :
                          user.accountStatus === "PENDING_APPROVAL" ? "bg-warning/10 text-warning ring-warning/20" :
                          "bg-error/10 text-error ring-error/20"
                        )}>{user.accountStatus}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Home size={10} /> {user._count.properties}
                        </span>
                      </div>
                    </div>
                  </div>
                  {user.properties.length > 0 && (
                    <div className="border-t border-border">
                      <div className="divide-y divide-border">
                        {user.properties.map((p) => {
                          const commission = commissions.find((c) => c.property.id === p.id)
                          return (
                            <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-primary-50/20 transition-colors">
                              <div className="h-10 w-14 shrink-0 rounded-lg bg-primary-100 overflow-hidden">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-muted/40"><Building2 size={16} /></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                                <p className="text-xs text-muted">{p.city} · {p.propertyType}</p>
                              </div>
                              <p className="text-sm font-medium text-foreground tabular-nums shrink-0">
                                {p.currency} {fmt(p.price)}
                              </p>
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset shrink-0",
                                p.moderationStatus === "APPROVED" ? "bg-success/10 text-success ring-success/20" :
                                p.moderationStatus === "PENDING_REVIEW" ? "bg-warning/10 text-warning ring-warning/20" :
                                "bg-error/10 text-error ring-error/20"
                              )}>{p.moderationStatus}</span>
                              {commission && (
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                                  commission.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                )}>
                                  {commission.status === "PAID" ? <CheckCircle size={10} /> : <Clock size={10} />}
                                  {commission.status === "PAID" ? `Paid ${commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : ""}` : `${fmtCurr(Number(commission.amount))} pending`}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "commissions" && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Banknote size={32} className="mb-3 text-muted/40" />
              <p className="text-sm text-muted">No commissions yet. Commissions are created when a referred user&apos;s property is approved.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Property</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Referred User</th>
                    <th className="px-4 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Paid Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-primary-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 shrink-0 rounded-lg bg-primary-100 overflow-hidden">
                            {c.property.images?.[0] ? (
                              <img src={c.property.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted/40"><Building2 size={16} /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground max-w-[200px]">{c.property.title}</p>
                            <p className="text-xs text-muted">{c.property.currency} {fmt(c.property.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{c.user.firstName} {c.user.lastName}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                        {editCommission?.id === c.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-muted">KES</span>
                            <input type="number" value={editCommission.amount} onChange={(e) => setEditCommission({ ...editCommission, amount: Number(e.target.value) })}
                              className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-sm" min="0" step="0.01" />
                          </div>
                        ) : fmtCurr(Number(c.amount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          c.status === "PAID" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                          {c.status === "PAID" ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs tabular-nums">
                        {c.paidAt ? new Date(c.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs max-w-[150px] truncate">
                        {editCommission?.id === c.id ? (
                          <input type="text" value={editCommission.notes} onChange={(e) => setEditCommission({ ...editCommission, notes: e.target.value })}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Notes" />
                        ) : c.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editCommission?.id === c.id ? (
                            <>
                              <button onClick={handleUpdateCommission}
                                className="touch-target rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-all">Save</button>
                              <button onClick={() => setEditCommission(null)}
                                className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-background transition-all">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditCommission({ id: c.id, amount: Number(c.amount), notes: c.notes || "" })}
                                className="touch-target rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-background transition-all" title="Edit amount & notes">
                                <DollarSign size={14} />
                              </button>
                              {c.status === "PENDING" ? (
                                <button onClick={() => handleMarkPaid(c.id)}
                                  className="touch-target rounded-lg bg-success/10 p-1.5 text-success hover:bg-success/20 transition-all" title="Mark as paid">
                                  <CheckCircle size={14} />
                                </button>
                              ) : (
                                <button onClick={() => handleMarkUnpaid(c.id)}
                                  className="touch-target rounded-lg bg-warning/10 p-1.5 text-warning hover:bg-warning/20 transition-all" title="Mark as unpaid">
                                  <XCircle size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "payouts" && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary-50 p-1.5"><Wallet size={16} className="text-primary" /></div>
              <h3 className="font-semibold text-foreground">Payout History</h3>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary">
                {fmtCurr(paidPayoutsTotal)} paid
              </span>
            </div>
            <button onClick={() => router.push(`/payouts?agentId=${agentId}`)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-1.5">
              <Plus size={13} /> Create Payout
            </button>
          </div>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet size={32} className="mb-3 text-muted/40" />
              <p className="text-sm text-muted">No payouts yet for this representative.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-center font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Paid Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-primary-50/20 transition-colors">
                      <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{fmtCurr(Number(p.amount))}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                          {p.method === "MPESA" ? <Phone size={12} /> : p.method === "BANK" ? <Building2 size={12} /> : <Wallet size={12} />}
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted font-mono">{p.reference || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          p.status === "PAID" ? "bg-success/10 text-success" :
                          p.status === "PENDING" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
                        )}>
                          {p.status === "PAID" ? <CheckCircle size={12} /> : p.status === "PENDING" ? <Clock size={12} /> : <XCircle size={12} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs tabular-nums">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs max-w-[150px] truncate">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="stat-card rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          "rounded-lg p-2",
          color ? `${color.replace("text-", "bg-").replace("warning", "warning-50").replace("success", "success-50").replace("accent", "accent-50")}/10` : "bg-primary-50"
        )}>
          <Icon size={18} className={color || "text-primary"} />
        </div>
      </div>
      <p className="text-xs font-medium text-muted tracking-wider uppercase">{label}</p>
      <p className={cn("mt-0.5 text-lg font-bold tabular-nums", color || "text-foreground")}>{value}</p>
    </div>
  )
}
