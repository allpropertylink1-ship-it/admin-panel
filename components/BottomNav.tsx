"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Building2, Handshake,
  Shield, ScrollText, Settings,
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
  { href: "/agents", label: "Representatives", icon: Handshake, permission: "agents" },
  { href: "/kyc", label: "KYC", icon: Shield, permission: "kyc" },
  { href: "/disputes", label: "Disputes", icon: ScrollText, permission: "disputes" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  function canAccess(permission: string): boolean {
    if (!user) return false
    if (user.role === "SUPER_ADMIN") return true
    return !!user.permissions?.[permission]?.read
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/users") return pathname === "/users"
    if (href === "/properties") return pathname.startsWith("/properties")
    if (href === "/agents") return pathname.startsWith("/agents")
    if (href === "/kyc") return pathname.startsWith("/kyc")
    if (href === "/claims") return pathname.startsWith("/claims")
    if (href === "/disputes") return pathname.startsWith("/disputes")
    if (href === "/reports") return pathname.startsWith("/reports")
    if (href === "/audit") return pathname.startsWith("/audit")
    if (href === "/settings") return pathname.startsWith("/settings")
    if (href === "/feature-flags") return pathname.startsWith("/feature-flags")
    if (href === "/services") return pathname.startsWith("/services")
    if (href === "/admin-accounts") return pathname.startsWith("/admin-accounts")
    if (href === "/approvals") return pathname.startsWith("/approvals")
    return pathname === href
  }

  const visibleItems = navItems.filter((item) => canAccess(item.permission))

  if (visibleItems.length === 0) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden" role="navigation" aria-label="Bottom navigation">
      <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
        {visibleItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
      </div>
    </nav>
  )
}