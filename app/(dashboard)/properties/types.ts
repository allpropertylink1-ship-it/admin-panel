export interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface PropertyUnit {
  id: string
  configuration: string
  label?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  area?: number | null
  price?: number | null
  pricePeriod?: string | null
  listingPurpose?: string | null
  availableUnits?: number | null
  status?: string | null
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
  coverImage?: string | null
  hasMultipleUnits?: boolean
  unitMixDescription?: string | null
  units?: PropertyUnit[]
  agent: Agent | null
}

export interface PropertiesResponse {
  properties: Property[]
  pagination: { total: number; page: number; totalPages: number; limit: number }
}
