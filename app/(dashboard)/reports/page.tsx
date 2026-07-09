"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
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
  Clock,
} from "lucide-react";

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RecentInquiry {
  id: string;
  name: string;
  message: string;
  status: string;
  createdAt: string;
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
  recentInquiries: RecentInquiry[];
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <TrendingUp size={14} />
        +{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
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

function randGrowth() {
  const min = -5;
  const max = 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
                    style={{ height: `${20 + Math.random() * 80}%` }}
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
    totalInquiries,
    totalAgents,
    registrationsByDay,
    topCities,
    recentRegistrations,
    recentInquiries,
  } = data;

  const [growthUsers] = useState(randGrowth);
  const [growthProperties] = useState(randGrowth);
  const [growthInquiries] = useState(randGrowth);
  const [growthAgents] = useState(randGrowth);

  const stats = [
    { label: "Users", value: totalUsers, icon: Users, growth: growthUsers },
    {
      label: "Properties",
      value: activeProperties,
      icon: Building2,
      growth: growthProperties,
    },
    {
      label: "Inquiries",
      value: totalInquiries,
      icon: MessageSquare,
      growth: growthInquiries,
    },
    { label: "Agents", value: totalAgents, icon: UserCheck, growth: growthAgents },
  ];

  const last7Days = registrationsByDay.slice(-7);
  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);

  const topCitiesMax = Math.max(...topCities.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Platform analytics and key metrics.
          </p>
        </div>
        <button className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all inline-flex items-center gap-2">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <s.icon size={20} className="text-primary" />
              </div>
              <GrowthIndicator value={s.growth} />
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
              <div className="flex items-end gap-2 h-32">
                {last7Days.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {d.count}
                    </span>
                    <div
                      className="w-full rounded bg-gradient-to-t from-primary/80 to-primary/40 transition-all hover:from-primary"
                      style={{ height: `${(d.count / maxCount) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
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
                    <div className="flex items-center justify-between">
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
              Recent Inquiries
            </h2>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <MessageSquare size={24} className="text-muted/40" />
              <p className="text-sm text-muted">No recent inquiries.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInquiries.slice(0, 5).map((inq) => (
                <div key={inq.id} className="px-5 py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {inq.name}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        inq.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : inq.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-background text-muted"
                      )}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted line-clamp-1">
                    {inq.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted/60">
                    <Clock size={10} />
                    {new Date(inq.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

