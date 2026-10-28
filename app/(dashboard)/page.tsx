"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import {
  Users, UserCheck, Building2, ShieldOff,
  Handshake, Clock, AlertCircle, ArrowUpRight,
  UserPlus, ChevronRight, Wrench, Star, Mail,
  MapPin, BarChart3, Receipt, Flag, MessageCircle,
} from "@/components/ui/icons"

interface RecentUser {
  id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string
}

interface RecentListing {
  id: string; title: string; city: string | null; moderationStatus: string; createdAt: string
}

interface QueueItem {
  count: number; oldestCreatedAt: string | null
}

interface ActionQueue {
  pendingApprovals?: QueueItem; pendingReviews?: QueueItem; kycPending?: QueueItem
  pendingClaims?: QueueItem; openDisputes?: QueueItem
  unreadMessages?: QueueItem; unresolvedContacts?: QueueItem
}

interface DashboardData {
  totalUsers: number; pendingApprovals: number; activeProperties: number
  pendingReviews: number; kycPending: number; totalAgents: number
  totalServices?: number; totalReviews?: number; unreadMessages?: number
  totalFavorites?: number
  mostSavedProperties?: { id: string; title: string; city: string | null; savedCount: number }[]
  recentRegistrations: RecentUser[]
  recentProperties?: RecentListing[]
  recentServices?: RecentListing[]
  queue?: ActionQueue
  topCities: { city: string; count: number }[]
  registrationsByDay: { date: string; count: number; byType?: Record<string, number> }[]
}

// Stacked colors — one per UserType, counted once by primaryUserType.
const REG_TYPE_META: { key: string; label: string; color: string }[] = [
  { key: "PROPERTY_OWNER", label: "Owners", color: "#0d9488" },
  { key: "AGENT", label: "Agents", color: "#2563eb" },
  { key: "FUNDI", label: "Fundis", color: "#d97706" },
  { key: "SERVICE_PROVIDER", label: "Providers", color: "#7c3aed" },
  { key: "CUSTOMER", label: "Customers", color: "#64748b" },
  { key: "OTHER", label: "Other", color: "#9ca3af" },
]

// Parse "YYYY-MM-DD" as local noon so the weekday never shifts with TZ
// (new Date("YYYY-MM-DD") is UTC midnight and can render a day early).
function parseDayLocal(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

function HeartIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

const cards = [
  { label: "Total Users", key: "totalUsers", icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "/users" },
  { label: "Pending Approvals", key: "pendingApprovals", icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50", link: "/approvals" },
  { label: "Active Properties", key: "activeProperties", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50", link: "/properties" },
  { label: "Pending Properties", key: "pendingReviews", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", link: "/properties" },
  { label: "KYC Pending", key: "kycPending", icon: ShieldOff, color: "text-rose-600", bg: "bg-rose-50", link: "/kyc" },
  { label: "APL Reps", key: "totalAgents", icon: Handshake, color: "text-cyan-600", bg: "bg-cyan-50", link: "/agents" },
  { label: "Service Listings", key: "totalServices", icon: Wrench, color: "text-violet-600", bg: "bg-violet-50", link: "/services" },
  { label: "Reviews", key: "totalReviews", icon: Star, color: "text-amber-600", bg: "bg-amber-50", link: "/reviews" },
  { label: "Unread Messages", key: "unreadMessages", icon: Mail, color: "text-sky-600", bg: "bg-sky-50", link: "/messages" },
  { label: "Saved Listings", key: "totalFavorites", icon: HeartIcon, color: "text-rose-500", bg: "bg-rose-50", link: "/properties" },
]

const roleBadge: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700", AGENT: "bg-blue-50 text-blue-700", APPLICANT: "bg-gray-50 text-gray-600",
}

const moderationBadge: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  DRAFT: "bg-gray-50 text-gray-600",
}

function formatWaitingAge(iso: string | null | undefined): string {
  if (!iso) return "—"
  const diffMs = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return "—"
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 h-10 w-10 rounded-xl bg-gray-200" />
      <div className="mb-1.5 h-3 w-20 rounded bg-gray-200 sm:h-3.5 sm:w-24" />
      <div className="h-6 w-14 rounded bg-gray-200 sm:h-7 sm:w-16" />
    </div>
  )
}

function StatCard({ item, value }: { item: typeof cards[0]; value: number }) {
  const Icon = item.icon
  return (
    <Link
      href={item.link}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 sm:p-5"
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-2.5", item.bg)}>
          <Icon size={20} className={item.color} />
        </div>
        <ArrowUpRight size={14} className="text-muted/30 group-hover:text-muted transition-colors duration-200" />
      </div>
      <p className="mt-3 text-[10px] font-medium text-muted tracking-wide uppercase sm:mt-4 sm:text-xs">{item.label}</p>
      <p className="mt-0.5 text-xl font-bold text-foreground tabular-nums sm:mt-1 sm:text-2xl">{value.toLocaleString()}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDashboard = useCallback(async () => {
    setError("")
    setLoading(true)
    try {
      const { data, error } = await api.get<DashboardData>("/api/admin/dashboard")
      if (data) setData(data)
      else setError(error || "Failed to load dashboard")
    } catch {
      setError("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void (async () => { await fetchDashboard() })() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="mb-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="mb-1 h-3.5 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-2xl bg-error-50 p-4 mb-4">
          <AlertCircle size={36} className="text-error" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Failed to load dashboard</h3>
        <p className="mt-1.5 text-sm text-muted max-w-sm">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Platform overview at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary-hover"
          >
            <Building2 size={16} />
            <span className="hidden sm:inline">Add Property</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {cards.map((card) => {
          const value = (data[card.key as keyof DashboardData] as number) ?? 0
          return <StatCard key={card.key} item={card} value={value} />
        })}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Needs Action</h2>
          </div>
          <span className="text-xs text-muted tabular-nums">
            oldest wait shown per queue
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
          {[
            { label: "Pending Approvals", href: "/approvals", icon: UserCheck, iconColor: "text-amber-600", iconBg: "bg-amber-50", count: data.queue?.pendingApprovals?.count ?? data.pendingApprovals ?? 0, oldest: data.queue?.pendingApprovals?.oldestCreatedAt ?? null },
            { label: "KYC Pending", href: "/kyc", icon: ShieldOff, iconColor: "text-rose-600", iconBg: "bg-rose-50", count: data.queue?.kycPending?.count ?? data.kycPending ?? 0, oldest: data.queue?.kycPending?.oldestCreatedAt ?? null },
            { label: "Pending Properties", href: "/properties", icon: Clock, iconColor: "text-orange-600", iconBg: "bg-orange-50", count: data.queue?.pendingReviews?.count ?? data.pendingReviews ?? 0, oldest: data.queue?.pendingReviews?.oldestCreatedAt ?? null },
            { label: "Pending Claims", href: "/claims", icon: Receipt, iconColor: "text-violet-600", iconBg: "bg-violet-50", count: data.queue?.pendingClaims?.count ?? 0, oldest: data.queue?.pendingClaims?.oldestCreatedAt ?? null },
            { label: "Open Disputes", href: "/disputes", icon: Flag, iconColor: "text-red-600", iconBg: "bg-red-50", count: data.queue?.openDisputes?.count ?? 0, oldest: data.queue?.openDisputes?.oldestCreatedAt ?? null },
            { label: "Unread Messages", href: "/messages", icon: Mail, iconColor: "text-sky-600", iconBg: "bg-sky-50", count: data.queue?.unreadMessages?.count ?? data.unreadMessages ?? 0, oldest: data.queue?.unreadMessages?.oldestCreatedAt ?? null },
            { label: "Unresolved Contacts", href: "/messages", icon: MessageCircle, iconColor: "text-cyan-600", iconBg: "bg-cyan-50", count: data.queue?.unresolvedContacts?.count ?? 0, oldest: data.queue?.unresolvedContacts?.oldestCreatedAt ?? null },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-border p-3.5 transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5"
              >
                <div className={cn("shrink-0 rounded-xl p-2.5", item.iconBg)}>
                  <Icon size={18} className={item.iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted tabular-nums">
                    waiting {formatWaitingAge(item.oldest)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-bold text-foreground tabular-nums">
                  {item.count.toLocaleString()}
                </span>
                <ChevronRight size={14} className="shrink-0 text-muted/30 transition-colors group-hover:text-muted" />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <UserPlus size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Registrations</h2>
            </div>
            <Link href="/users" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted">
                <Users size={24} className="mb-2 opacity-40" />
                <p className="text-sm">No recent registrations</p>
              </div>
            ) : (
              data.recentRegistrations.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", roleBadge[user.role] || "")}>
                    {user.role}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted tabular-nums">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <HeartIcon size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Most Saved Properties</h2>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary tabular-nums">
                {(data.totalFavorites ?? 0).toLocaleString()} total
              </span>
            </div>
            <div className="divide-y divide-border">
              {!data.mostSavedProperties || data.mostSavedProperties.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No saved properties yet</p>
              ) : (
                data.mostSavedProperties.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5 px-5 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{p.title}</span>
                    {p.city && <span className="hidden shrink-0 text-xs text-muted sm:block">{p.city}</span>}
                    <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{p.savedCount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Top Cities</h2>
              </div>
              <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                Reports <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {data.topCities.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No city data yet</p>
              ) : (
                data.topCities.slice(0, 5).map((c, i) => (
                  <div key={c.city} className="flex items-center gap-2.5 px-5 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{c.city}</span>
                    <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{c.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Registrations (7 days)</h2>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary tabular-nums">
                {data.registrationsByDay.slice(-7).reduce((s, d) => s + d.count, 0).toLocaleString()} in last 7 days
              </span>
            </div>
            <div className="p-5">
              {data.registrationsByDay.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No registration data yet</p>
              ) : (
                <>
                  <div
                    className="flex h-40 items-stretch gap-1.5"
                    role="img"
                    aria-label={`Registrations per day, last 7 days, total ${data.registrationsByDay.slice(-7).reduce((s, d) => s + d.count, 0)}`}
                  >
                    {(() => {
                      const last7 = data.registrationsByDay.slice(-7)
                      const max = Math.max(...last7.map((x) => x.count), 1)
                      const MAX_BAR_PX = 96
                      return last7.map((d) => {
                        const day = parseDayLocal(d.date)
                        const byType = d.byType ?? {}
                        // Back-compat: old cached payloads have no byType — render as a single block.
                        const segments = REG_TYPE_META.filter((m) => (byType[m.key] ?? 0) > 0)
                        const showFallback = segments.length === 0 && d.count > 0
                        const barPx = d.count === 0 ? 4 : Math.max((d.count / max) * MAX_BAR_PX, 12)
                        const tooltip = segments.length > 0
                          ? `${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}: ${d.count}\n${segments.map((m) => `${m.label}: ${byType[m.key]}`).join("\n")}`
                          : `${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}: ${d.count}`
                        return (
                          <div key={d.date} className="flex min-w-0 flex-1 flex-col" title={tooltip}>
                            <span className="text-center text-xs font-semibold text-foreground tabular-nums">
                              {d.count}
                            </span>
                            <div className="flex flex-1 flex-col justify-end py-1">
                              <div
                                className="flex w-full flex-col-reverse overflow-hidden rounded"
                                style={{ height: `${barPx}px` }}
                              >
                                {showFallback ? (
                                  <div className="w-full bg-primary/60" style={{ height: "100%" }} />
                                ) : (
                                  segments.map((m) => (
                                    <div
                                      key={m.key}
                                      className="w-full"
                                      style={{
                                        height: `${((byType[m.key] ?? 0) / Math.max(d.count, 1)) * 100}%`,
                                        backgroundColor: m.color,
                                        minHeight: 2,
                                      }}
                                    />
                                  ))
                                )}
                              </div>
                            </div>
                            <span className="text-center text-[10px] text-muted">
                              {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                            </span>
                            <span className="text-center text-[10px] text-muted tabular-nums">
                              {day.toLocaleDateString("en-US", { day: "numeric" })}
                            </span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
                    {REG_TYPE_META.map((m) => (
                      <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted">Days in Africa/Nairobi time. Each person counted once, by their main account type.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Properties</h2>
            </div>
            <Link href="/properties" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(data.recentProperties ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted">
                <Building2 size={24} className="mb-2 opacity-40" />
                <p className="text-sm">No recent properties</p>
              </div>
            ) : (
              (data.recentProperties ?? []).slice(0, 5).map((property) => (
                <div key={property.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{property.title}</p>
                    <p className="truncate text-xs text-muted">{property.city || "Unknown city"}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", moderationBadge[property.moderationStatus] || "")}>
                    {property.moderationStatus}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted tabular-nums">{new Date(property.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Wrench size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Services</h2>
            </div>
            <Link href="/services" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(data.recentServices ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted">
                <Wrench size={24} className="mb-2 opacity-40" />
                <p className="text-sm">No recent services</p>
              </div>
            ) : (
              (data.recentServices ?? []).slice(0, 5).map((service) => (
                <div key={service.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{service.title}</p>
                    <p className="truncate text-xs text-muted">{service.city || "Unknown city"}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", moderationBadge[service.moderationStatus] || "")}>
                    {service.moderationStatus}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted tabular-nums">{new Date(service.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
