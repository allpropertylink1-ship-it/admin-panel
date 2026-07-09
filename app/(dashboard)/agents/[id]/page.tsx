"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { Loader2, ArrowLeft, Hash, Users, Building2, Banknote, CheckCircle, XCircle, DollarSign, Calendar } from "lucide-react"

interface ReferredUser {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  category: string | null
  accountStatus: string
  kycStatus: string
  createdAt: string
  _count: { properties: number }
  properties: {
    id: string
    title: string
    slug: string
    price: number
    currency: string
    propertyType: string
    moderationStatus: string
    city: string
    createdAt: string
    images: string[]
  }[]
}

interface CommissionRecord {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  notes: string | null
  createdAt: string
  property: { id: string; title: string; slug: string; price: number; currency: string; images: string[] }
  user: { id: string; firstName: string; lastName: string; email: string }
}

interface AgentDetail {
  id: string
  fullName: string
  email: string
  phone: string
  agentCode: string
  createdAt: string
  _count: { users: number }
  _commissionCounts: { total: number; pending: number; paid: number; totalPaid: number }
  users: ReferredUser[]
}

type Tab = "overview" | "referrals" | "commissions"

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [referrals, setReferrals] = useState<ReferredUser[]>([])
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("overview")
  const [editCommission, setEditCommission] = useState<{ id: string; amount: number; notes: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [agentRes, referralsRes, commissionsRes] = await Promise.all([
        api.get<{ agent: AgentDetail }>(`/api/admin/agents/${agentId}`),
        api.get<{ users: ReferredUser[] }>(`/api/admin/commissions/agents/${agentId}/referrals`),
        api.get<{ commissions: CommissionRecord[] }>(`/api/admin/commissions/agents/${agentId}/commissions`),
      ])
      if (agentRes.data?.agent) setAgent(agentRes.data.agent)
      if (referralsRes.data?.users) setReferrals(referralsRes.data.users)
      if (commissionsRes.data?.commissions) setCommissions(commissionsRes.data.commissions)
    } catch {
      // handled by error state
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleMarkPaid(id: string) {
    const { data } = await api.post<{ commission: CommissionRecord }>(`/api/admin/commissions/${id}/mark-paid`)
    if (data?.commission) {
      setCommissions((prev) => prev.map((c) => (c.id === id ? data.commission : c)))
    }
  }

  async function handleMarkUnpaid(id: string) {
    const { data } = await api.post<{ commission: CommissionRecord }>(`/api/admin/commissions/${id}/mark-unpaid`)
    if (data?.commission) {
      setCommissions((prev) => prev.map((c) => (c.id === id ? data.commission : c)))
    }
  }

  async function handleUpdateCommission() {
    if (!editCommission) return
    const { data } = await api.patch<{ commission: CommissionRecord }>(`/api/admin/commissions/${editCommission.id}`, {
      amount: editCommission.amount,
      notes: editCommission.notes || null,
    })
    if (data?.commission) {
      setCommissions((prev) => prev.map((c) => (c.id === editCommission.id ? data.commission : c)))
      setEditCommission(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg text-muted">Representative not found.</p>
        <button onClick={() => router.push("/agents")} className="mt-4 text-sm text-primary hover:underline">Back to Representatives</button>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "referrals", label: "Referrals", icon: Building2, count: referrals.length },
    { key: "commissions", label: "Commissions", icon: Banknote, count: commissions.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/agents")} className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {agent.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{agent.fullName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
              <Hash size={12} /> {agent.agentCode}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Users Referred" value={agent._count.users} />
        <StatCard icon={Building2} label="Total Properties" value={referrals.reduce((s, u) => s + u._count.properties, 0)} />
        <StatCard icon={Banknote} label="Commissions" value={`${agent._commissionCounts.pending} pending / ${agent._commissionCounts.paid} paid`} />
        <StatCard icon={DollarSign} label="Total Paid" value={`KES ${agent._commissionCounts.totalPaid.toLocaleString()}`} color="text-success" />
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`touch-target flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"}`}>
            <t.icon size={16} />
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Representative Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Full Name" value={agent.fullName} />
            <InfoRow label="Email" value={agent.email} />
            <InfoRow label="Phone" value={agent.phone} />
            <InfoRow label="Agent Code" value={agent.agentCode} mono />
            <InfoRow label="Users Referred" value={String(agent._count.users)} />
            <InfoRow label="Onboarded" value={new Date(agent.createdAt).toLocaleDateString()} />
          </div>
        </div>
      )}

      {tab === "referrals" && (
        <div className="rounded-xl border border-border bg-card">
          {referrals.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No referred users yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {referrals.map((user) => (
                <div key={user.id} className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted">{user.email} {user.phone && `· ${user.phone}`}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.accountStatus === "ACTIVE" ? "bg-success/10 text-success" : user.accountStatus === "PENDING_APPROVAL" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"}`}>
                      {user.accountStatus}
                    </span>
                  </div>
                  {user.properties.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider">Properties ({user.properties.length})</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {user.properties.map((p) => (
                          <div key={p.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" className="mb-2 h-24 w-full rounded object-cover" />
                            )}
                            <p className="truncate font-medium text-foreground">{p.title}</p>
                            <p className="text-xs text-muted">{p.city} · {p.propertyType} · {p.currency} {Number(p.price).toLocaleString()}</p>
                            <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.moderationStatus === "APPROVED" ? "bg-success/10 text-success" : p.moderationStatus === "PENDING_REVIEW" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"}`}>
                              {p.moderationStatus}
                            </span>
                          </div>
                        ))}
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
        <div className="rounded-xl border border-border bg-card">
          {commissions.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No commissions yet. Commissions are created when a referred user&apos;s property is approved.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted">Property</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Referred User</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Paid Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Notes</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.property.images?.[0] && <img src={c.property.images[0]} alt="" className="h-8 w-10 rounded object-cover" />}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground max-w-[200px]">{c.property.title}</p>
                            <p className="text-xs text-muted">{c.property.currency} {Number(c.property.price).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{c.user.firstName} {c.user.lastName}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {editCommission?.id === c.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted">KES</span>
                            <input type="number" value={editCommission.amount} onChange={(e) => setEditCommission({ ...editCommission, amount: Number(e.target.value) })}
                              className="w-24 rounded border border-border bg-background px-2 py-1 text-right text-sm" min="0" step="0.01" />
                          </div>
                        ) : (
                          <>KES {Number(c.amount).toLocaleString()}</>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "PAID" ? "bg-success/10 text-success" : c.status === "PENDING" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"}`}>
                          {c.status === "PAID" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "—"}
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
                                className="touch-target rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10">Save</button>
                              <button onClick={() => setEditCommission(null)}
                                className="touch-target rounded px-2 py-1 text-xs font-medium text-muted hover:bg-background">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditCommission({ id: c.id, amount: Number(c.amount), notes: c.notes || "" })}
                                className="touch-target rounded p-1.5 text-muted hover:text-foreground" title="Edit amount & notes">
                                <DollarSign size={14} />
                              </button>
                              {c.status === "PENDING" ? (
                                <button onClick={() => handleMarkPaid(c.id)}
                                  className="touch-target rounded p-1.5 text-success hover:bg-success/10" title="Mark as paid">
                                  <CheckCircle size={14} />
                                </button>
                              ) : (
                                <button onClick={() => handleMarkUnpaid(c.id)}
                                  className="touch-target rounded p-1.5 text-warning hover:bg-warning/10" title="Mark as unpaid">
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
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color ? "bg-success/10" : "bg-primary/10"}`}>
          <Icon size={20} className={color || "text-primary"} />
        </div>
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  )
}
