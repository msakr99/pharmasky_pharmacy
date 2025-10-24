# دليل تثبيت Flutter على Windows

## الخطوة 1: تحميل Flutter SDK

### 1.1 تحميل Flutter
1. اذهب إلى: https://docs.flutter.dev/get-started/install/windows
2. انقر على "Download Flutter SDK"
3. اختر الإصدار المستقر (Stable) - حوالي 1.2 GB

### 1.2 استخراج الملفات
1. استخرج الملف المضغوط إلى مجلد مثل `C:\flutter`
2. تأكد من أن المسار النهائي هو `C:\flutter\bin`

## الخطوة 2: إعداد متغيرات البيئة

### 2.1 إضافة Flutter إلى PATH
1. افتح "System Properties" (خصائص النظام)
2. انقر على "Environment Variables" (متغيرات البيئة)
3. في "System Variables"، ابحث عن "Path" وانقر "Edit"
4. انقر "New" وأضف: `C:\flutter\bin`
5. انقر "OK" لحفظ التغييرات

### 2.2 إعادة تشغيل PowerShell
- أغلق PowerShell الحالي
- افتح PowerShell جديد كـ Administrator

## الخطوة 3: التحقق من التثبيت

### 3.1 تشغيل Flutter Doctor
```powershell
flutter doctor
```

### 3.2 تثبيت المتطلبات المفقودة
إذا ظهرت تحذيرات، قم بتثبيت:
- **Android Studio**: https://developer.android.com/studio
- **Visual Studio**: للـ Windows development
- **Git**: إذا لم يكن مثبت

## الخطوة 4: إعداد Android Studio

### 4.1 تثبيت Android Studio
1. حمل من: https://developer.android.com/studio
2. قم بالتثبيت مع جميع المكونات الافتراضية

### 4.2 إعداد Android SDK
1. افتح Android Studio
2. اذهب إلى "More Actions" > "SDK Manager"
3. في تبويب "SDK Platforms":
   - تأكد من تثبيت "Android 14.0 (API 34)"
   - تأكد من تثبيت "Android 13.0 (API 33)"
4. في تبويب "SDK Tools":
   - تأكد من تثبيت "Android SDK Build-Tools"
   - تأكد من تثبيت "Android SDK Platform-Tools"
   - تأكد من تثبيت "Android SDK Tools"

### 4.3 إعداد Android Emulator
1. في Android Studio، اذهب إلى "More Actions" > "AVD Manager"
2. انقر "Create Virtual Device"
3. اختر "Phone" > "Pixel 7" (أو أي هاتف آخر)
4. اختر "API 34" (Android 14)
5. انقر "Finish"

## الخطوة 5: التحقق النهائي

### 5.1 تشغيل Flutter Doctor مرة أخرى
```powershell
flutter doctor
```

يجب أن تظهر جميع العناصر بـ ✓ (علامة صح)

### 5.2 اختبار Flutter
```powershell
flutter --version
```

## الخطوة 6: تشغيل المشروع

### 6.1 الانتقال إلى مجلد المشروع
```powershell
cd E:\sky0\pharmacy-app\pharmacy_mobile_app
```

### 6.2 تثبيت التبعيات
```powershell
flutter pub get
```

### 6.3 تشغيل التطبيق
```powershell
# للتطوير
flutter run

# أو للبناء
flutter build apk
```

## حل المشاكل الشائعة

### مشكلة: "flutter is not recognized"
**الحل:**
1. تأكد من إضافة `C:\flutter\bin` إلى PATH
2. أعد تشغيل PowerShell
3. تحقق من المسار: `echo $env:PATH`

### مشكلة: Android SDK غير موجود
**الحل:**
1. افتح Android Studio
2. اذهب إلى SDK Manager
3. ثبت Android SDK و Build Tools

### مشكلة: Flutter Doctor يظهر أخطاء
**الحل:**
1. اتبع التعليمات التي تظهر في `flutter doctor`
2. ثبت المتطلبات المفقودة
3. أعد تشغيل `flutter doctor`

## أوامر مفيدة

```powershell
# تنظيف المشروع
flutter clean

# تثبيت التبعيات
flutter pub get

# تشغيل التطبيق
flutter run

# بناء APK
flutter build apk --release

# فحص المشروع
flutter analyze

# اختبار التطبيق
flutter test
```

## ملاحظات مهمة

1. **تأكد من اتصال الإنترنت** أثناء التثبيت
2. **أعد تشغيل PowerShell** بعد إضافة PATH
3. **استخدم PowerShell كـ Administrator** إذا لزم الأمر
4. **تأكد من تثبيت Git** قبل تثبيت Flutter

## الدعم

إذا واجهت مشاكل:
1. تحقق من: https://docs.flutter.dev/get-started/install/windows
2. ابحث في: https://stackoverflow.com/questions/tagged/flutter
3. راجع: https://flutter.dev/community

---

**بعد اتباع هذه الخطوات، يجب أن تتمكن من تشغيل `flutter pub get` بنجاح!** 🚀
