export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  accountStatus: string
  kycStatus: string
  createdAt: string
  phone?: string
  category?: string
  userTypes?: string[]
  primaryUserType?: string
  _count?: { properties: number; serviceListings: number }
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}