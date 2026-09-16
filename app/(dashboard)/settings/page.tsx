"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Save,
  Globe,
  Mail,
  MessageCircle,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";

interface Settings {
  platformName: string;
  platformUrl: string;
  contactEmail: string;
  emailFromName: string;
  emailFromEmail: string;
  emailReplyTo: string;
  whatsappNumber: string;
  whatsappResponseTime: string;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
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
  maintenanceMode: false,
  maintenanceTitle: "We'll be back shortly",
  maintenanceMessage:
    "Our site is currently undergoing scheduled maintenance. Thank you for your patience and understanding.",
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Two-step confirm when switching maintenance OFF→ON. Tracks the loaded
  // value so saving other fields while already ON never re-prompts.
  const [confirmingMaintenance, setConfirmingMaintenance] = useState(false);
  const initialMaintenance = useRef(false);
  const { user } = useAuth();
  const canWrite =
    user?.role === "SUPER_ADMIN" || !!user?.permissions?.settings?.write;

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.get<{ settings: Settings }>(
        "/api/admin/settings"
      );
      if (!error && data?.settings) {
        setForm((prev) => ({ ...prev, ...data.settings }));
        initialMaintenance.current = data.settings.maintenanceMode === true;
        setConfirmingMaintenance(false);
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await fetchSettings(); })();
  }, [fetchSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};
    const urlFields = ["platformUrl"] as const;
    for (const key of urlFields) {
      const val = form[key];
      if (val && !val.startsWith("http://") && !val.startsWith("https://")) {
        errors[key] = "Must start with http:// or https://";
      }
    }
    const numberFields: (keyof Settings)[] = [];
    for (const key of numberFields) {
      const val = form[key];
      if (val && isNaN(Number(val))) {
        errors[key] = "Must be a valid number";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    // Switching maintenance OFF→ON takes the public site offline: require an
    // explicit second click. Already-ON saves and the confirm click itself
    // pass straight through.
    if (
      form.maintenanceMode &&
      !initialMaintenance.current &&
      !confirmingMaintenance
    ) {
      setConfirmingMaintenance(true);
      return;
    }
    setConfirmingMaintenance(false);
    setSaving(true);
    setMessage(null);
    try {
      const { data, error } = await api.put("/api/admin/settings", form);
      if (!error && data) {
        initialMaintenance.current = form.maintenanceMode === true;
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

  async function handlePreview() {
    setPreviewLoading(true);
    setMessage(null);
    try {
      const { data, error } = await api.post<{ token: string }>(
        "/api/admin/maintenance-bypass",
        {}
      );
      if (error || !data?.token) {
        setMessage({
          type: "error",
          text: error || "Failed to issue preview link. Please try again.",
        });
        return;
      }
      // Main site lives on www; the admin panel lives on admin. Do not derive
      // from NEXT_PUBLIC vars (they may be unset) — hardcode the canonical host.
      const mainOrigin = "https://www.allpropertylink.co.ke";
      window.open(
        `${mainOrigin}/api/bypass?token=${encodeURIComponent(data.token)}`,
        "_blank",
        "noopener"
      );
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred while issuing the preview link.",
      });
    } finally {
      setPreviewLoading(false);
    }
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
            {fieldErrors.platformUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.platformUrl}</p>}
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              placeholder="+254700000000"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!canWrite}
              className="mt-1.5 w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {RESPONSE_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        <SectionCard icon={<Wrench size={18} />} title="Maintenance Mode">
          <div>
            <span className="block text-sm font-medium text-foreground">
              Status
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([false, true] as boolean[]).map((mode) => (
                <button
                  key={String(mode)}
                  type="button"
                  disabled={!canWrite}
                  onClick={() => updateField("maintenanceMode", mode)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    form.maintenanceMode === mode
                      ? mode
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {mode ? "On" : "Off"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              Turning this ON replaces the main site with a maintenance page.
            </p>
            {confirmingMaintenance && form.maintenanceMode && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">
                  Saving now will take the public site offline for all
                  visitors.
                </p>
                <p className="mt-1">
                  Click Save Settings again to confirm, switch back to Off to
                  cancel, or press Cancel.
                </p>
                <button
                  type="button"
                  disabled={!canWrite}
                  onClick={() => {
                    setConfirmingMaintenance(false);
                    updateField("maintenanceMode", false);
                  }}
                  className="mt-2 rounded-lg border border-amber-300 bg-background px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Page Title
            </label>
            <input
              type="text"
              value={form.maintenanceTitle}
              onChange={(e) => updateField("maintenanceTitle", e.target.value)}
              disabled={!canWrite}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              rows={3}
              value={form.maintenanceMessage}
              onChange={(e) => updateField("maintenanceMessage", e.target.value)}
              disabled={!canWrite}
              className="mt-1.5 min-h-[88px] w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handlePreview}
              disabled={!canWrite || previewLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {previewLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Eye size={16} />
              )}
              {previewLoading ? "Issuing preview link..." : "Preview live site"}
            </button>
            <p className="mt-1 text-xs text-muted">
              Opens the live site in a new tab with a 12-hour preview bypass.
            </p>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !canWrite}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving
              ? "Saving..."
              : confirmingMaintenance && form.maintenanceMode
                ? "Confirm: Take Site Offline"
                : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}