"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api-client"

interface GoogleSignInButtonProps {
  onSuccess: () => void
  onError: (error: string) => void
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("google-gsi-script")) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.id = "google-gsi-script"
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const btnRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)

  const handleCredential = useCallback(async (credential: string) => {
    setLoading(true)
    const { data, error } = await api.post<{ user: { firstName: string } }>("/api/auth/oauth/google", { credential })
    setLoading(false)
    if (error) {
      onError(error)
      return
    }
    if (data?.user) onSuccess()
  }, [onSuccess, onError])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setReady(false)
      return
    }
    loadGoogleScript().then(() => {
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready || renderedRef.current || !btnRef.current) return
    renderedRef.current = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google
    if (!google?.accounts?.id) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (response: any) => {
        if (response?.credential) {
          handleCredential(response.credential)
        } else {
          onError("Google sign-in failed")
        }
      },
    })

    google.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      shape: "rectangular",
      theme: "outline",
      text: "signin_with",
      size: "large",
      width: btnRef.current.offsetWidth || "100%",
      logo_alignment: "left",
    })
  }, [ready, handleCredential, onError])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="touch-target flex w-full items-center justify-center gap-3 rounded-lg border border-primary-600 bg-primary-700/50 px-4 py-3 text-sm font-medium text-primary-300 opacity-50 cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {loading ? "Processing..." : "Sign in with Google"}
      </button>
    )
  }

  return (
    <div className="w-full">
      <div ref={btnRef} className="flex justify-center [&>div]:w-full [&>div>iframe]:!w-full" />
      {loading && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-primary-200">Verifying Google account...</span>
        </div>
      )}
    </div>
  )
}
