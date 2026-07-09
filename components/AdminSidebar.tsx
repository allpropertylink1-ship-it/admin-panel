"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, UserCheck, Building2, MessageSquare, Shield,
  Handshake, Banknote, BarChart3, ScrollText, Settings, LogOut,
  Menu, X, Home,
} from "lucide-react"

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  badge?: string
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Live" },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/users", label: "All Users", icon: Users },
      { href: "/approvals", label: "Approvals", icon: UserCheck },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
      { href: "/kyc", label: "KYC Verification", icon: Shield },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/agents", label: "APL Agents", icon: Handshake },
      { href: "/commissions", label: "Commissions", icon: Banknote },
    ],
  },
  {
    group: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout: signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <>
      <button
        className="touch-target fixed left-4 top-4 z-50 flex items-center justify-center rounded-xl border border-primary-800 bg-sidebar p-2.5 text-white shadow-lg shadow-black/20 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar shadow-2xl shadow-black/30 transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white text-xs font-bold shadow-sm shadow-accent/40">
            AP
          </div>
          <div className="min-w-0">
            <p className="text-sm font-heading font-semibold text-white truncate tracking-wide">Admin Panel</p>
            <p className="text-[11px] text-sidebar-muted truncate">All Property Link</p>
          </div>
        </div>

        <div className="mx-3 mt-3 mb-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs text-sidebar-muted">System Online</span>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {navGroups.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted/60">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "touch-target group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive(item.href!)
                        ? "bg-sidebar-active text-white shadow-sm shadow-black/10"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                    )}
                  >
                    {isActive(item.href!) && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent shadow-sm shadow-accent/50" />
                    )}
                    <item.icon size={18} className={cn("shrink-0", isActive(item.href!) && "text-accent")} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent animate-pulse-dot">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => signOut()}
            className="touch-target flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all duration-150 hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
