"use client";

import { useState } from "react";

export function DashboardDate() {
  const [dateStr] = useState(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  return <time className="text-sm text-muted" suppressHydrationWarning>{dateStr}</time>;
}
