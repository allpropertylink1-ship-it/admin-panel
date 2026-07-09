"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { Loader2, Search, Banknote, CheckCircle, XCircle, DollarSign } from "lucide-react"

interface Commission {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  notes: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; agentCode: string }
  property: { id: string; title: string; slug: string; price: number; currency: string }
  user: { id: string; firstName: string; lastName: string; email: string }
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0, totalPaidAmount: 0 })

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const [listRes, statsRes] = await Promise.all([
        api.get<{ commissions: Commission[]; total: number }>(`/api/admin/commissions?${params.toString()}`),
        api.get<{ total: number; pending: number; paid: number; totalPaidAmount: number }>("/api/admin/commissions/stats"),
      ])
      if (listRes.data?.commissions) setCommissions(listRes.data.commissions)
      if (statsRes.data) setStats(statsRes.data)
    } catch {
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])

  async function handleMarkPaid(id: string) {
    await api.post(`/api/admin/commissions/${id}/mark-paid`)
    fetchCommissions()
  }

  async function handleMarkUnpaid(id: string) {
    await api.post(`/api/admin/commissions/${id}/mark-unpaid`)
    fetchCommissions()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
        <p className="mt-1 text-sm text-muted">Track and manage APL Agent commissions from referred user listings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Banknote size={20} className="text-primary" /></div>
            <div><p className="text-sm text-muted">Total Commissions</p><p className="text-xl font-bold text-foreground">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><XCircle size={20} className="text-warning" /></div>
            <div><p className="text-sm text-muted">Pending</p><p className="text-xl font-bold text-foreground">{stats.pending}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle size={20} className="text-success" /></div>
            <div><p className="text-sm text-muted">Paid</p><p className="text-xl font-bold text-foreground">{stats.paid}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><DollarSign size={20} className="text-success" /></div>
            <div><p className="text-sm text-muted">Total Paid Amount</p><p className="text-xl font-bold text-foreground">KES {stats.totalPaidAmount.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search by agent, property, or user..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : commissions.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No commissions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted">APL Agent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Property</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Referred User</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Paid Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.aplAgent.fullName}</p>
                      <p className="text-xs font-mono text-muted">{c.aplAgent.agentCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate max-w-[200px] text-foreground">{c.property.title}</p>
                      <p className="text-xs text-muted">{c.property.currency} {Number(c.property.price).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.user.firstName} {c.user.lastName}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">KES {Number(c.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "PAID" ? "bg-success/10 text-success" : c.status === "PENDING" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"}`}>
                        {c.status === "PAID" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "PENDING" ? (
                        <button onClick={() => handleMarkPaid(c.id)}
                          className="touch-target rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 transition-colors">Mark Paid</button>
                      ) : (
                        <button onClick={() => handleMarkUnpaid(c.id)}
                          className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-background transition-colors">Mark Unpaid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
