"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardDate } from "@/components/DashboardDate"
import { Menu, User } from "@/components/ui/icons"
import { useContext, createContext, useState } from "react"

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)
  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function DashboardHeader() {
  const { user } = useAuth()
  const { isOpen, toggle } = useSidebar()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="touch-target lg:hidden flex items-center justify-center rounded-lg p-2 text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          <DashboardDate />
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {user && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3">
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
              <div className="flex sm:hidden items-center gap-2">
                <User size={16} className="text-muted" />
                <span className="text-sm font-medium text-foreground">{user.fullName?.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
