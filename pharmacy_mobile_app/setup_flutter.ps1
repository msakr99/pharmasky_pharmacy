# Flutter Setup Script for Windows
# دليل إعداد Flutter على Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    دليل تثبيت Flutter على Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is already installed
Write-Host "فحص Flutter..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Flutter مثبت بالفعل!" -ForegroundColor Green
        Write-Host $flutterVersion -ForegroundColor White
    } else {
        throw "Flutter not found"
    }
} catch {
    Write-Host "Flutter غير مثبت. يرجى اتباع الخطوات التالية:" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. تحميل Flutter SDK من:" -ForegroundColor Yellow
    Write-Host "   https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. استخراج الملفات إلى C:\flutter" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. إضافة C:\flutter\bin إلى PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. إعادة تشغيل PowerShell" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. تشغيل هذا السكريبت مرة أخرى" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host ""
Write-Host "فحص Flutter Doctor..." -ForegroundColor Yellow
flutter doctor

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    تثبيت تبعيات المشروع" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "جاري تثبيت التبعيات..." -ForegroundColor Yellow
flutter pub get

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    تم التثبيت بنجاح!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "يمكنك الآن تشغيل التطبيق باستخدام:" -ForegroundColor White
    Write-Host "flutter run" -ForegroundColor Blue
    Write-Host ""
    Write-Host "أو بناء APK باستخدام:" -ForegroundColor White
    Write-Host "flutter build apk" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Host "خطأ في تثبيت التبعيات" -ForegroundColor Red
    Write-Host "يرجى التحقق من اتصال الإنترنت وإعادة المحاولة" -ForegroundColor Red
}

Write-Host ""
Read-Host "اضغط Enter للخروج"
