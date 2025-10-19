# 🚀 دليل الإعداد السريع لنظام الإشعارات في Next.js

## ⚡ البدء في 10 دقائق

### 1️⃣ تثبيت المتطلبات

```bash
cd your-nextjs-project
npm install firebase sonner date-fns lucide-react
```

### 2️⃣ نسخ الملفات الجاهزة

من مجلد `nextjs-components/` في هذا المشروع، انسخ إلى مشروع Next.js:

```
✅ lib/firebase.ts                    → your-project/lib/
✅ hooks/useNotifications.ts          → your-project/hooks/
✅ components/NotificationProvider.tsx → your-project/components/
✅ components/NotificationsList.tsx    → your-project/components/
✅ components/NotificationBadge.tsx    → your-project/components/
✅ public/firebase-messaging-sw.js    → your-project/public/
```

### 3️⃣ إعداد متغيرات البيئة

أنشئ ملف `.env.local` في مشروع Next.js:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD6EDxwyeNIQn_GZY5uE6TN2fj-DCl1zEc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pharmasky46.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pharmasky46
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pharmasky46.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=161754387145
NEXT_PUBLIC_FIREBASE_APP_ID=1:161754387145:web:cdb298fc73219258927318

# VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BB7lStxGteKJhc5gmVTl6IZWlbWdmgibq9230JHlGCpBfcbX-cRf64DOH8xuttVJ7Tp7fAIFBE45OzLGBtwfARs

# API URL
NEXT_PUBLIC_API_URL=http://167.71.40.9/api/v1
```

### 4️⃣ تحديث Layout

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

### 5️⃣ إضافة شارة الإشعارات

```typescript
// app/components/NavBar.tsx
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

### 6️⃣ صفحة الإشعارات

```typescript
// app/notifications/page.tsx
import NotificationsList from '@/components/NotificationsList';

export default function NotificationsPage() {
  const authToken = 'your-auth-token';
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">الإشعارات</h1>
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

## ✅ التحقق من نجاح الإعداد

### في Console المتصفح يجب أن ترى:

```
✅ Firebase Admin initialized successfully
✅ تم منح إذن الإشعارات
🔑 FCM Token: eLxBu5Z8QoWx...
✅ تم حفظ FCM Token في السيرفر
```

### اختبر من السيرفر:

```bash
# أنشئ إشعار
docker exec -i pharmasky_web python manage.py shell << 'EOF'
from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.filter(username='+201090572414').first()

Notification.objects.create(
    user=user,
    title='🎉 مرحباً!',
    message='هذا أول إشعار من Next.js!',
    extra={'type': 'test'}
)
print('✅ تم! تحقق من Next.js')
EOF
```

**يجب أن يظهر الإشعار في Next.js فوراً! 🎊**

## 🔧 الحصول على Firebase Keys

### سريع جداً (3 دقائق):

1. **اذهب:** https://console.firebase.google.com/
2. **افتح المشروع:** pharmasky46
3. **اذهب:** Project Settings ⚙️
4. **انسخ Config** من Your apps → Web
5. **احصل على VAPID:** Cloud Messaging → Web Push certificates

## 🎯 المسار السريع:

```
1. npm install firebase sonner date-fns lucide-react
2. انسخ الملفات من nextjs-components/
3. أضف NotificationProvider في Layout
4. احصل على Firebase keys
5. أنشئ .env.local
6. npm run dev
7. اختبر!
```

## 🐛 استكشاف الأخطاء الشائعة

### لا تظهر الإشعارات:
- تحقق من متغيرات البيئة
- تأكد من أن FCM Token يتم إرساله للخادم
- تحقق من Console للأخطاء

### لا يعمل الصوت:
- تأكد من وجود ملف الصوت في `public/sounds/`
- تحقق من أن المتصفح يدعم Audio API

### لا يتم تحديث العدد:
- تحقق من أن API يعمل بشكل صحيح
- تأكد من صحة authToken

**كل شيء موثق وجاهز! 🚀**
