// nextjs-components/components/NotificationsList.tsx
// ═══════════════════════════════════════════════════════════════════
// مكون لعرض قائمة الإشعارات
// ═══════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// ═══════════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════════
interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  extra?: any;
}

interface NotificationsListProps {
  authToken: string;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: number) => void;
  refreshInterval?: number; // بالثواني
}

// ═══════════════════════════════════════════════════════════════════
// مكون قائمة الإشعارات
// ═══════════════════════════════════════════════════════════════════
/**
 * مكون لعرض قائمة الإشعارات
 * 
 * استخدام:
 * ```tsx
 * <NotificationsList 
 *   authToken={authToken}
 *   onNotificationClick={handleNotificationClick}
 *   refreshInterval={30}
 * />
 * ```
 */
export const NotificationsList: React.FC<NotificationsListProps> = ({
  authToken,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  refreshInterval = 30,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // جلب الإشعارات من API
  // ═══════════════════════════════════════════════════════════════
  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "فشل في جلب الإشعارات");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // تحديد إشعار كمقروء
  // ═══════════════════════════════════════════════════════════════
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/update/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_read: true }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
        onMarkAsRead?.(notificationId);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // تحديد جميع الإشعارات كمقروءة
  // ═══════════════════════════════════════════════════════════════
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, is_read: true }))
        );
        onMarkAllAsRead?.();
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // حذف إشعار
  // ═══════════════════════════════════════════════════════════════
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
        onDelete?.(notificationId);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // معالج النقر على الإشعار
  // ═══════════════════════════════════════════════════════════════
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  // ═══════════════════════════════════════════════════════════════
  // جلب الإشعارات عند التحميل والتحديث الدوري
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (authToken) {
      fetchNotifications();

      // تحديث دوري
      const interval = setInterval(fetchNotifications, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [authToken, refreshInterval]);

  // ═══════════════════════════════════════════════════════════════
  // عرض التحميل
  // ═══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">جاري تحميل الإشعارات...</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // عرض الخطأ
  // ═══════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 ml-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // عرض قائمة فارغة
  // ═══════════════════════════════════════════════════════════════
  if (notifications.length === 0) {
    return (
      <div className="text-center p-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          لا توجد إشعارات
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          ستحصل على إشعارات جديدة هنا
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // عرض قائمة الإشعارات
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* زر تحديد الكل كمقروء */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          الإشعارات ({notifications.filter((n) => !n.is_read).length} غير مقروءة)
        </h2>
        <button
          onClick={markAllAsRead}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      {/* قائمة الإشعارات */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              notification.is_read
                ? "bg-gray-50 border-gray-200"
                : "bg-blue-50 border-blue-200"
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    notification.is_read ? "text-gray-900" : "text-blue-900"
                  }`}
                >
                  {notification.title}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    notification.is_read ? "text-gray-600" : "text-blue-700"
                  }`}
                >
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </p>
              </div>

              {/* مؤشر عدم القراءة */}
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mr-2 mt-1"></div>
              )}

              {/* زر الحذف */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsList;
