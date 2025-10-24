# دليل البدء السريع - تطبيق الصيدلية للموبايل

## 🚀 البدء السريع

### الخطوة 1: تثبيت Flutter
```bash
# تحميل Flutter من:
https://docs.flutter.dev/get-started/install/windows

# أو تشغيل السكريبت التلقائي:
install_flutter.bat
```

### الخطوة 2: تشغيل المشروع
```bash
# الانتقال إلى مجلد المشروع
cd pharmacy_mobile_app

# تثبيت التبعيات
flutter pub get

# تشغيل التطبيق
flutter run
```

## 📱 المميزات الرئيسية

### ✅ تم إنجازه
- ✅ نظام تسجيل الدخول
- ✅ لوحة التحكم الرئيسية
- ✅ صفحة العروض مع البحث
- ✅ صفحة الفواتير مع الإحصائيات
- ✅ صفحة النواقص
- ✅ نظام الإشعارات المتقدم
- ✅ الملف الشخصي
- ✅ تصميم متجاوب وجميل
- ✅ دعم اللغة العربية
- ✅ تكامل كامل مع APIs

## 🎨 التصميم

- **الألوان**: متناسقة مع الموقع الأصلي
- **الخطوط**: دعم كامل للعربية
- **التخطيط**: Material Design 3
- **الوضع**: فاتح ومظلم

## 🔧 التقنيات المستخدمة

- **Flutter**: إطار العمل الرئيسي
- **Provider**: إدارة الحالة
- **Dio**: HTTP requests
- **GoRouter**: التنقل
- **SharedPreferences**: التخزين المحلي

## 📁 هيكل المشروع

```
lib/
├── main.dart                 # نقطة البداية
├── models/                   # نماذج البيانات
├── services/                 # خدمات API
├── providers/               # إدارة الحالة
├── screens/                 # الشاشات
├── widgets/                 # المكونات
└── utils/                   # الأدوات
```

## 🚀 الأوامر المفيدة

```bash
# تثبيت التبعيات
flutter pub get

# تشغيل التطبيق
flutter run

# بناء APK
flutter build apk

# تنظيف المشروع
flutter clean

# فحص المشروع
flutter analyze
```

## 🔧 التكوين

### تحديث API URL
في `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://your-api-url.com';
```

### تخصيص الألوان
في `lib/utils/app_theme.dart`:
```dart
static const Color primaryColor = Color(0xFF1E2A3A);
static const Color accentColor = Color(0xFFFF6B35);
```

## 📱 الشاشات المتاحة

1. **شاشة البداية** - رسوم متحركة جميلة
2. **تسجيل الدخول** - واجهة مستخدم أنيقة
3. **لوحة التحكم** - نظرة عامة شاملة
4. **العروض** - عرض العروض مع البحث
5. **الفواتير** - إدارة الفواتير
6. **النواقص** - قائمة الأصناف الناقصة
7. **الإشعارات** - نظام إشعارات متقدم
8. **الملف الشخصي** - معلومات المستخدم

## 🎯 المميزات المتقدمة

- **البحث المتقدم**: في جميع الصفحات
- **الإحصائيات**: مبيعات وفواتير
- **الإشعارات**: محلية و Firebase
- **التحديث التلقائي**: Pull-to-refresh
- **التصميم المتجاوب**: جميع أحجام الشاشات

## 🆘 حل المشاكل

### مشكلة: "flutter is not recognized"
```bash
# تأكد من إضافة Flutter إلى PATH
# أعد تشغيل PowerShell
```

### مشكلة: "flutter pub get" فشل
```bash
# تحقق من اتصال الإنترنت
# شغل: flutter clean
# ثم: flutter pub get
```

### مشكلة: التطبيق لا يعمل
```bash
# شغل: flutter doctor
# ثبت المتطلبات المفقودة
```

## 📞 الدعم

- **الوثائق**: https://docs.flutter.dev
- **المجتمع**: https://flutter.dev/community
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/flutter

---

**تم التطوير بواسطة فريق فارماسكاي** 🚀

**التطبيق جاهز للاستخدام مع جميع الوظائف المطلوبة!** ✅
