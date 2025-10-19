// nextjs-components/public/firebase-messaging-sw.js
// ═══════════════════════════════════════════════════════════════════
// Service Worker لاستقبال الإشعارات في الخلفية (Background)
// ═══════════════════════════════════════════════════════════════════
// هذا الملف يعمل في الخلفية ويستقبل الإشعارات حتى لو كان المتصفح مغلقًا
// 
// 🎵 تحديث الصوت المخصص:
// - تم إضافة تشغيل صوت notify.mp3 عند وصول الإشعارات
// - الصوت يتم تشغيله يدوياً باستخدام Audio API لضمان عمله في جميع المتصفحات
// - الصوت يعمل حتى لو كان الموقع في الخلفية أو مقفول

// استيراد Firebase scripts للـ Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// ═══════════════════════════════════════════════════════════════════
// تكوين Firebase - نفس القيم المستخدمة في firebase.ts
// ═══════════════════════════════════════════════════════════════════
// ⚠️ مهم: يجب أن تكون هذه القيم مطابقة لما في firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyD6EDxwyeNIQn_GZY5uE6TN2fj-DCl1zEc",
  authDomain: "pharmasky46.firebaseapp.com",
  projectId: "pharmasky46",
  storageBucket: "pharmasky46.firebasestorage.app",
  messagingSenderId: "161754387145",
  appId: "1:161754387145:web:cdb298fc73219258927318"
};

// تهيئة Firebase في Service Worker
firebase.initializeApp(firebaseConfig);

// الحصول على messaging instance
const messaging = firebase.messaging();

// ═══════════════════════════════════════════════════════════════════
// معالجة الإشعارات في الخلفية (Background Messages)
// ═══════════════════════════════════════════════════════════════════
// يتم استدعاء هذه الدالة عندما يصل إشعار والتطبيق ليس مفتوحًا
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // استخراج البيانات من الإشعار
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: payload.notification?.icon || '/icon.png', // أيقونة التطبيق
    badge: '/icon.png', // شارة صغيرة
    image: payload.notification?.image || null, // صورة كبيرة (اختياري)
    data: payload.data || {}, // بيانات إضافية
    tag: payload.data?.tag || 'default-tag', // tag للتحكم في الإشعارات المكررة
    requireInteraction: false, // هل يبقى الإشعار حتى يتفاعل المستخدم
    silent: false, // صوت أو صامت
    vibrate: [200, 100, 200], // نمط الاهتزاز
    sound: '/sounds/notify.mp3', // الصوت المخصص للإشعار
    // actions: [ // أزرار في الإشعار (اختياري)
    //   {
    //     action: 'open',
    //     title: 'فتح',
    //     icon: '/icons/open.png'
    //   },
    //   {
    //     action: 'close',
    //     title: 'إغلاق',
    //     icon: '/icons/close.png'
    //   }
    // ]
  };

  // عرض الإشعار
  const notificationPromise = self.registration.showNotification(notificationTitle, notificationOptions);
  
  // ═══════════════════════════════════════════════════════════════════
  // تشغيل الصوت يدوياً لضمان عمله في جميع المتصفحات
  // ═══════════════════════════════════════════════════════════════════
  // ملاحظة: الصوت يتم تشغيله من الفرونت فقط لأن الباك لا يتحكم فيه
  // هذا يضمن تشغيل الصوت حتى لو كان الموقع في الخلفية أو مقفول
  try {
    // إنشاء Audio object وتشغيل الصوت
    const audio = new Audio('/sounds/notify.mp3');
    audio.volume = 0.8; // مستوى الصوت (0.0 - 1.0)
    audio.play().catch((error) => {
      console.log('[firebase-messaging-sw.js] Audio play failed:', error);
      // إذا فشل تشغيل الصوت، لا نوقف الإشعار
    });
  } catch (error) {
    console.log('[firebase-messaging-sw.js] Audio creation failed:', error);
    // إذا فشل إنشاء Audio object، لا نوقف الإشعار
  }

  return notificationPromise;
});

// ═══════════════════════════════════════════════════════════════════
// معالجة النقر على الإشعار
// ═══════════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  // إغلاق الإشعار
  event.notification.close();

  // التعامل مع أزرار الإشعار (actions)
  if (event.action === 'close') {
    // المستخدم ضغط على "إغلاق"
    return;
  }

  // فتح أو التركيز على نافذة التطبيق
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // الحصول على URL المطلوب من بيانات الإشعار
      const urlToOpen = event.notification.data?.url || '/notifications';

      // البحث عن نافذة مفتوحة بالفعل
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // إذا وجدنا نافذة مفتوحة، نركز عليها وننتقل للـ URL المطلوب
        if (client.url === '/' && 'focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }

      // إذا لم نجد نافذة مفتوحة، نفتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ═══════════════════════════════════════════════════════════════════
// معالجة إغلاق الإشعار
// ═══════════════════════════════════════════════════════════════════
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  // يمكن إضافة تتبع analytics هنا
});

// ═══════════════════════════════════════════════════════════════════
// رسالة ترحيب عند تثبيت Service Worker
// ═══════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting(); // تفعيل Service Worker فورًا
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim()); // التحكم في جميع الصفحات فورًا
});

// ═══════════════════════════════════════════════════════════════════
// ملاحظات مهمة:
// ═══════════════════════════════════════════════════════════════════
// 1. هذا الملف يجب أن يكون في جذر المجلد public
// 2. لا تضع console.log كثيرًا في production لتحسين الأداء
// 3. يمكن تخصيص شكل الإشعار حسب احتياجاتك
// 4. البيانات (payload.data) يمكن أن تحتوي على معلومات إضافية مثل:
//    - notification_id: معرف الإشعار
//    - type: نوع الإشعار (order, offer, etc.)
//    - url: رابط للانتقال إليه عند النقر
