// Notifications Manager for Push Notifications
export class NotificationsManager {
  private static instance: NotificationsManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  private constructor() {
    this.checkSupport();
  }

  public static getInstance(): NotificationsManager {
    if (!NotificationsManager.instance) {
      NotificationsManager.instance = new NotificationsManager();
    }
    return NotificationsManager.instance;
  }

  // فحص دعم الإشعارات
  private checkSupport() {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    console.log('Notifications supported:', this.isSupported);
  }

  // طلب إذن الإشعارات
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined') {
      throw new Error('الإشعارات غير مدعومة في Server-Side');
    }
    
    if (!this.isSupported) {
      throw new Error('الإشعارات غير مدعومة في هذا المتصفح');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  // تسجيل Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (typeof window === 'undefined') {
      throw new Error('Service Worker غير مدعوم في Server-Side');
    }
    
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker غير مدعوم');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      
      // الاستماع للتحديثات
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // إرسال إشعار محلي
  showNotification(title: string, options: NotificationOptions = {}) {
    if (typeof window === 'undefined') {
      console.warn('Cannot show notification - window not available');
      return;
    }
    
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('Cannot show notification - permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/icon.png',
      badge: '/badge.png',
      requireInteraction: true,
      ...options
    });

    // إضافة صوت للإشعار
    if (options.sound !== false) {
      this.playNotificationSound();
    }

    // إغلاق الإشعار تلقائياً بعد 10 ثوان
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  // تشغيل صوت الإشعار
  playNotificationSound() {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // إنشاء صوت الإشعار
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // إعداد الصوت
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // بدء مراقبة الإشعارات
  async startNotificationPolling(authToken: string, intervalMs: number = 30000) {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    console.log('Starting notification polling...');
    
    const pollNotifications = async () => {
      try {
        const response = await fetch('http://167.71.40.9/notifications/notifications/unread/', {
          headers: {
            'Authorization': `Token ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const newNotifications = data.results || [];

          // عرض الإشعارات الجديدة
          newNotifications.forEach((notification: any) => {
            this.showNotification(notification.title, {
              body: notification.message,
              tag: `notification-${notification.id}`,
              data: {
                url: '/notifications',
                notificationId: notification.id,
                type: notification.extra?.type
              }
            });
          });
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // تشغيل فوري
    await pollNotifications();

    // تشغيل دوري
    return setInterval(pollNotifications, intervalMs);
  }

  // إيقاف مراقبة الإشعارات
  stopNotificationPolling(intervalId: number) {
    clearInterval(intervalId);
    console.log('Notification polling stopped');
  }

  // إرسال إشعار فوري
  async sendImmediateNotification(title: string, message: string, type: string = 'info') {
    const icons = {
      'sale_invoice': '🛒',
      'payment_due_reminder': '⏰',
      'wishlist_product_available': '✨',
      'shift_started': '🟢',
      'shift_closed': '🔴',
      'info': '🔔'
    };

    const icon = icons[type as keyof typeof icons] || '🔔';

    this.showNotification(`${icon} ${title}`, {
      body: message,
      tag: `immediate-${Date.now()}`,
      data: {
        url: '/notifications',
        type: type
      }
    });
  }

  // فحص حالة الإشعارات
  getNotificationStatus() {
    return {
      supported: this.isSupported,
      permission: Notification.permission,
      registered: !!this.registration
    };
  }
}

// تصدير instance واحد
export const notificationsManager = NotificationsManager.getInstance();
