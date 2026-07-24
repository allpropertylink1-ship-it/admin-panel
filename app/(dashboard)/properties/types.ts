export interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Property {
  id: string
  slug: string
  title: string
  price: number
  currency: string
  propertyType: string
  listingPurpose: string | null
  city: string
  moderationStatus: string
  isPublished: boolean
  isFeatured: boolean
  rejectionReason: string | null
  createdAt: string
  agent: Agent | null
}

export interface PropertiesResponse {
  properties: Property[]
  pagination: { total: number; page: number; totalPages: number; limit: number }
}
