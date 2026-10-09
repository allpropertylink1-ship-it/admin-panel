"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
  permission: string
  action?: "read" | "write"
  // Page-level guards redirect to /dashboard on denial (default true).
  // Button-level guards must pass redirect={false} so read-only users keep
  // the page and only lose the button instead of being navigated away.
  redirect?: boolean
  children: React.ReactNode
}

export function PermissionGuard({ permission, action = "read", redirect = true, children }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!redirect) return
    if (user && user.role !== "SUPER_ADMIN") {
      const perm = user.permissions?.[permission as keyof typeof user.permissions]
      if (!perm || !perm[action]) {
        router.replace("/dashboard")
      }
    }
  }, [user, permission, action, redirect, router])

  if (!user) return null
  if (user.role === "SUPER_ADMIN") return <>{children}</>

  const perm = user.permissions?.[permission as keyof typeof user.permissions]
  if (!perm || !perm[action]) return null

  return <>{children}</>
}