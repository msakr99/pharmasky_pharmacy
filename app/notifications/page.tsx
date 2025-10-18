'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from './notifications-hook';
import NotificationSettings from '../components/notification-settings';
import { Bell, Settings, Volume2 } from 'lucide-react';

export default function NotificationsPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { status, sendNotification } = useNotifications(authToken);

  // تحميل التوكن من localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      setAuthToken(token);
    }
  }, []);

  // إرسال إشعار تجريبي
  const handleTestNotification = () => {
    sendNotification(
      '🛒 طلب جديد',
      'تم إنشاء طلبك رقم #123 بنجاح. إجمالي المبلغ: 5000 جنيه',
      'sale_invoice'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">الإشعارات الصوتية</h1>
              <p className="text-gray-600">إعدادات الإشعارات الصوتية والمراقبة التلقائية</p>
            </div>
          </div>

          {/* حالة الإشعارات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">الحالة</span>
              </div>
              <p className="text-sm text-blue-600">
                {status.permission === 'granted' ? '✅ مفعلة' : '❌ معطلة'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">المراقبة</span>
              </div>
              <p className="text-sm text-green-600">
                {status.polling ? '✅ نشطة' : '❌ متوقفة'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">الصوت</span>
              </div>
              <p className="text-sm text-purple-600">
                {typeof window !== 'undefined' && localStorage.getItem('notificationSound') !== 'false' ? '✅ مفعل' : '❌ معطل'}
              </p>
            </div>
          </div>
        </div>

        {/* إعدادات الإشعارات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NotificationSettings authToken={authToken} />
          
          {/* اختبار الإشعارات */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">اختبار الإشعارات</h3>
            
            <div className="space-y-4">
              <button
                onClick={handleTestNotification}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🧪 اختبار إشعار طلب جديد
              </button>
              
              <button
                onClick={() => sendNotification('⏰ تذكير دفع', 'موعد دفع فاتورتك غداً', 'payment_due_reminder')}
                className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                ⏰ اختبار تذكير دفع
              </button>
              
              <button
                onClick={() => sendNotification('✨ منتج متوفر', 'المنتج المطلوب متوفر الآن', 'wishlist_product_available')}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                ✨ اختبار منتج متوفر
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">📋 أنواع الإشعارات:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🛒 طلبات جديدة</li>
                <li>⏰ تذكيرات الدفع</li>
                <li>✨ منتجات متوفرة</li>
                <li>🟢 بدء الوردية</li>
                <li>🔴 إغلاق الوردية</li>
              </ul>
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">ℹ️ معلومات مهمة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🔊 الإشعارات الصوتية:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• تعمل حتى لو لم تكن فاتح الموقع</li>
                <li>• تحتاج إذن من المتصفح</li>
                <li>• يمكن إيقافها من إعدادات المتصفح</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">⚙️ المراقبة التلقائية:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• تفحص الإشعارات الجديدة كل 30 ثانية</li>
                <li>• تعمل في الخلفية</li>
                <li>• يمكن تغيير الفترة من الإعدادات</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}