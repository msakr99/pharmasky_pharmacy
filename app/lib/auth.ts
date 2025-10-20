import type { LoginCredentials, LoginResponse, PharmacyRegistrationData, PharmacyRegistrationResponse } from './types'
import { setUser } from './token-storage'

export async function userLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'فشل تسجيل الدخول')
    }

    const data = await response.json()
    
    // Store username
    if (data.user?.username) {
      setUser(data.user.username)
    } else if (credentials.username) {
      setUser(credentials.username)
    }

    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export async function pharmacyRegistration(data: PharmacyRegistrationData): Promise<PharmacyRegistrationResponse> {
  try {
    const response = await fetch('http://129.212.140.152/accounts/register/pharmacy/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'فشل تسجيل الصيدلية')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Pharmacy registration error:', error)
    throw error
  }
}

