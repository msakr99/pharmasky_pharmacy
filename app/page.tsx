"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from './lib/token-storage'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

