"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { api } from "./api-client"

interface User {
  id: string
  email: string
  fullName: string
  role: string
  authMethod: string
  permissions?: Record<string, { read: boolean; write: boolean }>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const { data, error } = await api.get<{ user: User }>("/api/auth/me")
      if (data?.user) {
        if (data.user.authMethod !== "admin") {
          setUser(null)
          return
        }
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await api.post<{ user: User }>("/api/auth/admin-login", { email, password })
    if (data?.user) {
      setUser(data.user)
      return {}
    }
    return { error: error || "Login failed" }
  }, [])

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout")
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
