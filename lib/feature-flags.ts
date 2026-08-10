export interface FeatureFlag {
  key: string
  enabled: boolean
  allowList: string[] | null
  description: string | null
  updatedAt: string
}

export interface PublicFeatureFlag {
  key: string
  enabled: boolean
  beta: boolean
  visible: boolean
}

export const FLAG_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

export function isValidFlagKey(key: string): boolean {
  return FLAG_KEY_PATTERN.test(key.trim()) && key.trim().length <= 64
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
