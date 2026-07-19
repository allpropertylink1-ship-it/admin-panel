"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, UserCheck, Building2, Shield,
  Handshake, BarChart3, ScrollText, Settings, LogOut,
  Menu, X, Receipt, Wrench, ShieldCheck, BookUser, Archive,
} from "@/components/ui/icons"

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  permission: string
}

const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "Dashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
    ],
  },
  {
    group: "Users",
    items: [
      { href: "/users", label: "All Users", icon: Users, permission: "users" },
      { href: "/properties", label: "Properties", icon: Building2, permission: "properties" },
      { href: "/services", label: "Fundis & Service Providers", icon: Wrench, permission: "services" },
      { href: "/users/deleted", label: "Deleted Accounts", icon: Archive, permission: "users" },
    ],
  },
  {
    group: "APL Representatives",
    items: [
      { href: "/agents", label: "All Representatives", icon: Handshake, permission: "agents" },
      { href: "/claims", label: "Claims", icon: Receipt, permission: "claims" },
    ],
  },
  {
    group: "Approvals & Verification",
    items: [
      { href: "/approvals", label: "Pending Approvals", icon: UserCheck, permission: "approvals" },
      { href: "/kyc", label: "KYC Verification", icon: Shield, permission: "kyc" },
    ],
  },
  {
    group: "Disputes & Reports",
    items: [
      { href: "/disputes", label: "Disputes", icon: ScrollText, permission: "disputes" },
      { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports" },
      { href: "/audit", label: "Audit Log", icon: BookUser, permission: "audit" },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/admin-accounts", label: "Admin Accounts", icon: ShieldCheck, permission: "adminAccounts" },
      { href: "/settings", label: "Platform Settings", icon: Settings, permission: "settings" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout: signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function canAccess(permission: string): boolean {
    if (!user) return false
    if (user.role === "SUPER_ADMIN") return true
    return !!user.permissions?.[permission]?.read
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/users") return pathname === "/users"
    if (href === "/users/deleted") return pathname === "/users/deleted"
    if (href === "/approvals") return pathname.startsWith("/approvals")
    if (href === "/properties") return pathname.startsWith("/properties")
    if (href === "/kyc") return pathname.startsWith("/kyc")
    if (href === "/claims") return pathname.startsWith("/claims")
    if (href === "/agents") return pathname.startsWith("/agents")
    if (href === "/disputes") return pathname.startsWith("/disputes")
    if (href === "/reports") return pathname.startsWith("/reports")
    if (href === "/audit") return pathname.startsWith("/audit")
    if (href === "/settings") return pathname.startsWith("/settings")
    if (href === "/services") return pathname.startsWith("/services")
    if (href === "/admin-accounts") return pathname.startsWith("/admin-accounts")
    return pathname === href
  }

  return (
    <>
      <button
        className="touch-target fixed left-4 top-4 z-50 flex items-center justify-center rounded-xl border border-primary-800 bg-sidebar p-2.5 text-primary-100 shadow-lg shadow-black/20 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar shadow-2xl shadow-black/20 transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-primary-800/30 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white text-xs font-bold shadow-sm shadow-accent/30">
            AP
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Admin Panel</p>
            <p className="text-[11px] text-primary-200/70 truncate">All Property Link</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-primary-800/50 scrollbar-track-transparent">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => canAccess(item.permission))
            if (visibleItems.length === 0) return null
            return (
            <div key={group.group} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-200/50">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "touch-target group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 lg:px-4",
                      isActive(item.href!)
                        ? "bg-sidebar-active text-white shadow-sm shadow-black/10"
                        : item.label === "Deleted Accounts"
                          ? "text-primary-300/50 hover:bg-sidebar-hover hover:text-primary-200/70"
                          : "text-primary-200/80 hover:bg-sidebar-hover hover:text-white"
                    )}
                  >
                    {isActive(item.href!) && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                    )}
                    <item.icon size={18} className={cn("shrink-0", isActive(item.href!) && "text-accent")} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            )
          })}
        </nav>

        <div className="border-t border-primary-800/30 p-3">
          <button
            onClick={() => signOut()}
            className="touch-target flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-300/70 transition-all duration-150 hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
