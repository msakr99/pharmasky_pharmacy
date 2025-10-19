// app/components/NotificationProvider.tsx
// ═══════════════════════════════════════════════════════════════════
// Provider لإدارة الإشعارات على مستوى التطبيق
// ═══════════════════════════════════════════════════════════════════

"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useNotifications } from "../hooks/useNotifications";

// ═══════════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════════
interface NotificationContextType {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: (authToken: string) => Promise<void>;
  setupPushNotifications: (authToken: string) => Promise<void>;
}

interface NotificationProviderProps {
  children: ReactNode;
  authToken: string;
  autoSetup?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// إنشاء Context
// ═══════════════════════════════════════════════════════════════════
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// ═══════════════════════════════════════════════════════════════════
// Provider Component
// ═══════════════════════════════════════════════════════════════════
/**
 * Provider لإدارة الإشعارات على مستوى التطبيق
 * 
 * استخدام:
 * ```tsx
 * <NotificationProvider authToken={authToken} autoSetup={true}>
 *   <App />
 * </NotificationProvider>
 * ```
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  authToken,
  autoSetup = false,
}) => {
  const notifications = useNotifications();

  // ═══════════════════════════════════════════════════════════════
  // إعداد الإشعارات تلقائيًا إذا كان مفعلًا
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (
      autoSetup &&
      authToken &&
      authToken.trim() !== '' &&
      notifications.isSupported &&
      !notifications.isPermissionGranted &&
      !notifications.isLoading
    ) {
      // تأخير بسيط لتحسين UX
      const timer = setTimeout(() => {
        console.log('Setting up notifications with token:', authToken.substring(0, 20) + '...');
        notifications.setupPushNotifications(authToken);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    autoSetup,
    authToken,
    notifications.isSupported,
    notifications.isPermissionGranted,
    notifications.isLoading,
    notifications.setupPushNotifications,
  ]);

  // ═══════════════════════════════════════════════════════════════
  // تحديث authToken عند تغييره
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (
      authToken &&
      notifications.isSupported &&
      notifications.isPermissionGranted &&
      !notifications.isLoading
    ) {
      // إعادة إعداد الإشعارات عند تغيير authToken
      notifications.setupPushNotifications(authToken);
    }
  }, [authToken, notifications.isSupported, notifications.isPermissionGranted, notifications.isLoading, notifications.setupPushNotifications]);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Hook للوصول إلى Context
// ═══════════════════════════════════════════════════════════════════
/**
 * Hook للوصول إلى Notification Context
 * 
 * استخدام:
 * ```tsx
 * const { isSupported, requestPermission } = useNotificationContext();
 * ```
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  
  return context;
};

// ═══════════════════════════════════════════════════════════════════
// Export الـ Provider كـ default
// ═══════════════════════════════════════════════════════════════════
export default NotificationProvider;
