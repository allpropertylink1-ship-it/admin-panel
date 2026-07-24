"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { X, Loader2, Wrench, DollarSign, MapPin, Check, Calendar, Eye } from "@/components/ui/icons"

interface ServiceListing {
  id: string; title: string; description: string
  price: number | null; currency: string; pricePeriod: string
  city: string | null; moderationStatus: string; viewCount: number; createdAt: string
  category: { id: string; name: string } | null
  user: { firstName: string; lastName: string; email: string; companyName?: string; phone?: string } | null
}

interface ServiceModalProps {
  service: ServiceListing | null
  open: boolean
  onClose: () => void
}

function formatPrice(price: number | null, currency: string, period: string) {
  if (price === null) return "\u2014"
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price)
}

export function ServiceModal({ service, open, onClose }: ServiceModalProps) {
  const [detail, setDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!service || !open) return
    setDetail(null)
    setDetailLoading(true)
    api.get<Record<string, any>>(`/api/admin/services/${service.id}`)
      .then(({ data }) => { if (data?.service) setDetail(data.service) })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [service?.id, open])

  if (!open || !service) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Wrench size={20} className="shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">{service.title}</h3>
              <p className="text-xs text-muted">{service.category?.name || ""}{service.city ? ` \u2014 ${service.city}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors shrink-0"><X size={18} /></button>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {detail.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Description</p>
                <p className="text-sm text-foreground">{detail.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: <DollarSign size={14} />, label: "Price", value: detail.price ? formatPrice(detail.price, detail.currency, detail.pricePeriod) : "\u2014" },
                { icon: <MapPin size={14} />, label: "Location", value: [detail.city, detail.region, detail.location].filter(Boolean).join(", ") || "\u2014" },
                { icon: <Wrench size={14} />, label: "Category", value: detail.category?.name || "\u2014" },
                { icon: <Check size={14} />, label: "Status", value: detail.moderationStatus === "PENDING_REVIEW" ? "Pending" : detail.moderationStatus },
                { icon: <Calendar size={14} />, label: "Created", value: new Date(detail.createdAt).toLocaleDateString() },
                { icon: <Eye size={14} />, label: "Views", value: String(detail.viewCount ?? 0) },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-gray-50/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">{f.icon} {f.label}</div>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Provider</p>
              {detail.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                    {detail.user.firstName?.[0]}{detail.user.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{detail.user.firstName} {detail.user.lastName}</p>
                    <p className="text-xs text-muted">{detail.user.email}{detail.user.phone ? ` | ${detail.user.phone}` : ""}</p>
                    {detail.user.companyName && <p className="text-xs text-primary">{detail.user.companyName}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No provider info</p>
              )}
            </div>

            {detail.images?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Images ({detail.images.length})</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(typeof detail.images === "string" ? JSON.parse(detail.images) : detail.images).map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Failed to load service details</div>
        )}

        <div className="border-t border-border px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
        </div>
      </div>
    </div>
  )
}
