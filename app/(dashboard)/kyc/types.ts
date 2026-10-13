export interface UserInfo {
  id: string; firstName: string; lastName: string; email: string; avatar: string | null; kycStatus?: string
  role?: string | null
  userTypes?: string[] | null
  primaryUserType?: string | null
  phone?: string | null
  companyName?: string | null
  category?: string | null
  accountStatus?: string | null
  emailVerified?: string | null
  phoneVerified?: boolean | null
  createdAt?: string | null
  referredByAgentCode?: string | null
  aplAgent?: { id: string; fullName: string; agentCode: string; email?: string | null; phone?: string | null } | null
}

export interface KycDocument {
  id: string; documentType: string; documentNumber: string | null
  status: string; frontImage: string | null; backImage: string | null
  businessPermit: string | null
  bioData: { firstName?: string; middleName?: string; lastName?: string; phone?: string; email?: string } | null
  rejectionReason: string | null; adminNotes: string | null; createdAt: string; verifiedAt: string | null
  user: UserInfo
}

export interface KycResponse {
  documents: KycDocument[]; total: number; page: number; totalPages: number
}

export interface UserDocsResponse {
  documents: KycDocument[]; total: number
}
