"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import {
  Users,
  Building2,
  UserCheck,
  MapPin,
  TrendingUp,
} from "@/components/ui/icons";
import { ExportButton } from "@/components/shared/ExportButton";

type RecentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DashboardData {
  totalUsers: number;
  activeProperties: number;
  totalAgents: number;
  pendingApprovals: number;
  pendingReviews: number;
  kycPending: number;
  totalServices?: number;
  totalReviews?: number;
  unreadMessages?: number;
  registrationsByDay: { date: string; count: number; byType?: Record<string, number> }[];
  topCities: { city: string; count: number }[];
  recentRegistrations: RecentUser[];
}

const REG_TYPE_META: { key: string; label: string; color: string }[] = [
  { key: "PROPERTY_OWNER", label: "Owners", color: "#0d9488" },
  { key: "AGENT", label: "Agents", color: "#2563eb" },
  { key: "FUNDI", label: "Fundis", color: "#d97706" },
  { key: "SERVICE_PROVIDER", label: "Providers", color: "#7c3aed" },
  { key: "CUSTOMER", label: "Customers", color: "#64748b" },
  { key: "OTHER", label: "Other", color: "#9ca3af" },
];

function parseDayLocal(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">
      {initials}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-4 h-7 w-16 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<DashboardData>(
        "/api/admin/dashboard"
      );
      if (error || !data) throw new Error(error || "No data");
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await fetchDashboard(); })();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-44 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-xl bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <div className="h-5 w-52 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 h-40">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded animate-pulse bg-gray-200"
                    style={{ height: `${[45, 70, 35, 85, 55, 65, 40][i]}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100 flex items-center gap-2.5">
          <span className="text-red-500">●</span>
          {error || "Failed to load report data."}
        </div>
        <button
          onClick={fetchDashboard}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalUsers,
    activeProperties,
    totalAgents,
    totalServices,
    totalReviews,
    unreadMessages,
    registrationsByDay,
    topCities,
    recentRegistrations,
  } = data;

  const stats = [
    { label: "Users", value: totalUsers, icon: Users },
    { label: "Properties", value: activeProperties, icon: Building2 },
    { label: "Agents", value: totalAgents, icon: UserCheck },
    { label: "Service Listings", value: totalServices ?? 0, icon: Building2 },
    { label: "Reviews", value: totalReviews ?? 0, icon: Users },
    { label: "Unread Messages", value: unreadMessages ?? 0, icon: Users },
  ];

  const last7Days = registrationsByDay.slice(-7);
  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);

  const topCitiesMax = Math.max(...topCities.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Platform analytics and key metrics.
          </p>
        </div>
        <ExportButton exportPath="/api/admin/exports/audit" filename="audit.csv" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card shadow-sm p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <s.icon size={20} className="text-primary" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Registrations by Day (Last 7 Days)
            </h2>
          </div>
          {last7Days.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Users size={24} className="text-muted/40" />
              <p className="text-sm text-muted">No registration data.</p>
            </div>
          ) : (
            <div className="p-5">
              <div
                className="flex items-stretch gap-2 h-44"
                role="img"
                aria-label={`Registrations per day, last 7 days, total ${last7Days.reduce((s, d) => s + d.count, 0)}`}
              >
                {(() => {
                  const MAX_BAR_PX = 104;
                  return last7Days.map((d) => {
                    const day = parseDayLocal(d.date);
                    const byType = d.byType ?? {};
                    const segments = REG_TYPE_META.filter((m) => (byType[m.key] ?? 0) > 0);
                    const showFallback = segments.length === 0 && d.count > 0;
                    const barPx = d.count === 0 ? 4 : Math.max((d.count / maxCount) * MAX_BAR_PX, 12);
                    const tooltip = segments.length > 0
                      ? `${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}: ${d.count}\n${segments.map((m) => `${m.label}: ${byType[m.key]}`).join("\n")}`
                      : `${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}: ${d.count}`;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col min-w-0" title={tooltip}>
                        <span className="text-center text-xs font-semibold text-foreground tabular-nums">
                          {d.count}
                        </span>
                        <div className="flex flex-1 flex-col justify-end py-1">
                          <div
                            className="w-full rounded overflow-hidden flex flex-col-reverse"
                            style={{ height: `${barPx}px` }}
                          >
                            {showFallback ? (
                              <div className="w-full bg-primary/60" style={{ height: "100%" }} />
                            ) : (
                              segments.map((m) => (
                                <div
                                  key={m.key}
                                  className="w-full"
                                  style={{
                                    height: `${((byType[m.key] ?? 0) / Math.max(d.count, 1)) * 100}%`,
                                    backgroundColor: m.color,
                                    minHeight: 2,
                                  }}
                                />
                              ))
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted whitespace-nowrap text-center">
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
                {REG_TYPE_META.map((m) => (
                  <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                    {m.label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">Days in Africa/Nairobi time. Each person counted once, by their main account type.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Top Cities by Properties
              </h2>
            </div>
            {topCities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <MapPin size={24} className="text-muted/40" />
                <p className="text-sm text-muted">No city data.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topCities.slice(0, 10).map((city, i) => (
                  <div key={city.city} className="px-5 py-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {city.city}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {city.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all"
                        style={{
                          width: `${(city.count / topCitiesMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Registrations
            </h2>
          </div>
          {recentRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users size={24} className="text-muted/40" />
              <p className="text-sm text-muted">No recent registrations.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentRegistrations.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <Avatar name={`${user.firstName} ${user.lastName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              7-Day Snapshot
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {last7Days.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted">registrations in the last 7 days</p>
              </div>
            </div>
            {last7Days.length > 0 && (
              <div>
                <div className="flex items-stretch gap-1.5 h-20">
                  {last7Days.map((d) => {
                    const byType = d.byType ?? {};
                    const segments = REG_TYPE_META.filter((m) => (byType[m.key] ?? 0) > 0);
                    const showFallback = segments.length === 0 && d.count > 0;
                    const barPx = d.count === 0 ? 3 : Math.max((d.count / maxCount) * 64, 8);
                    const day = parseDayLocal(d.date);
                    return (
                      <div
                        key={d.date}
                        title={`${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}: ${d.count}`}
                        className="flex-1 flex flex-col justify-end"
                      >
                        <div
                          className="w-full rounded overflow-hidden flex flex-col-reverse"
                          style={{ height: `${barPx}px` }}
                        >
                          {showFallback ? (
                            <div className="w-full bg-primary/60" style={{ height: "100%" }} />
                          ) : (
                            segments.map((m) => (
                              <div
                                key={m.key}
                                className="w-full"
                                style={{
                                  height: `${((byType[m.key] ?? 0) / Math.max(d.count, 1)) * 100}%`,
                                  backgroundColor: m.color,
                                  minHeight: 2,
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Peak: {(() => {
                    const peak = last7Days.reduce((a, b) => (b.count > a.count ? b : a), last7Days[0]);
                    return `${peak.count} on ${parseDayLocal(peak.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}`;
                  })()}
                  {" · "}
                  Top city: {topCities[0] ? `${topCities[0].city} (${topCities[0].count})` : "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

