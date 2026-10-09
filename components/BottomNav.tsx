"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Building2, Handshake,
  Shield, ScrollText, Settings, Menu, X,
} from "@/components/ui/icons"
import { useAuth } from "@/lib/auth-context"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/users", label: "Users", icon: Users, permission: "users" },
  { href: "/properties", label: "Properties", icon: Building2, permission: "properties" },
  { href: "/kyc", label: "KYC", icon: Shield, permission: "kyc" },
  { href: "/agents", label: "Representatives", icon: Handshake, permission: "agents" },
  { href: "/disputes", label: "Disputes", icon: ScrollText, permission: "disputes" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings" },
]

const PRIMARY_COUNT = 4

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  function canAccess(permission: string): boolean {
    if (!user) return false
    if (user.role === "SUPER_ADMIN") return true
    return !!user.permissions?.[permission]?.read
  }

  // Generic matcher: exact for /dashboard, section-prefix for everything else.
  // Covers all current and future hrefs (claims, reports, audit, feature-flags,
  // services, approvals, ...) with no dead per-route branches.
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/users") return pathname === "/users" || pathname.startsWith("/users/")
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const visibleItems = navItems.filter((item) => canAccess(item.permission))

  // Escape key handler for the More sheet.
  useEffect(() => {
    if (!moreOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [moreOpen])

  if (visibleItems.length === 0) return null

  const primaryItems = visibleItems.slice(0, PRIMARY_COUNT)
  const overflowItems = visibleItems.slice(PRIMARY_COUNT)
  const moreActive = overflowItems.some((item) => isActive(item.href))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-fixed border-t border-border bg-card/95 backdrop-blur-sm lg:hidden" role="navigation" aria-label="Bottom navigation">
        <div className={cn("grid gap-1 px-2 py-1.5", overflowItems.length > 0 ? "grid-cols-5" : "grid-cols-4")}>
          {primaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors touch-target",
                isActive(item.href)
                  ? "text-primary bg-primary/5"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              )}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <item.icon size={20} className={cn(isActive(item.href) && "text-primary")} aria-hidden="true" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          ))}
          {overflowItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors touch-target",
                moreActive || moreOpen
                  ? "text-primary bg-primary/5"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              )}
              aria-expanded={moreOpen}
              aria-controls="bottom-nav-more"
            >
              <Menu size={20} className={cn((moreActive || moreOpen) && "text-primary")} aria-hidden="true" />
              <span className="truncate w-full text-center">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More sheet - 5th+ items that no longer fit the bottom bar */}
      {moreOpen && overflowItems.length > 0 && (
        <div className="fixed inset-0 z-modal lg:hidden" id="bottom-nav-more">
          <button type="button" aria-label="Close more menu" className="absolute inset-0 bg-black/20" onClick={() => setMoreOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="More navigation" className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 rounded-2xl bg-white border border-border shadow-2xl">
            <div className="flex h-12 items-center justify-between px-4 border-b border-border">
              <span className="text-[15px] font-bold tracking-tight text-text-primary">More</span>
              <button
                type="button"
                className="flex h-11 w-11 touch-target items-center justify-center rounded-full hover:bg-surface-secondary"
                onClick={() => setMoreOpen(false)}
                aria-label="Close more menu"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="p-3 space-y-1" aria-label="More navigation">
              {overflowItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "touch-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary/5 text-primary"
                      : "text-muted hover:text-foreground hover:bg-gray-100"
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <item.icon size={20} className={cn("shrink-0", isActive(item.href) && "text-primary")} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
