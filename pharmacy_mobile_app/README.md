# تطبيق الصيدلية للموبايل - PharmaSky Mobile App

تطبيق Flutter للموبايل يستخدم نفس APIs والتصميم الخاص بموقع الصيدلية.

## المميزات

### 🔐 نظام المصادقة
- تسجيل الدخول الآمن
- إدارة الجلسات
- حفظ بيانات المستخدم

### 📱 الشاشات الرئيسية
- **لوحة التحكم**: نظرة عامة على الحساب والإحصائيات
- **العروض**: عرض العروض والخصومات مع إمكانية البحث
- **الفواتير**: إدارة فواتير المبيعات مع الإحصائيات
- **النواقص**: قائمة الأصناف الناقصة
- **الإشعارات**: نظام إشعارات متقدم مع إمكانية التحديد والمسح
- **الملف الشخصي**: معلومات المستخدم والحساب

### 🎨 التصميم
- تصميم متجاوب يدعم جميع أحجام الشاشات
- دعم الوضع المظلم والفاتح
- ألوان متناسقة مع الموقع الأصلي
- أيقونات وواجهات مستخدم بديهية

### 🔔 الإشعارات
- إشعارات محلية
- إشعارات Firebase
- إشعارات صوتية
- إدارة الإشعارات

### 🔍 البحث والفلترة
- بحث متقدم في جميع الصفحات
- اقتراحات البحث
- إحصائيات النتائج

## التقنيات المستخدمة

### Frontend
- **Flutter**: إطار عمل متعدد المنصات
- **Dart**: لغة البرمجة

### State Management
- **Provider**: إدارة الحالة
- **ChangeNotifier**: تحديث الواجهة

### HTTP & API
- **Dio**: HTTP client متقدم
- **HTTP**: طلبات الشبكة

### Local Storage
- **SharedPreferences**: تخزين البيانات المحلية

### Navigation
- **GoRouter**: نظام التنقل المتقدم

### Notifications
- **Flutter Local Notifications**: الإشعارات المحلية
- **Firebase Messaging**: إشعارات السحابة

### UI Components
- **Material Design 3**: تصميم Material الحديث
- **Custom Widgets**: مكونات مخصصة

## هيكل المشروع

```
lib/
├── main.dart                 # نقطة البداية
├── models/                   # نماذج البيانات
│   ├── user_model.dart
│   ├── offer_model.dart
│   ├── invoice_model.dart
│   ├── notification_model.dart
│   └── shortage_model.dart
├── services/                 # خدمات API
│   ├── api_service.dart
│   └── notification_service.dart
├── providers/               # إدارة الحالة
│   ├── auth_provider.dart
│   ├── offers_provider.dart
│   ├── invoices_provider.dart
│   ├── notifications_provider.dart
│   └── shortages_provider.dart
├── screens/                 # الشاشات
│   ├── splash_screen.dart
│   ├── auth/
│   │   └── login_screen.dart
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── offers/
│   │   └── offers_screen.dart
│   ├── invoices/
│   │   └── invoices_screen.dart
│   ├── shortages/
│   │   └── shortages_screen.dart
│   ├── notifications/
│   │   └── notifications_screen.dart
│   └── profile/
│       └── profile_screen.dart
├── widgets/                 # المكونات المخصصة
│   ├── custom_text_field.dart
│   ├── loading_button.dart
│   ├── dashboard_card.dart
│   ├── notification_badge.dart
│   ├── search_bar.dart
│   ├── offer_card.dart
│   ├── invoice_card.dart
│   ├── shortage_card.dart
│   └── notification_card.dart
└── utils/                   # الأدوات المساعدة
    ├── app_theme.dart
    └── app_router.dart
```

## التثبيت والتشغيل

### المتطلبات
- Flutter SDK 3.0.0 أو أحدث
- Dart 3.0.0 أو أحدث
- Android Studio / VS Code
- Android SDK / Xcode (للتطوير)

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd pharmacy_mobile_app
```

2. **تثبيت التبعيات**
```bash
flutter pub get
```

3. **تكوين Firebase (اختياري)**
- أضف ملف `google-services.json` لمجلد `android/app/`
- أضف ملف `GoogleService-Info.plist` لمجلد `ios/Runner/`

4. **تشغيل التطبيق**
```bash
# للتطوير
flutter run

# للبناء
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## التكوين

### API Configuration
قم بتحديث `baseUrl` في `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://your-api-url.com';
```

### Theme Configuration
يمكن تخصيص الألوان في `lib/utils/app_theme.dart`:

```dart
static const Color primaryColor = Color(0xFF1E2A3A);
static const Color accentColor = Color(0xFFFF6B35);
```

## المميزات المتقدمة

### 🔄 تحديث البيانات
- تحديث تلقائي للبيانات
- Pull-to-refresh في جميع الصفحات
- تحميل تدريجي للبيانات

### 📊 الإحصائيات
- إحصائيات المبيعات
- عدد الفواتير
- متوسط قيمة الفاتورة
- إحصائيات الإشعارات

### 🔍 البحث المتقدم
- بحث في الوقت الفعلي
- اقتراحات البحث
- فلترة النتائج
- إحصائيات البحث

### 🎨 تجربة المستخدم
- تحميل سلس
- رسائل خطأ واضحة
- تفاعلات سلسة
- تصميم متجاوب

## الدعم والمساعدة

### المشاكل الشائعة

1. **خطأ في الاتصال بالـ API**
   - تأكد من صحة الـ baseUrl
   - تحقق من اتصال الإنترنت
   - تأكد من صحة التوكن

2. **مشاكل في الإشعارات**
   - تأكد من إعدادات الصلاحيات
   - تحقق من تكوين Firebase
   - تأكد من تسجيل FCM token

3. **مشاكل في التصميم**
   - تأكد من تثبيت الخطوط
   - تحقق من إعدادات Theme
   - تأكد من دعم RTL

### التواصل
- البريد الإلكتروني: support@pharmasky.com
- الهاتف: +966-XX-XXX-XXXX

## الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف LICENSE للتفاصيل.

## المساهمة

نرحب بالمساهمات! يرجى قراءة دليل المساهمة قبل إرسال Pull Request.

---

**تم التطوير بواسطة فريق فارماسكاي** 🚀
