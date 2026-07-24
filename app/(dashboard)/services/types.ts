export interface ServiceCategory {
  id: string; name: string; slug: string
}

export interface ServiceUser {
  firstName: string; lastName: string; email: string; companyName?: string; userTypes?: string[]
}

export interface ServiceListing {
  id: string; title: string; description: string
  price: number | null; currency: string; pricePeriod: string
  location: string | null; city: string | null
  status: string; moderationStatus: string
  viewCount: number; rejectionReason: string | null
  reviewedAt: string | null; reviewedBy: string | null
  createdAt: string
  user: ServiceUser | null
  category: ServiceCategory | null
}

export interface ServicesResponse {
  services: ServiceListing[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
