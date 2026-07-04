"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Building2,
  MessageSquare,
  ShieldOff,
  Handshake,
  BarChart3,
  Clock,
  Plus,
  Eye,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeProperties: number;
  pendingReviews: number;
  totalInquiries: number;
  kycPending: number;
  totalAgents: number;
  reportsCount: number;
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentInquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentRegistrations: RecentUser[];
  recentInquiries: RecentInquiry[];
}

const statCards = [
  { label: "Total Users", key: "totalUsers", icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "/users" },
  { label: "Pending Approvals", key: "pendingApprovals", icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50", link: "/approvals" },
  { label: "Active Properties", key: "activeProperties", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50", link: "/properties" },
  { label: "Pending Reviews", key: "pendingReviews", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", link: "/properties" },
  { label: "Total Inquiries", key: "totalInquiries", icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50", link: "/inquiries" },
  { label: "KYC Pending", key: "kycPending", icon: ShieldOff, color: "text-rose-600", bg: "bg-rose-50", link: "/kyc" },
  { label: "Total Agents", key: "totalAgents", icon: Handshake, color: "text-cyan-600", bg: "bg-cyan-50", link: "/agents" },
  { label: "Reports", key: "reportsCount", icon: BarChart3, color: "text-gray-600", bg: "bg-gray-50", link: "/reports" },
];

const quickActions = [
  { label: "New Property", icon: Plus, href: "/properties/new", variant: "primary" as const },
  { label: "View Approvals", icon: Eye, href: "/approvals", variant: "secondary" as const },
  { label: "All Users", icon: Users, href: "/users", variant: "secondary" as const },
  { label: "KYC Queue", icon: ShieldOff, href: "/kyc", variant: "secondary" as const },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    READ: "bg-blue-50 text-blue-700 border-blue-200",
    RESPONDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: "bg-red-50 text-red-700",
    AGENT: "bg-blue-50 text-blue-700",
    APPLICANT: "bg-gray-50 text-gray-600",
  };
  return map[role] || "bg-gray-50 text-gray-600";
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="mb-3 h-10 w-10 rounded-lg bg-gray-200" />
              <div className="mb-1 h-4 w-24 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="mb-4 text-error" />
        <h3 className="text-lg font-semibold text-foreground">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "touch-target inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                action.variant === "primary"
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "border border-border bg-card text-foreground hover:bg-gray-50"
              )}
            >
              <action.icon size={16} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = data.stats[card.key as keyof DashboardStats];
          return (
            <Link
              key={card.key}
              href={card.link}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className={cn("mb-3 inline-flex rounded-lg p-2.5", card.bg)}>
                <Icon size={20} className={card.color} />
              </div>
              <p className="text-sm text-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{value?.toLocaleString() ?? 0}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">Recent Registrations</h2>
            <Link href="/users" className="touch-target flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentRegistrations.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted">No recent registrations</p>
            ) : (
              data.recentRegistrations.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", roleBadge(user.role))}>
                    {user.role}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">Recent Inquiries</h2>
            <Link href="/inquiries" className="touch-target flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentInquiries.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted">No recent inquiries</p>
            ) : (
              data.recentInquiries.map((inq) => (
                <div key={inq.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{inq.name}</p>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", statusBadge(inq.status))}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{inq.email}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{inq.message}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(inq.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
