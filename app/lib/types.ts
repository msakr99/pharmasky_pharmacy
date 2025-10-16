export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user?: {
    id: number
    username: string
    name?: string
  }
}

export interface ApiError {
  message: string
  status?: number
}

export interface NavigationItem {
  label: string
  href?: string
  submenu?: Array<{ href: string; label: string }>
}

export interface PharmacyDetails {
  id: number
  name: string
  code: string
  phone?: string
  address?: string
  manager?: string
  balance: number
  discount_percentage?: number
}

export interface PharmacyStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  activeOffers: number
}

export interface Offer {
  id: number
  product: {
    id: number
    name: string
    code?: string
    public_price?: number
  }
  selling_discount_percentage: number
  remaining_amount: number
  user?: {
    id: number
    name: string
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

