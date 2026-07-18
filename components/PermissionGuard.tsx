"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
  permission: string
  action?: "read" | "write"
  children: React.ReactNode
}

export function PermissionGuard({ permission, action = "read", children }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const perm = (user as any).permissions?.[permission]
      if (!perm || !perm[action]) {
        router.replace("/dashboard")
      }
    }
  }, [user, permission, action, router])

  if (!user) return null
  if (user.role === "SUPER_ADMIN") return <>{children}</>

  const perm = (user as any).permissions?.[permission]
  if (!perm || !perm[action]) return null

  return <>{children}</>
}