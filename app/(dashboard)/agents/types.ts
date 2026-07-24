export interface Agent {
  id: string
  fullName: string
  email: string
  phone: string
  agentCode: string
  status: string
  hasActivated: boolean
  suspendedAt: string | null
  suspendedReason: string | null
  createdAt: string
  _count: { users: number }
}

export interface AgentsResponse {
  agents: Agent[]
  total: number
  page: number
  totalPages: number
}
