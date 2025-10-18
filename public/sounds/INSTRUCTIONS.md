# تعليمات إضافة صوت الإشعار

## 🎵 الطريقة الأولى: استخدام ملف صوتي موجود

1. **احصل على ملف صوتي قصير** (1-3 ثواني)
2. **حوله إلى MP3** باستخدام:
   - [Online Audio Converter](https://convertio.co/audio-converter/)
   - [FreeConvert](https://www.freeconvert.com/audio-converter)
   - أي برنامج تحويل صوتي

3. **احفظ الملف باسم `notify.mp3`** في هذا المجلد

## 🎵 الطريقة الثانية: إنشاء صوت مخصص

### باستخدام Audacity (مجاني):
1. حمل [Audacity](https://www.audacityteam.org/)
2. أنشئ مشروع جديد
3. اضغط على "Generate" → "Tone"
4. اختر:
   - Frequency: 1000 Hz
   - Duration: 1.5 seconds
   - Amplitude: 0.3
5. احفظ كـ MP3

### باستخدام Online Tone Generator:
1. اذهب إلى [Online Tone Generator](https://www.szynalski.com/tone-generator/)
2. اختر تردد 1000 Hz
3. سجل الصوت لمدة 1.5 ثانية
4. احفظ كـ MP3

## 🎵 الطريقة الثالثة: استخدام ملفات مجانية

### مصادر أصوات مجانية:
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/)

### البحث عن:
- "notification sound"
- "alert tone"
- "beep sound"
- "notification bell"

## ✅ اختبار الصوت

بعد إضافة الملف:

1. افتح التطبيق في المتصفح
2. اذهب إلى صفحة الإشعارات
3. أرسل إشعار تجريبي
4. تأكد من تشغيل الصوت

## 🔧 تخصيص الصوت

يمكنك تعديل مستوى الصوت في `firebase-messaging-sw.js`:

```javascript
audio.volume = 0.8; // غيّر هذه القيمة (0.0 - 1.0)
```

## 📝 ملاحظات مهمة

- **الصيغة**: MP3 فقط
- **الحجم**: أقل من 100KB
- **المدة**: 1-3 ثواني
- **الاسم**: `notify.mp3` بالضبط
- **المكان**: `/public/sounds/notify.mp3`
