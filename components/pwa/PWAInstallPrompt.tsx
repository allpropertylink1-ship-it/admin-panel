"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "@/components/ui/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-dismissed-at";
const INSTALLED_KEY = "pwa-installed";
const VIEWS_KEY = "pwa-page-views";
const FIRST_VISIT_KEY = "pwa-first-visit";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ENGAGEMENT_MIN_VIEWS = 1;
const ENGAGEMENT_MIN_ELAPSED_MS = 10_000;

function isDismissedValid(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      localStorage.removeItem(DISMISSED_KEY);
      return false;
    }
    if (Date.now() - ts < DISMISS_TTL_MS) return true;
    // Expired — allow re-prompting.
    localStorage.removeItem(DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

function isStandaloneNow(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  } catch {
    return false;
  }
}

function isEngaged(): boolean {
  try {
    const views = Number(sessionStorage.getItem(VIEWS_KEY) ?? "0");
    const first = Number(sessionStorage.getItem(FIRST_VISIT_KEY) ?? "0");
    if (!Number.isFinite(views) || !Number.isFinite(first) || first === 0) return false;
    return views >= ENGAGEMENT_MIN_VIEWS && Date.now() - first >= ENGAGEMENT_MIN_ELAPSED_MS;
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Focus management without a second effect: focus the first button on mount.
  const dialogCallbackRef = (el: HTMLDivElement | null) => {
    dialogRef.current = el;
    el?.querySelector<HTMLElement>("button")?.focus();
  };

  // Single mount effect — all environment detection is computed into locals
  // (never read from state inside handlers; avoids the stale-closure bug).
  useEffect(() => {
    const ua = navigator.userAgent;
    const nav = navigator as Navigator & { standalone?: boolean; maxTouchPoints?: number };
    const msStream = (window as unknown as { MSStream?: unknown }).MSStream;

    const iosLocal =
      (/iPad|iPhone|iPod/.test(ua) && !msStream) ||
      (ua.includes("Macintosh") && (nav.maxTouchPoints ?? 0) > 1); // iPadOS desktop-mode
    const standaloneLocal = nav.standalone === true || isStandaloneNow();
    const mobileLocal =
      /Mobi|Android|iPhone|iPad|iPod/.test(ua) || (nav.maxTouchPoints ?? 0) > 1;

    // Mount-time one-shot environment detection (runs once, no cascade):
    // values gate prompt visibility only; initial render is always hidden.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(iosLocal);
    setIsStandalone(standaloneLocal);
    setIsMobile(mobileLocal);

    // Engagement tracking: count page-views this session, stamp first visit.
    try {
      const views = Number(sessionStorage.getItem(VIEWS_KEY) ?? "0");
      sessionStorage.setItem(VIEWS_KEY, String((Number.isFinite(views) ? views : 0) + 1));
      if (!sessionStorage.getItem(FIRST_VISIT_KEY)) {
        sessionStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
      }
    } catch {
      // sessionStorage unavailable (private mode) — engagement gate stays closed.
    }

    // Stale installed flag: not actually installed if not in standalone mode.
    try {
      if (localStorage.getItem(INSTALLED_KEY) && !standaloneLocal) {
        localStorage.removeItem(INSTALLED_KEY);
      }
    } catch {
      // ignore
    }

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    const clearShowTimer = () => {
      if (showTimer !== null) {
        clearTimeout(showTimer);
        showTimer = null;
      }
    };

    // Schedule the prompt only once the engagement gate passes.
    // Uses locals only — never reads React state (stale-closure safe).
    const scheduleGatedShow = () => {
      if (standaloneLocal) return;
      if (isDismissedValid()) return;
      try {
        if (localStorage.getItem(INSTALLED_KEY)) return;
      } catch {
        // ignore
      }
      clearShowTimer();
      let remaining = 0;
      try {
        const first = Number(sessionStorage.getItem(FIRST_VISIT_KEY) ?? String(Date.now()));
        remaining = Math.max(0, ENGAGEMENT_MIN_ELAPSED_MS - (Date.now() - first));
      } catch {
        remaining = ENGAGEMENT_MIN_ELAPSED_MS;
      }
      showTimer = setTimeout(() => {
        showTimer = null;
        if (isStandaloneNow()) return;
        if (isDismissedValid()) return;
        if (isEngaged()) setShowPrompt(true);
      }, remaining);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // MDN flow: stash for later user-gesture prompt()
      const bip = e as BeforeInstallPromptEvent;
      setDeferredPrompt(bip);
      deferredRef.current = bip;
      scheduleGatedShow();
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "true");
      } catch {
        // ignore
      }
      deferredRef.current = null;
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        try {
          localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        } catch {
          // ignore
        }
        clearShowTimer();
        setShowPrompt(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("keydown", handleKeyDown);

    // iOS never fires beforeinstallprompt — gate on engagement the same way.
    if (iosLocal && !standaloneLocal && mobileLocal) {
      scheduleGatedShow();
    }

    return () => {
      clearShowTimer();
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleInstall = async () => {
    // MDN flow: prompt() must run inside the click gesture; event is single-use.
    const bip = deferredRef.current ?? deferredPrompt;
    if (!bip) {
      setShowPrompt(false);
      return;
    }
    try {
      await bip.prompt();
      const { outcome } = await bip.userChoice;
      if (outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "true");
        } catch {
          // ignore
        }
      }
    } catch {
      // prompt() can throw if the event was already consumed — treat as dismissed.
    } finally {
      // Never reuse the event.
      deferredRef.current = null;
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShowPrompt(false);
  };

  // Gated branches — no unconditional `if (isIOS) return`.
  // localStorage is read here (not state), so render gating never goes stale.
  if (!showPrompt || isStandalone || isDismissedValid()) return null;
  const showIOS = isIOS && isMobile && !isStandalone;
  const showAndroid = !isIOS && deferredPrompt !== null && !isStandalone;
  if (!showIOS && !showAndroid) return null;

  return (
    <div
      ref={dialogCallbackRef}
      className="fixed bottom-0 left-0 right-0 z-[60] md:left-auto md:right-4 md:bottom-4 md:max-w-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Install APL Admin"
    >
      <div className="bg-card border-t border-border rounded-t-2xl md:rounded-2xl md:border px-4 py-4 shadow-xl">
        {showIOS ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Install Admin App</h3>
              <button
                onClick={handleDismiss}
                className="touch-target p-1 text-muted"
                aria-label="Dismiss install prompt"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Tap the <Download size={16} className="inline" /> Share button, then{" "}
              <strong>Add to Home Screen</strong> for fast access to the dashboard, claims,
              KYC &amp; disputes.
            </p>
            <button
              onClick={handleDismiss}
              className="touch-target w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium"
            >
              Got it
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Install APL Admin</h3>
              <button
                onClick={handleDismiss}
                className="touch-target p-1 text-muted"
                aria-label="Dismiss install prompt"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Fast access to the dashboard, claims, KYC &amp; disputes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                autoFocus
                className="touch-target flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="touch-target flex-1 border border-border bg-card text-foreground py-2.5 rounded-xl font-medium"
              >
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
