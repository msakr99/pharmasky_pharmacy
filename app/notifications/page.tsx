"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '../components/NavBar'
import { getToken } from '../lib/token-storage'

interface Notification {
  id: number
  user: {
    id: number
    username: string
    name: string
  }
  topic: any
  title: string
  message: string
  is_read: boolean
  extra: {
    type: string
    [key: string]: any
  }
  image_url: string
  created_at: string
}

interface NotificationStats {
  total: number
  unread: number
  read: number
}

const API_BASE = ''

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchNotifications()
    fetchStats()
  }, [filter, page])

  const fetchNotifications = async () => {
    setLoading(true)
    
    try {
      const token = getToken()
      let url = `${API_BASE}/api/notifications`
      
      if (filter === 'unread') {
        url = `${API_BASE}/api/notifications/unread`
      } else if (filter === 'read') {
        url = `${API_BASE}/api/notifications?is_read=true`
      } else {
        url = `${API_BASE}/api/notifications?page=${page}&page_size=20`
      }
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data.results || [])
      setHasMore(data.next !== null)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = getToken()
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
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const token = getToken()
      await fetch(
        `${API_BASE}/api/notifications/${id}/update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_read: true })
        }
      )
      
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = getToken()
      await fetch(
        `${API_BASE}/api/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const token = getToken()
      await fetch(
        `${API_BASE}/api/notifications/${id}/delete`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'sale_invoice': '🛒',
      'invoice_status_update': '🔔',
      'sale_payment': '✅',
      'sale_return': '↩️',
      'return_approved': '✅',
      'return_rejected': '❌',
      'refund_processed': '💰',
      'complaint_resolved': '✅',
      'wishlist_product_available': '✨',
      'payment_due_reminder': '⏰',
      'payment_overdue': '⚠️',
      'shift_started': '🟢',
      'shift_closed': '🔴',
    }
    return icons[type] || '📢'
  }

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'sale_invoice': '#3b82f6',
      'payment_due_reminder': '#f59e0b',
      'payment_overdue': '#ef4444',
      'wishlist_product_available': '#10b981',
      'shift_started': '#22c55e',
      'shift_closed': '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'الآن'
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`
    return `منذ ${Math.floor(seconds / 86400)} يوم`
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            📬 الإشعارات
          </h1>
          <button 
            onClick={markAllAsRead}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            تحديد الكل كمقروء
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">الإجمالي</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-sm border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.unread}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">غير مقروء</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.read}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">مقروء</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('all')}
          >
            الكل ({stats.total})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('unread')}
          >
            غير مقروء ({stats.unread})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'read' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('read')}
          >
            مقروء ({stats.read})
          </button>
        </div>
        
        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4 transition-all ${
                notification.is_read 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {getNotificationIcon(notification.extra?.type || '')}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatTimeAgo(notification.created_at)}</span>
                        {notification.extra?.type && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: getNotificationColor(notification.extra.type) + '20',
                              color: getNotificationColor(notification.extra.type)
                            }}
                          >
                            {notification.extra.type}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="تحديد كمقروء"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {notifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد إشعارات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'لم يتم العثور على أي إشعارات' 
                : filter === 'unread' 
                  ? 'لا توجد إشعارات غير مقروءة'
                  : 'لا توجد إشعارات مقروءة'
              }
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              تحميل المزيد
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
