# 📱 نظام الإشعارات لـ Next.js

هذا المجلد يحتوي على جميع المكونات والملفات المطلوبة لربط نظام الإشعارات بـ Next.js.

## 🚀 البدء السريع

### 1️⃣ تثبيت المتطلبات

```bash
npm install firebase sonner date-fns lucide-react
```

### 2️⃣ نسخ الملفات

انسخ جميع الملفات من هذا المجلد إلى مشروع Next.js:

```
✅ lib/firebase.ts                    → your-project/lib/
✅ hooks/useNotifications.ts          → your-project/hooks/
✅ components/NotificationProvider.tsx → your-project/components/
✅ components/NotificationsList.tsx    → your-project/components/
✅ components/NotificationBadge.tsx    → your-project/components/
✅ public/firebase-messaging-sw.js    → your-project/public/
```

### 3️⃣ إعداد متغيرات البيئة

انسخ `ENV_EXAMPLE.txt` إلى `.env.local` واستبدل القيم:

```bash
cp ENV_EXAMPLE.txt .env.local
```

### 4️⃣ إضافة في Layout

```typescript
// app/layout.tsx
import NotificationProvider from '@/components/NotificationProvider';
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  const authToken = 'your-auth-token'; // من session/cookies
  
  return (
    <html lang="ar" dir="rtl">
      <body>
        <NotificationProvider authToken={authToken} autoSetup={true}>
          {children}
        </NotificationProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
```

## 📁 شرح الملفات

### 🔧 lib/firebase.ts
- إعداد Firebase و FCM
- طلب إذن الإشعارات
- إرسال FCM Token للخادم
- الاستماع للإشعارات في Foreground

### 🎣 hooks/useNotifications.ts
- React Hook لإدارة الإشعارات
- التحقق من دعم المتصفح
- طلب الأذونات
- إعداد الإشعارات

### 🏗️ components/NotificationProvider.tsx
- Provider لإدارة الإشعارات على مستوى التطبيق
- إعداد تلقائي للإشعارات
- Context للوصول للوظائف

### 📋 components/NotificationsList.tsx
- عرض قائمة الإشعارات
- تحديد كمقروء/غير مقروء
- حذف الإشعارات
- تحديث دوري

### 🔔 components/NotificationBadge.tsx
- شارة عدد الإشعارات غير المقروءة
- تحديث تلقائي
- تفاعل مع النقر

### ⚙️ public/firebase-messaging-sw.js
- Service Worker للإشعارات في الخلفية
- تشغيل الصوت المخصص
- معالجة النقر على الإشعارات

## 🎯 الاستخدام

### إضافة شارة الإشعارات في Navigation

```tsx
import NotificationBadge from '@/components/NotificationBadge';

export default function NavBar() {
  const authToken = 'your-auth-token';
  
  return (
    <nav>
      <NotificationBadge 
        authToken={authToken}
        onClick={() => router.push('/notifications')}
      />
    </nav>
  );
}
```

### صفحة الإشعارات

```tsx
import NotificationsList from '@/components/NotificationsList';

export default function NotificationsPage() {
  const authToken = 'your-auth-token';
  
  return (
    <div>
      <h1>الإشعارات</h1>
      <NotificationsList 
        authToken={authToken}
        onNotificationClick={(notification) => {
          console.log('Clicked:', notification);
        }}
      />
    </div>
  );
}
```

### إعداد تلقائي للإشعارات

```tsx
import { NotificationProvider } from '@/components/NotificationProvider';

export default function App() {
  const authToken = 'your-auth-token';
  
  return (
    <NotificationProvider authToken={authToken} autoSetup={true}>
      {/* باقي التطبيق */}
    </NotificationProvider>
  );
}
```

## 🔧 التخصيص

### تغيير صوت الإشعارات

1. ضع ملف الصوت في `public/sounds/notify.mp3`
2. تأكد من أن Service Worker يشير للمسار الصحيح

### تخصيص شكل الإشعارات

عدّل `notificationOptions` في `firebase-messaging-sw.js`:

```javascript
const notificationOptions = {
  body: 'رسالة مخصصة',
  icon: '/custom-icon.png',
  badge: '/custom-badge.png',
  // ... المزيد من الخيارات
};
```

### تخصيص التحديث الدوري

```tsx
<NotificationsList 
  authToken={authToken}
  refreshInterval={60} // كل دقيقة
/>
```

## 🐛 استكشاف الأخطاء

### لا تظهر الإشعارات

1. تحقق من متغيرات البيئة
2. تأكد من أن FCM Token يتم إرساله للخادم
3. تحقق من Console للأخطاء

### لا يعمل الصوت

1. تأكد من وجود ملف الصوت في `public/sounds/`
2. تحقق من أن المتصفح يدعم Audio API
3. جرب تشغيل الصوت يدوياً في Console

### لا يتم تحديث العدد

1. تحقق من أن API يعمل بشكل صحيح
2. تأكد من صحة authToken
3. تحقق من Console للأخطاء

## 📚 المراجع

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
