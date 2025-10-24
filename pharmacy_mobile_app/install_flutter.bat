@echo off
echo ========================================
echo    دليل تثبيت Flutter على Windows
echo ========================================
echo.

echo الخطوة 1: تحميل Flutter SDK...
echo يرجى تحميل Flutter من: https://docs.flutter.dev/get-started/install/windows
echo.
echo الخطوة 2: استخراج الملفات إلى C:\flutter
echo.
echo الخطوة 3: إضافة C:\flutter\bin إلى PATH
echo.
echo الخطوة 4: إعادة تشغيل PowerShell
echo.
echo الخطوة 5: تشغيل flutter doctor
echo.

pause

echo ========================================
echo    فحص Flutter بعد التثبيت
echo ========================================
echo.

echo جاري فحص Flutter...
flutter --version
if %errorlevel% neq 0 (
    echo خطأ: Flutter غير مثبت أو غير موجود في PATH
    echo يرجى اتباع الخطوات في FLUTTER_INSTALLATION_GUIDE.md
    pause
    exit /b 1
)

echo.
echo جاري تشغيل flutter doctor...
flutter doctor

echo.
echo ========================================
echo    تثبيت تبعيات المشروع
echo ========================================
echo.

echo جاري تثبيت التبعيات...
flutter pub get

if %errorlevel% neq 0 (
    echo خطأ في تثبيت التبعيات
    pause
    exit /b 1
)

echo.
echo ========================================
echo    تم التثبيت بنجاح!
echo ========================================
echo.
echo يمكنك الآن تشغيل التطبيق باستخدام:
echo flutter run
echo.
echo أو بناء APK باستخدام:
echo flutter build apk
echo.

pause
