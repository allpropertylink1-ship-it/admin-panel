"use client"

import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"

function DashboardDate() {
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  return (
    <time dateTime={now.toISOString()} className="text-sm text-muted hidden sm:block">
      {now.toLocaleDateString("en-US", opts)}
    </time>
  )
}

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 lg:ml-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 lg:ml-0 ml-14">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <DashboardDate />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <button className="touch-target relative rounded-xl p-2 text-muted hover:bg-primary-50 hover:text-primary transition-colors" title="Notifications">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white animate-pulse-dot" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-600 text-white text-xs font-bold shadow-sm shadow-accent/20">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                  {user.firstName} {user.lastName}
                </p>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Admin
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
