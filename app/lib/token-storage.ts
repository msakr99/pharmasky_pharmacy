const TOKEN_KEY = 'pharmacy_auth_token'
const USER_KEY = 'pharmacy_user'

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export const setUser = (username: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, username)
  }
}

export const getUser = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_KEY)
  }
  return null
}

