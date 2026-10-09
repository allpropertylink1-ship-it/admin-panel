/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { X, Loader2, Building2, DollarSign, Home, MapPin, Bed, Bath, Expand, Globe, Calendar } from "@/components/ui/icons"

interface ModalUnit {
  id: string
  configuration: string
  label?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  area?: number | null
  price?: number | null
  listingPurpose?: string | null
  availableUnits?: number | null
  totalUnits?: number | null
}

interface Property {
  id: string; slug: string; title: string; price: number; currency: string
  propertyType: string; listingPurpose: string | null; city: string
  moderationStatus: string; isPublished: boolean; createdAt: string
  hasMultipleUnits?: boolean
  unitMixDescription?: string | null
  units?: ModalUnit[]
  agent: { id: string; firstName: string; lastName: string; email: string } | null
}

interface PropertyModalProps {
  property: Property | null
  open: boolean
  onClose: () => void
}

export interface PropertyDetail {
  city?: string | null
  region?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  area?: number | null
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string | null
  agent?: { id?: string; firstName?: string; lastName?: string; email?: string; phone?: string | null } | null
  coverImage?: string | null
  images?: string | string[]
  hasMultipleUnits?: boolean
  unitMixDescription?: string | null
  units?: ModalUnit[]
}

function formatPrice(price: number | null, currency: string, listingPurpose?: string | null) {
  if (price == null) return "—"
  const formatted = new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price)
  if (listingPurpose === "FOR_RENT_SHORT_TERM") return `${formatted}/night`
  if (listingPurpose === "FOR_RENT_LONG_TERM") return `${formatted}/month`
  return formatted
}

/** "KES 35,000 – KES 120,000" or single price when only one unit is priced. */
function formatUnitRange(units: ModalUnit[] | null | undefined, currency: string) {
  const prices = (units ?? [])
    .map((u) => (typeof u.price === "number" ? u.price : Number(u.price)))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0 }).format(n)
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
}

function unitConfigLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function typeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

export function PropertyModal({ property, open, onClose }: PropertyModalProps) {
  const [detail, setDetail] = useState<PropertyDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      if (!property || !open) return
      setDetail(null)
      setDetailLoading(true)
      api.get<{ property: PropertyDetail }>(`/api/admin/properties/${property.id}`)
        .then(({ data }) => { if (data?.property) setDetail(data.property) })
        .catch(() => {})
        .finally(() => setDetailLoading(false))
    })()
  }, [property, open])

  if (!open || !property) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
            <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3">
              {[
                { icon: <DollarSign size={14} />, label: "Price", value: (property.hasMultipleUnits && formatUnitRange(property.units ?? detail.units, property.currency)) || formatPrice(property.price, property.currency, property.listingPurpose) },
                { icon: <Home size={14} />, label: "Type", value: typeLabel(property.propertyType) },
                { icon: <MapPin size={14} />, label: "Location", value: [detail.city, detail.region].filter(Boolean).join(", ") || "\u2014" },
                { icon: <Bed size={14} />, label: "Bedrooms", value: detail.bedrooms != null ? String(detail.bedrooms) : "\u2014" },
                { icon: <Bath size={14} />, label: "Bathrooms", value: detail.bathrooms != null ? String(detail.bathrooms) : "\u2014" },
                { icon: <Expand size={14} />, label: "Area", value: detail.area ? `${detail.area} sqft` : "\u2014" },
                { icon: <Building2 size={14} />, label: "Units", value: property.hasMultipleUnits ? `${(property.units ?? detail.units ?? []).length} configs${property.unitMixDescription ?? detail.unitMixDescription ? ` — ${property.unitMixDescription ?? detail.unitMixDescription}` : ""}` : "Single" },
                { icon: <Globe size={14} />, label: "Published", value: detail.isPublished ? "Yes" : "No" },
                { icon: <Calendar size={14} />, label: "Created", value: detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : "\u2014" },
                { icon: <Calendar size={14} />, label: "Updated", value: detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : "\u2014" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-gray-50/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">{f.icon} {f.label}</div>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>

            {(property.units ?? detail.units ?? []).length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Unit configurations ({(property.units ?? detail.units ?? []).length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                        <th scope="col" className="py-1.5 pr-3">Configuration</th>
                        <th scope="col" className="py-1.5 pr-3">Beds</th>
                        <th scope="col" className="py-1.5 pr-3">Baths</th>
                        <th scope="col" className="py-1.5 pr-3">Area</th>
                        <th scope="col" className="py-1.5 pr-3">Price</th>
                        <th scope="col" className="py-1.5">Avail.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(property.units ?? detail.units ?? []).map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-3 font-medium text-foreground">
                            {unitConfigLabel(u.configuration)}
                            {u.label && <span className="block text-xs font-normal text-muted">{u.label}</span>}
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-muted">{u.bedrooms ?? "—"}</td>
                          <td className="py-2 pr-3 tabular-nums text-muted">{u.bathrooms ?? "—"}</td>
                          <td className="py-2 pr-3 tabular-nums text-muted">{u.area != null ? Number(u.area).toLocaleString() : "—"}</td>
                          <td className="py-2 pr-3 font-medium tabular-nums text-foreground">
                            {u.price != null ? formatPrice(Number(u.price), property.currency, u.listingPurpose ?? property.listingPurpose) : "—"}
                          </td>
                          <td className="py-2 tabular-nums text-muted">
                            {u.availableUnits != null && u.totalUnits != null ? `${u.availableUnits}/${u.totalUnits}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

            {detail.images && detail.images.length > 0 && (() => {
              const parsed: string[] = typeof detail.images === "string" ? JSON.parse(detail.images as string) : (detail.images as string[])
              const cover = detail.coverImage ?? parsed[0] ?? null
              return (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Images ({parsed.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {parsed.map((img: string, i: number) => (
                      <div key={i} className="relative shrink-0">
                        <img src={img} alt="" className="h-20 w-28 rounded-lg object-cover border border-border" />
                        {img === cover && (
                          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
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
