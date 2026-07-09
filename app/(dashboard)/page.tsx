"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import {
  Users, UserCheck, Building2, MessageSquare, ShieldOff,
  Handshake, Banknote, Clock, AlertCircle, ArrowUpRight,
  UserPlus, Mail, ChevronRight, Activity,
} from "lucide-react"

interface RecentUser {
  id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string
}

interface RecentInquiry {
  id: string; name: string; email: string; message: string; status: string; createdAt: string
}

interface DashboardData {
  totalUsers: number; pendingApprovals: number; activeProperties: number
  pendingReviews: number; totalInquiries: number; pendingInquiries: number
  kycPending: number; totalAgents: number
  recentRegistrations: RecentUser[]; recentInquiries: RecentInquiry[]
  topCities: { city: string; count: number }[]
  registrationsByDay: { date: string; count: number }[]
  commissions: { total: number; pending: number; paid: number; totalPaidAmount: number }
}

const cards = [
  { label: "Total Users", key: "totalUsers", icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "/users" },
  { label: "Pending Approvals", key: "pendingApprovals", icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50", link: "/approvals" },
  { label: "Active Properties", key: "activeProperties", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50", link: "/properties" },
  { label: "Pending Reviews", key: "pendingReviews", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", link: "/properties" },
  { label: "Total Inquiries", key: "totalInquiries", icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50", link: "/inquiries" },
  { label: "KYC Pending", key: "kycPending", icon: ShieldOff, color: "text-rose-600", bg: "bg-rose-50", link: "/kyc" },
  { label: "APL Reps", key: "totalAgents", icon: Handshake, color: "text-cyan-600", bg: "bg-cyan-50", link: "/agents" },
  { label: "Pending Inquiries", key: "pendingInquiries", icon: Mail, color: "text-gray-600", bg: "bg-gray-50", link: "/inquiries" },
]

const roleBadge: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700", AGENT: "bg-blue-50 text-blue-700", APPLICANT: "bg-gray-50 text-gray-600",
}

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  READ: "bg-blue-50 text-blue-700 border-blue-200",
  RESPONDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-3 h-10 w-10 rounded-xl bg-gray-200" />
      <div className="mb-1.5 h-3.5 w-24 rounded bg-gray-200" />
      <div className="h-7 w-16 rounded bg-gray-200" />
    </div>
  )
}

function StatCard({ item, value }: { item: typeof cards[0]; value: number }) {
  const Icon = item.icon
  return (
    <Link
      href={item.link}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-2.5", item.bg)}>
          <Icon size={20} className={item.color} />
        </div>
        <ArrowUpRight size={14} className="text-muted/30 group-hover:text-muted transition-colors duration-200" />
      </div>
      <p className="mt-4 text-xs font-medium text-muted tracking-wide uppercase">{item.label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api.get<DashboardData>("/api/admin/dashboard").then(({ data, error }) => {
      if (data) setData(data)
      else setError(error || "Failed to load dashboard")
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          onClick={() => window.location.reload()}
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
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const value = card.key === "pendingInquiries"
            ? data.pendingInquiries ?? 0
            : data[card.key as keyof DashboardData] as number
          return <StatCard key={card.key} item={card} value={value} />
        })}
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

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Inquiries</h2>
            </div>
            <Link href="/inquiries" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted">
                <MessageSquare size={24} className="mb-2 opacity-40" />
                <p className="text-sm">No recent inquiries</p>
              </div>
            ) : (
              data.recentInquiries.slice(0, 5).map((inq) => (
                <div key={inq.id} className="px-5 py-3 transition-colors hover:bg-gray-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{inq.name}</p>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", statusBadge[inq.status] || "")}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{inq.email}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted/70">{inq.message}</p>
                  <p className="mt-1 text-[11px] text-muted tabular-nums">{new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
