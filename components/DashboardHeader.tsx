"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell } from "@/components/ui/icons"
import { DashboardDate } from "@/components/DashboardDate"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6 lg:ml-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 lg:ml-0 ml-14">
        <div className="hidden sm:flex items-center gap-1.5">
          <DashboardDate />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <button className="touch-target relative rounded-xl p-2 text-muted hover:bg-gray-100 hover:text-foreground transition-colors" title="Notifications">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white text-xs font-bold shadow-sm">
                {user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "A"}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                  {user.fullName}
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
