"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  MessageSquare,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  MapPin,
  Loader2,
} from "lucide-react";

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DashboardData {
  totalUsers: number;
  activeProperties: number;
  totalInquiries: number;
  totalAgents: number;
  pendingInquiries: number;
  pendingApprovals: number;
  pendingReviews: number;
  kycPending: number;
  registrationsByDay: { date: string; count: number }[];
  topCities: { city: string; count: number }[];
  recentRegistrations: RecentUser[];
  recentInquiries: { id: string; name: string; message: string; status: string; createdAt: string }[];
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <TrendingUp size={14} />
        +{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
        <TrendingDown size={14} />
        {value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
      <Minus size={14} />
      0%
    </span>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-sm text-muted">
        Failed to load report data.
      </div>
    );
  }

  const { totalUsers, activeProperties, totalInquiries, totalAgents, registrationsByDay, topCities, recentRegistrations } = data;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      growth: 12,
    },
    {
      label: "Active Properties",
      value: activeProperties,
      icon: Building2,
      growth: 8,
    },
    {
      label: "Total Inquiries",
      value: totalInquiries,
      icon: MessageSquare,
      growth: -3,
    },
    {
      label: "Total Agents",
      value: totalAgents,
      icon: UserCheck,
      growth: 5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Platform analytics and key metrics.
          </p>
        </div>
        <button
          onClick={() => {}}
          className="touch-target inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon size={20} className="text-primary" />
              </div>
              <GrowthIndicator value={s.growth} />
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">
              User Registrations (Last 30 Days)
            </h2>
          </div>
          <div className="overflow-x-auto">
            {registrationsByDay.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">
                No registration data available.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-muted">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-muted">
                      Registrations
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-muted">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrationsByDay.slice(0, 30).map((row, i) => {
                    const prev = registrationsByDay[i - 1]?.count ?? row.count;
                    const diff = row.count - prev;
                    return (
                      <tr
                        key={row.date}
                        className="border-b border-border last:border-0 hover:bg-background/50"
                      >
                        <td className="px-6 py-3 text-foreground">
                          {new Date(row.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">
                          {row.count}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <GrowthIndicator value={diff} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">
                Top Cities by Properties
              </h2>
            </div>
            {topCities.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">
                No data.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topCities.slice(0, 5).map((city, i) => (
                  <div
                    key={city.city}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-muted" />
                        <span className="text-sm font-medium text-foreground">
                          {city.city}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {city.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">
                Recent Registrations
              </h2>
            </div>
            {recentRegistrations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">
                No data.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentRegistrations.slice(0, 5).map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
