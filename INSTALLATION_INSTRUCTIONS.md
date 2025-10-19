# 📋 تعليمات التثبيت والإعداد

## 🚀 الخطوات المطلوبة

### 1️⃣ تثبيت المتطلبات

```bash
npm install firebase sonner date-fns lucide-react
```

### 2️⃣ إنشاء ملف .env.local

أنشئ ملف `.env.local` في جذر المشروع وأضف المحتوى التالي:

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

### 3️⃣ تحديث Layout

تم تحديث `app/layout.tsx` بالفعل ليدعم الإشعارات. تحتاج فقط إلى:

1. استبدال `'your-auth-token'` برمز المصادقة الفعلي
2. التأكد من أن `NotificationProvider` يتم استيراده بشكل صحيح

### 4️⃣ تحديث NavBar

إذا كنت تستخدم `NotificationBadge` في NavBar، تأكد من إضافة `onClick` handler:

```tsx
import NotificationBadge from './components/NotificationBadge';

// في NavBar component
<NotificationBadge 
  onClick={() => router.push('/notifications')}
/>
```

### 5️⃣ إضافة صفحة الإشعارات

أنشئ صفحة جديدة في `app/notifications/page.tsx`:

```tsx
import NotificationsList from '../components/NotificationsList';

export default function NotificationsPage() {
  const authToken = 'your-auth-token'; // استبدل بقيمة فعلية
  
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

## ✅ التحقق من الإعداد

### في Console المتصفح يجب أن ترى:

```
✅ Firebase Admin initialized successfully
✅ تم منح إذن الإشعارات
🔑 FCM Token: eLxBu5Z8QoWx...
✅ تم حفظ FCM Token في السيرفر
✅ Firebase SW registered
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

## 🔧 الملفات المحدثة

- ✅ `app/layout.tsx` - تم تحديثه ليدعم الإشعارات
- ✅ `app/components/NotificationBadge.tsx` - تم تحسينه
- ✅ `nextjs-components/` - مجلد كامل بالمكونات الجاهزة

## 📚 المراجع

- `nextjs-components/README.md` - دليل شامل لجميع المكونات
- `NEXTJS_SETUP_QUICK_START.md` - دليل الإعداد السريع
- `nextjs-components/ENV_EXAMPLE.txt` - مثال على متغيرات البيئة

## 🎯 الخطوات التالية

1. أعد تشغيل الخادم: `npm run dev`
2. افتح المتصفح وتحقق من Console
3. اختبر الإشعارات من السيرفر
4. تأكد من عمل الصوت في `public/sounds/notify.mp3`

**كل شيء جاهز! 🚀**
