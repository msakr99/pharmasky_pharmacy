// pharmacy-app/app/components/NotificationSetup.tsx
// ═══════════════════════════════════════════════════════════════════
// مكون لإعداد وطلب إذن الإشعارات
// ═══════════════════════════════════════════════════════════════════

"use client";

import { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

/**
 * مكون لإعداد الإشعارات تلقائيًا عند تسجيل الدخول
 * 
 * استخدام:
 * - أضف هذا المكون في layout.tsx أو في صفحة معينة
 * - سيطلب الإذن تلقائيًا إذا لم يكن ممنوحًا
 * 
 * ```tsx
 * <NotificationSetup autoRequest={true} />
 * ```
 */
interface NotificationSetupProps {
  /**
   * طلب الإذن تلقائيًا عند التحميل؟
   * @default false
   */
  autoRequest?: boolean;
  
  /**
   * إظهار زر لطلب الإذن يدويًا؟
   * @default true
   */
  showButton?: boolean;
}

export const NotificationSetup: React.FC<NotificationSetupProps> = ({
  autoRequest = false,
  showButton = true,
}) => {
  const {
    isSupported,
    isPermissionGranted,
    isLoading,
    error,
    requestPermission,
  } = useNotifications();

  // ═══════════════════════════════════════════════════════════════
  // طلب الإذن تلقائيًا إذا كان مفعلًا
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (autoRequest && isSupported && !isPermissionGranted && !isLoading) {
      // تأخير بسيط لتحسين UX
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [autoRequest, isSupported, isPermissionGranted, isLoading, requestPermission]);

  // ═══════════════════════════════════════════════════════════════
  // لا نعرض شيئًا إذا كانت الإشعارات مفعلة بالفعل
  // ═══════════════════════════════════════════════════════════════
  if (!isSupported) {
    return null; // أو يمكن إظهار رسالة أن المتصفح لا يدعم الإشعارات
  }

  if (isPermissionGranted) {
    return null; // الإشعارات مفعلة بالفعل
  }

  // ═══════════════════════════════════════════════════════════════
  // عرض زر أو رسالة لطلب الإذن
  // ═══════════════════════════════════════════════════════════════
  if (!showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {/* أيقونة الجرس */}
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
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
          </div>

          {/* المحتوى */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              تفعيل الإشعارات
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              احصل على إشعارات فورية عن الطلبات والعروض الجديدة
            </p>

            {/* رسالة الخطأ */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                {error}
              </p>
            )}

            {/* الأزرار */}
            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "جاري التفعيل..." : "تفعيل"}
              </button>
              <button
                onClick={() => {
                  // إخفاء الإشعار (يمكن تخزين في localStorage)
                  localStorage.setItem("notification_dismissed", "true");
                  window.dispatchEvent(new Event("notification_dismissed"));
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                لاحقًا
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// مكون بديل: زر بسيط لطلب إذن الإشعارات
// ═══════════════════════════════════════════════════════════════════
export const NotificationButton: React.FC = () => {
  const { isSupported, isPermissionGranted, isLoading, requestPermission } =
    useNotifications();

  if (!isSupported || isPermissionGranted) {
    return null;
  }

  return (
    <button
      onClick={requestPermission}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg
        className="w-5 h-5"
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
      {isLoading ? "جاري التفعيل..." : "تفعيل الإشعارات"}
    </button>
  );
};

