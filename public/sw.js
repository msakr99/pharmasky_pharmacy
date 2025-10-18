// Service Worker for Push Notifications
const CACHE_NAME = 'pharmacy-notifications-v1';
const API_BASE = 'http://167.71.40.9';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - استقبال الإشعارات
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Notification data:', data);
    
    const options = {
      body: data.message,
      icon: '/icon.png',
      badge: '/badge.png',
      tag: `notification-${data.id}`,
      requireInteraction: true, // يبقى الإشعار حتى يضغط عليه المستخدم
      actions: [
        {
          action: 'view',
          title: 'عرض',
          icon: '/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'إغلاق',
          icon: '/close-icon.png'
        }
      ],
      data: {
        url: data.url || '/notifications',
        notificationId: data.id,
        type: data.extra?.type
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // فتح التطبيق أو الانتقال للصفحة
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/notifications')
    );
  } else if (event.action === 'dismiss') {
    // إغلاق الإشعار
    console.log('Notification dismissed');
  } else {
    // النقر العادي على الإشعار
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/notifications')
    );
  }
});

// Background sync - مزامنة البيانات في الخلفية
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// دالة مزامنة الإشعارات
async function syncNotifications() {
  try {
    // جلب الإشعارات الجديدة
    const response = await fetch(`${API_BASE}/notifications/notifications/unread/`, {
      headers: {
        'Authorization': `Token ${await getAuthToken()}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Synced notifications:', data.results.length);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// دالة الحصول على التوكن
async function getAuthToken() {
  // يمكن حفظ التوكن في IndexedDB
  return localStorage.getItem('authToken') || '';
}

// دالة إرسال إشعار محلي
function showLocalNotification(title, options) {
  self.registration.showNotification(title, {
    body: options.body,
    icon: '/icon.png',
    badge: '/badge.png',
    tag: `local-${Date.now()}`,
    requireInteraction: true,
    ...options
  });
}
