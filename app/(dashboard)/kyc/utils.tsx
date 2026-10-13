/* eslint-disable @next/next/no-img-element */
"use client"

import { useState } from "react"
import { cn, isValidUrl } from "@/lib/utils"
import { ImageIcon, Shield } from "@/components/ui/icons"
import { absUpload } from "@/lib/img";

export const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
]

export const docLabels: Record<string, string> = {
  NATIONAL_ID: "National ID", PASSPORT: "Passport", DRIVERS_LICENSE: "Driver's License",
}

export const userTypeLabels: Record<string, string> = {
  PROPERTY_OWNER: "Property Owner",
  AGENT: "Agent",
  FUNDI: "Fundi",
  SERVICE_PROVIDER: "Service Provider",
  CUSTOMER: "Customer",
}

export function userTypeList(user?: { userTypes?: string[] | null; primaryUserType?: string | null } | null): string[] {
  if (!user) return []
  const types = Array.isArray(user.userTypes) ? user.userTypes.filter(Boolean) : []
  const primary = user.primaryUserType || null
  if (primary && !types.includes(primary)) return [primary, ...types]
  if (primary) return [primary, ...types.filter((t) => t !== primary)]
  return types
}

export const statusCfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  PENDING: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  VERIFIED: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Verified" },
  REJECTED: { dot: "bg-error", bg: "bg-error/10", text: "text-error", label: "Rejected" },
}

export const userKycCfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  NONE: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600", label: "Not Verified" },
  PENDING: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  VERIFIED: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Verified" },
  REJECTED: { dot: "bg-error", bg: "bg-error/10", text: "text-error", label: "Rejected" },
}

export function initials(fn: string, ln: string) { return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() }

export function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }

export function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ImgWithFallback({ src, alt, className, style }: { src: string | null | undefined; alt: string; className?: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  const abs = absUpload(src) || ""
  if (!src || failed || !isValidUrl(abs)) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 text-muted", className)} style={style}>
        <ImageIcon size={20} />
      </div>
    )
  }
  return <img src={abs} alt={alt} className={className} style={style} onError={() => setFailed(true)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />
}

export function EmptyState({ icon: Icon = Shield, title, description }: { icon?: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <Icon size={26} className="text-muted/50" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const c = userKycCfg[status] || userKycCfg.NONE
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

export function DocStatusBadge({ status }: { status: string }) {
  const c = statusCfg[status] || statusCfg.PENDING
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

export function UserTypeBadge({ type, primary }: { type: string; primary?: boolean }) {
  return (
    <span
      title={primary ? "Primary account type" : "Account type"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        primary
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-gray-50 text-muted"
      )}
    >
      {userTypeLabels[type] || type}
      {primary && <span className="font-normal opacity-70">· primary</span>}
    </span>
  )
}
