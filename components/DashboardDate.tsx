"use client";

import { useState, useEffect } from "react";

export function DashboardDate() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  if (!dateStr) return null;

  return <time className="text-sm text-muted" suppressHydrationWarning>{dateStr}</time>;
}
