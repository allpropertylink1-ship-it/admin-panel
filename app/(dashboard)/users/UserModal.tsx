"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { X, Loader2, Shield, ShieldOff } from "@/components/ui/icons"

import type { User } from "./types"

interface UserModalProps {
  user: User | null
  open: boolean
  onClose: () => void
  onStatusChange: (userId: string, newStatus: string) => void
  loading: string | null
}

const badge: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  NONE: "bg-gray-50 text-gray-600",
}

export function UserModal({ user, open, onClose, onStatusChange, loading }: UserModalProps) {
  const [detail, setDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "properties" | "services">("details")

  useEffect(() => {
    if (!user || !open) return
    setDetail(null)
    setActiveTab("details")
    setDetailLoading(true)
    api.get<Record<string, any>>(`/api/admin/users/${user.id}`)
      .then(({ data }) => { if (data?.user) setDetail(data.user) })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [user?.id, open])

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{user.firstName} {user.lastName}</h3>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted" /></div>
        ) : (
          <>
            <div className="flex border-b border-border">
              {(["details", "properties", "services"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                    activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"
                  )}>
                  {tab === "details" ? "Details" : tab === "properties" ? `Properties (${detail?._count?.properties || 0})` : `Services (${detail?._count?.serviceListings || 0})`}
                </button>
              ))}
            </div>

            {activeTab === "details" && detail && (
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: `${user.firstName} ${user.lastName}` },
                    { label: "Email", value: user.email },
                    { label: "Phone", value: user.phone || "\u2014" },
                    { label: "Status", value: user.accountStatus === "PENDING_APPROVAL" ? "Pending" : user.accountStatus },
                    { label: "KYC Status", value: user.kycStatus },
                    { label: "User Type", value: user.userTypes?.join(", ") || user.primaryUserType || "\u2014" },
                    { label: "Category", value: detail.category || "\u2014" },
                    { label: "Company", value: detail.companyName || "\u2014" },
                    { label: "Location", value: detail.location || detail.city || "\u2014" },
                    { label: "Joined", value: new Date(user.createdAt).toLocaleDateString() },
                    { label: "Last Login", value: detail.lastLogin ? new Date(detail.lastLogin).toLocaleDateString() : "\u2014" },
                    { label: "Properties", value: String(detail._count?.properties || 0) },
                    { label: "Service Listings", value: String(detail._count?.serviceListings || 0) },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs text-muted">{f.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>

                {detail.aplAgent && (
                  <div className="rounded-lg border border-border bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">APL Representative</p>
                    <p className="text-sm font-medium text-foreground">{detail.aplAgent.fullName}</p>
                    <p className="text-xs text-muted">Code: {detail.aplAgent.agentCode} | {detail.aplAgent.phone}</p>
                  </div>
                )}

                {detail.kycDocuments?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">KYC Documents</p>
                    <div className="space-y-2">
                      {detail.kycDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.documentType}</p>
                            {doc.documentNumber && <p className="text-xs text-muted">{doc.documentNumber}</p>}
                          </div>
                          <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", badge[doc.status] || "")}>{doc.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "properties" && detail && (
              <div className="p-6">
                {detail.properties?.length > 0 ? (
                  <div className="space-y-2">
                    {detail.properties.map((prop: any) => (
                      <div key={prop.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{prop.title}</p>
                          <p className="text-xs text-muted">{prop.propertyType} | {prop.listingPurpose?.replace(/_/g, " ")} | {prop.city || "\u2014"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge[prop.moderationStatus] || "")}>{prop.moderationStatus}</span>
                          <span className="text-xs text-muted tabular-nums">{prop.price?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center py-8">No properties listed</p>
                )}
              </div>
            )}

            {activeTab === "services" && detail && (
              <div className="p-6">
                {detail.serviceListings?.length > 0 ? (
                  <div className="space-y-2">
                    {detail.serviceListings.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                          <p className="text-xs text-muted">{s.city || "\u2014"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge[s.moderationStatus] || "")}>{s.moderationStatus}</span>
                          <span className="text-xs text-muted tabular-nums">{s.price?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center py-8">No services listed</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="flex gap-2">
            {user.accountStatus !== "SUSPENDED" ? (
              <button onClick={() => onStatusChange(user.id, "SUSPENDED")} disabled={loading === user.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50">
                {loading === user.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />} Suspend
              </button>
            ) : (
              <button onClick={() => onStatusChange(user.id, "ACTIVE")} disabled={loading === user.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50">
                {loading === user.id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />} Activate
              </button>
            )}
          </div>
          <button onClick={onClose} className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">Close</button>
        </div>
      </div>
    </div>
  )
}
