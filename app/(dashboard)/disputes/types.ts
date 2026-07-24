export interface Dispute {
  id: string
  title: string
  description: string
  amount: number
  currency: string
  status: string
  resolution: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  aplAgent: { id: string; fullName: string; email: string; agentCode: string }
  claim: { id: string; amount: number; status: string; property: { title: string } } | null
}

export interface DisputeResponse {
  disputes: Dispute[]
  total: number
  totalPages: number
}
