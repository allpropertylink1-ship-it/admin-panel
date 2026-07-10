"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, UserCheck, Building2, Shield,
  Handshake, Banknote, Wallet, BarChart3, ScrollText, Settings, LogOut,
  Menu, X, ChevronDown, Home,
} from "lucide-react"

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  children?: { href: string; label: string; icon: React.ElementType }[]
}

const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/users", label: "All Users", icon: Users },
      { href: "/approvals", label: "Approvals", icon: UserCheck },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/kyc", label: "KYC Verification", icon: Shield },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/agents", label: "APL Representatives", icon: Handshake },
      { href: "/commissions", label: "Commissions", icon: Banknote },
      { href: "/payouts", label: "Payouts", icon: Wallet },
      { href: "/disputes", label: "Disputes", icon: ScrollText },
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
    if (href === "/users") return pathname.startsWith("/users")
    if (href === "/approvals") return pathname.startsWith("/approvals")
    if (href === "/properties") return pathname.startsWith("/properties")
    if (href === "/kyc") return pathname.startsWith("/kyc")
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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar shadow-2xl shadow-black/20 transition-transform duration-300 ease-out lg:static lg:translate-x-0",
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
          {navGroups.map((group) => (
            <div key={group.group} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-200/50">
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
          ))}
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
