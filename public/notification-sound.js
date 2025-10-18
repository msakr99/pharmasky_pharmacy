// Notification Sound Manager
class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  // تحميل الإعدادات
  private loadSettings() {
    this.soundEnabled = localStorage.getItem('notificationSound') !== 'false';
  }

  // تشغيل صوت الإشعار
  playNotificationSound(type: string = 'default') {
    if (!this.soundEnabled) return;

    try {
      // إنشاء AudioContext إذا لم يكن موجود
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // إعادة تشغيل AudioContext إذا كان معلق
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // أصوات مختلفة حسب نوع الإشعار
      const sounds = {
        'sale_invoice': [800, 600, 800], // طلب جديد
        'payment_due_reminder': [600, 500, 600, 500], // تذكير دفع
        'wishlist_product_available': [1000, 800, 1000], // منتج متوفر
        'shift_started': [800, 1000, 1200], // بدء الوردية
        'shift_closed': [1200, 800, 600], // إغلاق الوردية
        'default': [800, 600, 800] // افتراضي
      };

      const frequencies = sounds[type as keyof typeof sounds] || sounds.default;
      const duration = 0.3;

      // تشغيل النغمات
      frequencies.forEach((freq, index) => {
        const startTime = this.audioContext!.currentTime + (index * 0.1);
        oscillator.frequency.setValueAtTime(freq, startTime);
      });

      // إعداد الصوت
      gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);

      oscillator.start(this.audioContext!.currentTime);
      oscillator.stop(this.audioContext!.currentTime + duration);

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // تفعيل/إيقاف الصوت
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('notificationSound', enabled.toString());
  }

  // فحص حالة الصوت
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }
}

// تصدير instance واحد
export const soundManager = NotificationSoundManager.getInstance();

// دالة مساعدة للاستخدام السريع
export function playNotificationSound(type: string = 'default') {
  soundManager.playNotificationSound(type);
}
