'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import NavBar from '../components/NavBar';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  extra?: {
    type: string;
    [key: string]: any;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

  // جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      
      let url = 'http://129.212.140.152/notifications/notifications/';
      if (filter === 'unread') {
        url = 'http://129.212.140.152/notifications/notifications/unread/';
      } else if (filter === 'read') {
        url = 'http://129.212.140.152/notifications/notifications/?is_read=true';
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${authToken}`,
        }
      });
      
      const data = await response.json();
      setNotifications(data.results || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب الإحصائيات
  const fetchStats = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('http://129.212.140.152/notifications/notifications/stats/', {
        headers: {
          'Authorization': `Token ${authToken}`,
        }
      });
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // تحديد كمقروء
  const markAsRead = async (id: number) => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`http://129.212.140.152/notifications/notifications/${id}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      fetchStats();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // حذف الإشعار
  const deleteNotification = async (id: number) => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`http://129.212.140.152/notifications/notifications/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        }
      });
      
      setNotifications(notifications.filter(n => n.id !== id));
      fetchStats();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // تحديد الكل كمقروء
  const markAllAsRead = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch('http://129.212.140.152/notifications/notifications/mark-all-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
        }
      });
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      fetchStats();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // أيقونة الإشعار
  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'default': '📢',
      'order_created': '🛒',
      'order_updated': '📝',
      'order_cancelled': '❌',
      'payment_received': '💰',
      'payment_failed': '💳',
      'stock_low': '📦',
      'stock_out': '⚠️',
      'new_product': '🆕',
      'price_changed': '💲',
      'discount_available': '🎯',
      'complaint_created': '📋',
      'complaint_resolved': '🎉',
      'wishlist_product_available': '✨',
      'payment_due_reminder': '⏰',
      'payment_overdue': '⚠️',
      'shift_started': '🟢',
      'shift_closed': '🔴',
    };
    return icons[type] || '📢';
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل الإشعارات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الإشعارات</h1>
                  <p className="text-gray-600 dark:text-gray-400">إدارة إشعاراتك ومراقبة التحديثات</p>
                </div>
              </div>
              
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                تحديد الكل كمقروء
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800 dark:text-white">الإجمالي</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-800 dark:text-white">غير مقروء</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800 dark:text-white">مقروء</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.read}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                الكل ({stats.total})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                غير مقروء ({stats.unread})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                مقروء ({stats.read})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">لا توجد إشعارات</h3>
                <p className="text-gray-600 dark:text-gray-400">لم يتم العثور على إشعارات تطابق الفلتر المحدد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.extra?.type || 'default')}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`text-lg font-semibold ${
                              !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="تحديد كمقروء"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
