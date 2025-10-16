import type { LoginCredentials, LoginResponse } from './types'
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

