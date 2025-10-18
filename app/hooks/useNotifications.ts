// pharmacy-app/app/hooks/useNotifications.ts
// ═══════════════════════════════════════════════════════════════════
// React Hook لإدارة الإشعارات Push Notifications
// ═══════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  setupNotifications,
  onMessageListener,
  requestNotificationPermission,
  sendTokenToBackend,
} from "../lib/firebase";

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
  };
  data?: any;
}

interface UseNotificationsReturn {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  setupPushNotifications: () => Promise<void>;
}

/**
 * Hook لإدارة Push Notifications
 * 
 * استخدام:
 * ```tsx
 * const { 
 *   isSupported, 
 *   isPermissionGranted, 
 *   requestPermission 
 * } = useNotifications();
 * ```
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // التحقق من دعم الإشعارات عند التحميل
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // التحقق من أننا في المتصفح
    if (typeof window === "undefined") {
      return;
    }

    // التحقق من دعم الإشعارات
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);

    // التحقق من الإذن الحالي
    if (supported) {
      const permission = Notification.permission === "granted";
      setIsPermissionGranted(permission);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // الاستماع للإشعارات في Foreground
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isSupported || !isPermissionGranted) {
      return;
    }

    // معالج الإشعارات عندما يكون التطبيق مفتوحًا
    const unsubscribe = onMessageListener((payload: NotificationPayload) => {
      console.log("New notification received:", payload);

      // عرض الإشعار في المتصفح
      const title = payload.notification?.title || "إشعار جديد";
      const options = {
        body: payload.notification?.body || "",
        icon: payload.notification?.icon || "/icon.png",
        image: payload.notification?.image,
        data: payload.data,
        tag: payload.data?.tag || "notification",
        requireInteraction: false,
      };

      // عرض notification باستخدام Notification API
      if (Notification.permission === "granted") {
        new Notification(title, options);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isSupported, isPermissionGranted]);

  // ═══════════════════════════════════════════════════════════════
  // طلب إذن الإشعارات
  // ═══════════════════════════════════════════════════════════════
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("الإشعارات غير مدعومة في هذا المتصفح");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await requestNotificationPermission();

      if (token) {
        // إرسال Token إلى Backend
        const success = await sendTokenToBackend(token);

        if (success) {
          setIsPermissionGranted(true);
          console.log("Notifications enabled successfully");
        } else {
          setError("فشل في حفظ Token في الخادم");
        }
      } else {
        setError("تم رفض إذن الإشعارات");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      setError("حدث خطأ أثناء طلب إذن الإشعارات");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // ═══════════════════════════════════════════════════════════════
  // إعداد الإشعارات بشكل كامل
  // ═══════════════════════════════════════════════════════════════
  const setupPushNotifications = useCallback(async () => {
    if (!isSupported) {
      setError("الإشعارات غير مدعومة في هذا المتصفح");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await setupNotifications();
      setIsPermissionGranted(true);
    } catch (err) {
      console.error("Error setting up notifications:", err);
      setError("حدث خطأ أثناء إعداد الإشعارات");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isPermissionGranted,
    isLoading,
    error,
    requestPermission,
    setupPushNotifications,
  };
};

