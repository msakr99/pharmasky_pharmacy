'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../notifications/notifications-hook';
import { Bell, BellOff, Volume2, VolumeX, Settings } from 'lucide-react';

interface NotificationSettingsProps {
  authToken: string | null;
}

export default function NotificationSettings({ authToken }: NotificationSettingsProps) {
  const { status, initializeNotifications, startPolling, stopPolling, sendNotification } = useNotifications(authToken);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(30);

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const savedSound = localStorage.getItem('notificationSound') !== 'false';
    const savedInterval = parseInt(localStorage.getItem('notificationInterval') || '30');
    
    setSoundEnabled(savedSound);
    setPollingInterval(savedInterval);
  }, []);

  // حفظ الإعدادات
  const saveSettings = (sound: boolean, interval: number) => {
    localStorage.setItem('notificationSound', sound.toString());
    localStorage.setItem('notificationInterval', interval.toString());
  };

  // تفعيل الإشعارات
  const handleEnableNotifications = async () => {
    try {
      await initializeNotifications();
      if (authToken) {
        await startPolling();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  // إيقاف الإشعارات
  const handleDisableNotifications = () => {
    stopPolling();
  };

  // اختبار الإشعار
  const handleTestNotification = () => {
    sendNotification(
      'اختبار الإشعارات',
      'هذا إشعار تجريبي للتأكد من عمل النظام',
      'info'
    );
  };

  // تغيير الصوت
  const handleSoundToggle = () => {
    const newSound = !soundEnabled;
    setSoundEnabled(newSound);
    saveSettings(newSound, pollingInterval);
  };

  // تغيير فترة المراقبة
  const handleIntervalChange = (newInterval: number) => {
    setPollingInterval(newInterval);
    saveSettings(soundEnabled, newInterval);
    
    if (status.polling) {
      stopPolling();
      // إعادة تشغيل مع الفترة الجديدة
      setTimeout(() => {
        if (authToken) {
          startPolling();
        }
      }, 1000);
    }
  };

  return (
    <div className="notification-settings bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">إعدادات الإشعارات</h2>
      </div>

      {/* حالة الإشعارات */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {status.permission === 'granted' ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="font-medium text-gray-800">
                {status.permission === 'granted' ? 'الإشعارات مفعلة' : 'الإشعارات معطلة'}
              </p>
              <p className="text-sm text-gray-600">
                {status.supported ? 'مدعوم في هذا المتصفح' : 'غير مدعوم في هذا المتصفح'}
              </p>
            </div>
          </div>
          
          {status.permission === 'granted' ? (
            <button
              onClick={handleDisableNotifications}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              إيقاف
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              تفعيل
            </button>
          )}
        </div>
      </div>

      {/* إعدادات الصوت */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-green-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-800">صوت الإشعارات</p>
              <p className="text-sm text-gray-600">
                {soundEnabled ? 'مفعل' : 'معطل'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSoundToggle}
            className={`px-4 py-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
          >
            {soundEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}
          </button>
        </div>
      </div>

      {/* فترة المراقبة */}
      <div className="mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-800">فترة المراقبة</p>
              <p className="text-sm text-gray-600">
                فحص الإشعارات الجديدة كل {pollingInterval} ثانية
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {[15, 30, 60, 120].map((interval) => (
              <button
                key={interval}
                onClick={() => handleIntervalChange(interval)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  pollingInterval === interval
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {interval}ث
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* اختبار الإشعار */}
      {status.permission === 'granted' && (
        <div className="mb-6">
          <button
            onClick={handleTestNotification}
            className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            🧪 اختبار الإشعار
          </button>
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <p className="font-medium mb-2">💡 نصائح:</p>
        <ul className="space-y-1">
          <li>• الإشعارات تعمل حتى لو لم تكن فاتح الموقع</li>
          <li>• يمكنك إيقاف الإشعارات من إعدادات المتصفح</li>
          <li>• الصوت يعمل فقط عند فتح الموقع</li>
        </ul>
      </div>
    </div>
  );
}
