export interface KycDocument {
  id: string
  documentType: string
  documentNumber?: string
  status: string
  frontImage?: string
  backImage?: string
}

export interface PendingUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  category?: string
  specialties: string[]
  companyName?: string
  contactPerson?: string
  website?: string
  location?: string
  city?: string
  estateSubLocation?: string
  createdAt: string
  kycDocuments: KycDocument[]
}
