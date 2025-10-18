# 🔊 الإشعارات الصوتية - Pharmacy App

نظام إشعارات صوتية متقدم يعمل حتى لو لم تكن فاتح الموقع.

## 🚀 المميزات

### ✅ الإشعارات الصوتية
- **أصوات مختلفة** حسب نوع الإشعار
- **تعمل في الخلفية** حتى لو لم تكن فاتح الموقع
- **إشعارات مرئية** مع أيقونات مخصصة
- **تفاعل مع الإشعارات** (عرض/إغلاق)

### ✅ المراقبة التلقائية
- **فحص دوري** للإشعارات الجديدة كل 30 ثانية
- **مراقبة في الخلفية** باستخدام Service Worker
- **إشعارات فورية** عند وصول إشعار جديد

### ✅ أنواع الإشعارات
| النوع | الصوت | الوصف |
|-------|-------|-------|
| 🛒 طلب جديد | `sale_invoice` | عند إنشاء طلب |
| ⏰ تذكير دفع | `payment_due_reminder` | قبل موعد الدفع |
| ✨ منتج متوفر | `wishlist_product_available` | توفر منتج مطلوب |
| 🟢 بدء الوردية | `shift_started` | بدء الوردية |
| 🔴 إغلاق الوردية | `shift_closed` | إغلاق الوردية |

## 🛠️ التثبيت والاستخدام

### 1. تفعيل الإشعارات
```typescript
import { notificationsManager } from './app/notifications/notifications-manager';

// تفعيل الإشعارات
await notificationsManager.requestPermission();
await notificationsManager.registerServiceWorker();
```

### 2. بدء المراقبة
```typescript
// بدء مراقبة الإشعارات
const interval = await notificationsManager.startNotificationPolling(authToken, 30000);
```

### 3. إرسال إشعار فوري
```typescript
// إرسال إشعار
notificationsManager.sendImmediateNotification(
  '🛒 طلب جديد',
  'تم إنشاء طلبك رقم #123 بنجاح',
  'sale_invoice'
);
```

## 📱 الاستخدام في React

### Hook للإشعارات
```typescript
import { useNotifications } from './app/notifications/notifications-hook';

function MyComponent() {
  const { status, sendNotification } = useNotifications(authToken);
  
  return (
    <div>
      <button onClick={() => sendNotification('عنوان', 'رسالة', 'نوع')}>
        إرسال إشعار
      </button>
    </div>
  );
}
```

### مكون الإعدادات
```typescript
import NotificationSettings from './app/components/notification-settings';

function SettingsPage() {
  return <NotificationSettings authToken={authToken} />;
}
```

## ⚙️ الإعدادات

### إعدادات الصوت
```typescript
// تفعيل/إيقاف الصوت
soundManager.setSoundEnabled(true);

// تشغيل صوت مخصص
soundManager.playNotificationSound('sale_invoice');
```

### إعدادات المراقبة
```typescript
// تغيير فترة المراقبة
const interval = await notificationsManager.startNotificationPolling(authToken, 60000); // 60 ثانية
```

## 🔧 التخصيص

### إضافة نوع إشعار جديد
```typescript
// في notifications-manager.ts
const icons = {
  'new_type': '🔔',
  // ... أنواع أخرى
};

const sounds = {
  'new_type': [800, 600, 800],
  // ... أصوات أخرى
};
```

### تخصيص الأصوات
```typescript
// في notification-sound.js
const sounds = {
  'custom_type': [1000, 800, 1000, 800], // نغمة مخصصة
};
```

## 📋 متطلبات النظام

### المتصفحات المدعومة
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 16+
- ✅ Edge 79+

### المتطلبات
- **HTTPS** (مطلوب للإشعارات)
- **Service Worker** مدعوم
- **Notifications API** مدعوم

## 🚨 استكشاف الأخطاء

### الإشعارات لا تعمل
1. تحقق من إذن الإشعارات في المتصفح
2. تأكد من استخدام HTTPS
3. تحقق من تسجيل Service Worker

### الصوت لا يعمل
1. تحقق من إعدادات الصوت في التطبيق
2. تأكد من تفعيل الصوت في المتصفح
3. تحقق من AudioContext

### المراقبة لا تعمل
1. تحقق من صحة التوكن
2. تأكد من اتصال الإنترنت
3. تحقق من Service Worker

## 📊 مراقبة الأداء

### إحصائيات الإشعارات
```typescript
// فحص حالة الإشعارات
const status = notificationsManager.getNotificationStatus();
console.log(status);
```

### مراقبة الأخطاء
```typescript
// في Service Worker
self.addEventListener('error', (event) => {
  console.error('SW Error:', event.error);
});
```

## 🔒 الأمان

### حماية البيانات
- التوكن محفوظ في localStorage
- الإشعارات مشفرة
- لا يتم حفظ البيانات الحساسة

### الخصوصية
- الإشعارات محلية فقط
- لا يتم تتبع المستخدم
- يمكن إيقاف الإشعارات في أي وقت

## 📱 دعم الهواتف

### iOS Safari
- يتطلب إضافة للشاشة الرئيسية
- الإشعارات تعمل بعد الإضافة

### Android Chrome
- يعمل بشكل كامل
- دعم كامل للإشعارات

## 🎯 أفضل الممارسات

### الأداء
- استخدم فترات مراقبة مناسبة (30-60 ثانية)
- أوقف المراقبة عند عدم الحاجة
- نظف الذاكرة بانتظام

### تجربة المستخدم
- اطلب إذن الإشعارات في الوقت المناسب
- وضح فوائد الإشعارات للمستخدم
- وفر خيارات تخصيص شاملة

## 📞 الدعم

للحصول على المساعدة:
- راجع ملفات السجل في Console
- تحقق من إعدادات المتصفح
- تأكد من تحديث المتصفح

---

**تم تطوير هذا النظام خصيصاً لتطبيق الصيدلية مع التركيز على تجربة المستخدم والأداء الأمثل.** 🚀
