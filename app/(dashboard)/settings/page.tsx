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
} from "lucide-react";

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
  platformName: "All Property Link",
  platformUrl: "https://allpropertylink.co.ke",
  contactEmail: "info@allpropertylink.co.ke",
  emailFromName: "All Property Link",
  emailFromEmail: "noreply@allpropertylink.co.ke",
  emailReplyTo: "support@allpropertylink.co.ke",
  whatsappNumber: "",
  whatsappResponseTime: "Within 1 hour",
};

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
      const { data, error } = await api.get<Settings>("/api/admin/settings");
      if (!error && data) {
        setForm({ ...defaultSettings, ...data });
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
      const { data, error } = await api.post("/api/admin/settings", form);
      if (!error) {
        setMessage({ type: "success", text: "Settings saved successfully." });
      } else {
        setMessage({
          type: "error",
          text: "Failed to save settings. Please try again.",
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

  function updateField<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Configure platform-wide settings.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium",
            message.type === "success"
              ? "border-success/20 bg-success/5 text-success"
              : "border-error/20 bg-error/5 text-error"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <Globe size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">General</h2>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Platform Name
              </label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) =>
                  updateField("platformName", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Platform URL
              </label>
              <input
                type="url"
                value={form.platformUrl}
                onChange={(e) =>
                  updateField("platformUrl", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  updateField("contactEmail", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <Mail size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Email</h2>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                From Name
              </label>
              <input
                type="text"
                value={form.emailFromName}
                onChange={(e) =>
                  updateField("emailFromName", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                From Email
              </label>
              <input
                type="email"
                value={form.emailFromEmail}
                onChange={(e) =>
                  updateField("emailFromEmail", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Reply To
              </label>
              <input
                type="email"
                value={form.emailReplyTo}
                onChange={(e) =>
                  updateField("emailReplyTo", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <MessageCircle size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">WhatsApp</h2>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Business Number
              </label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(e) =>
                  updateField("whatsappNumber", e.target.value)
                }
                placeholder="+254700000000"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Response Time
              </label>
              <select
                value={form.whatsappResponseTime}
                onChange={(e) =>
                  updateField("whatsappResponseTime", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {RESPONSE_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
