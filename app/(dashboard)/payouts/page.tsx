"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { Loader2, AlertCircle, CheckCircle } from "@/components/ui/icons"

interface PayoutClaim {
  id: string
  amount: number
  currency: string
  paidAt: string | null
  createdAt: string
  property: { title: string; city: string } | null
  aplAgent: { fullName: string; agentCode: string }
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n)

export default function AdminPayoutsPage() {
  const [claims, setClaims] = useState<PayoutClaim[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "20", status: "PAID" })
    const { data, error } = await api.get<{ claims: PayoutClaim[]; total: number; totalPages: number }>(`/api/admin/claims?${params}`)
    if (data) {
      setClaims(data.claims)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } else {
      setError(error || "Failed to load")
    }
    setLoading(false)
  }, [page])

  useEffect(() => { void (async () => { await fetchPayouts() })() }, [fetchPayouts])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">Payouts</h1>
        <p className="mt-1 text-sm text-text-secondary">All payouts are generated from approved payment claims · {total} total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted" /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <AlertCircle size={24} className="text-error-500" />
          <p className="text-sm text-text-secondary">{error}</p>
          <button type="button" onClick={fetchPayouts} className="touch-target rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white">Retry</button>
        </div>
      ) : claims.length === 0 ? (
        <div className="py-20 text-center text-sm text-text-secondary">No payouts yet. Approved claims will appear here.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">APL Rep</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid On</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {claims.map((c) => (
                <tr key={c.id} className="bg-surface hover:bg-surface-secondary">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-text-primary">{c.aplAgent.fullName}</div>
                    <div className="text-xs text-muted">{c.aplAgent.agentCode}</div>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{c.property ? `${c.property.title} (${c.property.city})` : "-"}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{fmt(Number(c.amount))}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success-700">
                      <CheckCircle size={12} />Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="touch-target rounded-lg border border-border px-4 py-2 text-sm text-text-primary disabled:opacity-40">Previous</button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="touch-target rounded-lg border border-border px-4 py-2 text-sm text-text-primary disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
