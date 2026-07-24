"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { X, Loader2, Building2, DollarSign, Home, MapPin, Bed, Bath, Expand, Globe, Calendar } from "@/components/ui/icons"

interface Property {
  id: string; slug: string; title: string; price: number; currency: string
  propertyType: string; listingPurpose: string | null; city: string
  moderationStatus: string; isPublished: boolean; createdAt: string
  agent: { id: string; firstName: string; lastName: string; email: string } | null
}

interface PropertyModalProps {
  property: Property | null
  open: boolean
  onClose: () => void
}

function formatPrice(price: number, currency: string, listingPurpose?: string | null) {
  const formatted = new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price)
  if (listingPurpose === "FOR_RENT_SHORT_TERM") return `${formatted}/night`
  if (listingPurpose === "FOR_RENT_LONG_TERM") return `${formatted}/month`
  return formatted
}

function typeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

export function PropertyModal({ property, open, onClose }: PropertyModalProps) {
  const [detail, setDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!property || !open) return
    setDetail(null)
    setDetailLoading(true)
    api.get<Record<string, any>>(`/api/admin/properties/${property.id}`)
      .then(({ data }) => { if (data?.property) setDetail(data.property) })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [property?.id, open])

  if (!open || !property) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Building2 size={20} className="shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">{property.title}</h3>
              <p className="text-xs text-muted">{property.city}{property.agent ? ` \u2014 ${property.agent.firstName} ${property.agent.lastName}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors shrink-0"><X size={18} /></button>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: <DollarSign size={14} />, label: "Price", value: formatPrice(property.price, property.currency, property.listingPurpose) },
                { icon: <Home size={14} />, label: "Type", value: typeLabel(property.propertyType) },
                { icon: <MapPin size={14} />, label: "Location", value: [detail.city, detail.region].filter(Boolean).join(", ") || "\u2014" },
                { icon: <Bed size={14} />, label: "Bedrooms", value: detail.bedrooms != null ? String(detail.bedrooms) : "\u2014" },
                { icon: <Bath size={14} />, label: "Bathrooms", value: detail.bathrooms != null ? String(detail.bathrooms) : "\u2014" },
                { icon: <Expand size={14} />, label: "Area", value: detail.area ? `${detail.area} sqft` : "\u2014" },
                { icon: <Globe size={14} />, label: "Published", value: detail.isPublished ? "Yes" : "No" },
                { icon: <Calendar size={14} />, label: "Created", value: new Date(detail.createdAt).toLocaleDateString() },
                { icon: <Calendar size={14} />, label: "Updated", value: detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : "\u2014" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-gray-50/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">{f.icon} {f.label}</div>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Agent / Owner</p>
              {detail.agent ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                    {detail.agent.firstName?.[0]}{detail.agent.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{detail.agent.firstName} {detail.agent.lastName}</p>
                    <p className="text-xs text-muted">{detail.agent.email}{detail.agent.phone ? ` | ${detail.agent.phone}` : ""}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No agent assigned</p>
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
          <div className="flex items-center justify-center py-16 text-sm text-muted">Failed to load property details</div>
        )}

        <div className="border-t border-border px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
        </div>
      </div>
    </div>
  )
}
