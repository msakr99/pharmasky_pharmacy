// React Hook for Notifications
import { useEffect, useState, useCallback } from 'react';
import { notificationsManager } from './notifications-manager';

export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  registered: boolean;
  polling: boolean;
}

export function useNotifications(authToken: string | null) {
  const [status, setStatus] = useState<NotificationStatus>({
    supported: false,
    permission: 'default',
    registered: false,
    polling: false
  });

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // تهيئة الإشعارات
  const initializeNotifications = useCallback(async () => {
    try {
      // تسجيل Service Worker
      await notificationsManager.registerServiceWorker();
      
      // طلب إذن الإشعارات
      const permission = await notificationsManager.requestPermission();
      
      setStatus(prev => ({
        ...prev,
        supported: true,
        permission,
        registered: true
      }));

      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }, []);

  // بدء مراقبة الإشعارات
  const startPolling = useCallback(async () => {
    if (!authToken || status.polling) return;

    try {
      const interval = await notificationsManager.startNotificationPolling(authToken, 30000);
      setPollingInterval(interval);
      setStatus(prev => ({ ...prev, polling: true }));
      console.log('Notification polling started');
    } catch (error) {
      console.error('Failed to start polling:', error);
    }
  }, [authToken, status.polling]);

  // إيقاف مراقبة الإشعارات
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      notificationsManager.stopNotificationPolling(pollingInterval);
      setPollingInterval(null);
      setStatus(prev => ({ ...prev, polling: false }));
      console.log('Notification polling stopped');
    }
  }, [pollingInterval]);

  // إرسال إشعار فوري
  const sendNotification = useCallback((title: string, message: string, type: string = 'info') => {
    notificationsManager.sendImmediateNotification(title, message, type);
  }, []);

  // تحديث حالة الإشعارات
  const updateStatus = useCallback(() => {
    const newStatus = notificationsManager.getNotificationStatus();
    setStatus(prev => ({
      ...prev,
      ...newStatus,
      polling: !!pollingInterval
    }));
  }, [pollingInterval]);

  // تهيئة تلقائية عند تحميل المكون
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // بدء المراقبة عند توفر التوكن
  useEffect(() => {
    if (authToken && status.registered && status.permission === 'granted') {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [authToken, status.registered, status.permission, startPolling, stopPolling]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    initializeNotifications,
    startPolling,
    stopPolling,
    sendNotification,
    updateStatus
  };
}

// Hook مبسط للاستخدام السريع
export function useQuickNotifications() {
  const [enabled, setEnabled] = useState(false);

  const enableNotifications = useCallback(async () => {
    try {
      await notificationsManager.requestPermission();
      await notificationsManager.registerServiceWorker();
      setEnabled(true);
      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, []);

  const sendQuickNotification = useCallback((title: string, message: string) => {
    if (enabled) {
      notificationsManager.sendImmediateNotification(title, message);
    }
  }, [enabled]);

  return {
    enabled,
    enableNotifications,
    sendQuickNotification
  };
}
