"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  MessageSquare,
  Shield,
  Handshake,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "User Management",
    icon: Users,
    children: [
      { href: "/users", label: "All Users", icon: Users },
      { href: "/approvals", label: "Pending Approvals", icon: UserCheck },
    ],
  },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/kyc", label: "KYC Verification", icon: Shield },
  { href: "/agents", label: "Agents", icon: Handshake },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("User Management");

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      <button
        className="touch-target fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg border border-primary-800 bg-sidebar p-2.5 text-primary-100 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-primary-800/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white text-xs font-bold">
            AP
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin Panel</p>
            <p className="text-xs text-primary-200">All Property Link</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            if ("children" in item && item.children) {
              const isExpanded = expanded === item.label;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.label)}
                    className="touch-target flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-100 transition-colors hover:bg-sidebar-hover"
                  >
                    <item.icon size={18} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      size={14}
                      className={cn(
                        "transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "touch-target flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive(child.href)
                              ? "bg-sidebar-active text-white"
                              : "text-primary-200 hover:bg-sidebar-hover hover:text-white"
                          )}
                        >
                          <child.icon size={16} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon!;
            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "touch-target flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href!)
                    ? "bg-sidebar-active text-white"
                    : "text-primary-100 hover:bg-sidebar-hover"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary-800/50 p-4">
          <button
            onClick={() => signOut()}
            className="touch-target flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-200 transition-colors hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
