"use client"

import { useState, useEffect } from 'react'
import { getToken } from '../lib/token-storage'

interface NotificationStats {
  total: number
  unread: number
  read: number
}

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
  refreshInterval?: number;
}

export default function NotificationBadge({ 
  onClick, 
  className = "",
  refreshInterval = 30 
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchUnreadCount = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      setError(null)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/stats/`,
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
      } else {
        const errorData = await response.json()
        setError(errorData.message || "فشل في جلب الإحصائيات")
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setError("خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh دوري
    const interval = setInterval(fetchUnreadCount, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshInterval])
  
  // الاستماع للتحديثات من مصادر أخرى
  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchUnreadCount()
    }

    window.addEventListener("notification_updated", handleNotificationUpdate)
    window.addEventListener("notification_read", handleNotificationUpdate)
    window.addEventListener("notification_deleted", handleNotificationUpdate)

    return () => {
      window.removeEventListener("notification_updated", handleNotificationUpdate)
      window.removeEventListener("notification_read", handleNotificationUpdate)
      window.removeEventListener("notification_deleted", handleNotificationUpdate)
    }
  }, [])
  
  if (loading) {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }
  
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* أيقونة الإشعارات */}
      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      {/* شارة العدد */}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* مؤشر خطأ */}
      {error && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
          !
        </span>
      )}
    </div>
  )
}
