export interface Claim {
  id: string
  amount: number
  currency: string
  adminModifiedAmount: number | null
  status: string
  adminNotes: string | null
  agentNotes: string | null
  reviewedAt: string | null
  paidAt: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; email: string; agentCode: string }
  referredUser: { id: string; firstName: string; lastName: string; phone: string | null } | null
  claimType: string
}

export interface ClaimResponse {
  claims: Claim[]
  total: number
  totalPages: number
}

export interface ClaimStats {
  total: number
  pending: number
  paid: number
  rejected: number
}
