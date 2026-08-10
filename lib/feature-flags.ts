export interface FeatureFlag {
  key: string
  enabled: boolean
  allowList: string[] | null
  description: string | null
  updatedAt: string
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
