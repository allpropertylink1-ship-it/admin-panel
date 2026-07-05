"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardDate } from "./DashboardDate"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 lg:ml-0">
      <div className="flex items-center gap-3 lg:ml-0 ml-14">
        <h2 className="text-lg font-semibold text-foreground">
          {user?.firstName} {user?.lastName}
        </h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>
      <div className="flex items-center gap-3">
        <DashboardDate />
      </div>
    </header>
  )
}
