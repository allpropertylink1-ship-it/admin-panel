"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Service workers require a secure context (https or localhost).
    if (typeof window !== "undefined" && !window.isSecureContext) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // No-op on failure — offline support is progressive enhancement.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
