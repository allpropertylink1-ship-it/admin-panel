"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Save,
  Globe,
  Mail,
  MessageCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "@/components/ui/icons";

interface Settings {
  platformName: string;
  platformUrl: string;
  contactEmail: string;
  emailFromName: string;
  emailFromEmail: string;
  emailReplyTo: string;
  whatsappNumber: string;
  whatsappResponseTime: string;
}

const RESPONSE_TIMES = [
  "Within 5 minutes",
  "Within 15 minutes",
  "Within 1 hour",
  "Within 4 hours",
  "Within 24 hours",
  "Within 48 hours",
];

const defaultSettings: Settings = {
  platformName: "",
  platformUrl: "",
  contactEmail: "",
  emailFromName: "",
  emailFromEmail: "",
  emailReplyTo: "",
  whatsappNumber: "",
  whatsappResponseTime: "Within 1 hour",
};

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-2">
      <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-28 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-5 p-5">
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.get<{ settings: Settings }>(
        "/api/admin/settings"
      );
      if (!error && data?.settings) {
        setForm((prev) => ({ ...prev, ...data.settings }));
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data, error } = await api.put("/api/admin/settings", form);
      if (!error && data) {
        setMessage({ type: "success", text: "Settings saved successfully." });
      } else {
        setMessage({
          type: "error",
          text: error || "Failed to save settings. Please try again.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Configure platform-wide settings.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm",
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-100 bg-error-50 text-red-700"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <AlertCircle size={18} className="text-red-500" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard icon={<Globe size={18} />} title="Platform">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Platform Name
            </label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => updateField("platformName", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Platform URL
            </label>
            <input
              type="url"
              value={form.platformUrl}
              onChange={(e) => updateField("platformUrl", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        </SectionCard>

        <SectionCard icon={<Mail size={18} />} title="Email">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              From Name
            </label>
            <input
              type="text"
              value={form.emailFromName}
              onChange={(e) => updateField("emailFromName", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              From Email
            </label>
            <input
              type="email"
              value={form.emailFromEmail}
              onChange={(e) => updateField("emailFromEmail", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Reply To
            </label>
            <input
              type="email"
              value={form.emailReplyTo}
              onChange={(e) => updateField("emailReplyTo", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        </SectionCard>

        <SectionCard icon={<MessageCircle size={18} />} title="WhatsApp">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Business Number
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
              placeholder="+254700000000"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Response Time
            </label>
            <select
              value={form.whatsappResponseTime}
              onChange={(e) =>
                updateField("whatsappResponseTime", e.target.value)
              }
              className="mt-1.5 w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            >
              {RESPONSE_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}