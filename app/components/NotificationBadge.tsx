"use client"

import { useState, useEffect } from 'react'
import { getToken } from '../lib/token-storage'

interface NotificationStats {
  total: number
  unread: number
  read: number
}

const API_BASE = ''

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const fetchUnreadCount = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      const response = await fetch(
        `${API_BASE}/api/notifications/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.data?.unread || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh كل 30 ثانية
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])
  
  if (loading) {
    return (
      <div className="relative">
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
        </svg>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
