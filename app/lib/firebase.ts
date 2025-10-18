// pharmacy-app/app/lib/firebase.ts
// ═══════════════════════════════════════════════════════════════════
// إعداد Firebase و Firebase Cloud Messaging (FCM)
// ═══════════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// ═══════════════════════════════════════════════════════════════════
// تكوين Firebase - استخدم القيم من Firebase Console
// ═══════════════════════════════════════════════════════════════════
// للحصول على هذه القيم:
// 1. افتح Firebase Console: https://console.firebase.google.com/
// 2. اختر مشروعك (pharmasky46)
// 3. اذهب إلى Project Settings > General
// 4. في قسم "Your apps"، انسخ الـ firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyD6EDxwyeNIQn_GZY5uE6TN2fj-DCl1zEc",
  authDomain: "pharmasky46.firebaseapp.com",
  projectId: "pharmasky46",
  storageBucket: "pharmasky46.firebasestorage.app",
  messagingSenderId: "161754387145",
  appId: "1:161754387145:web:cdb298fc73219258927318"
};

// ═══════════════════════════════════════════════════════════════════
// تهيئة Firebase App
// ═══════════════════════════════════════════════════════════════════
// نتحقق من عدم تكرار التهيئة (مهم في Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ═══════════════════════════════════════════════════════════════════
// الحصول على Messaging Instance
// ═══════════════════════════════════════════════════════════════════
// ملاحظة: messaging لا يعمل في Server-Side Rendering
// لذلك نتحقق من أننا في البيئة الصحيحة
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  // نحن في المتصفح (Client-Side)
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// VAPID Key - مطلوب للحصول على FCM Token
// ═══════════════════════════════════════════════════════════════════
// للحصول على VAPID Key:
// 1. افتح Firebase Console
// 2. اذهب إلى Project Settings > Cloud Messaging
// 3. في قسم "Web Push certificates"
// 4. إذا لم يكن موجودًا، اضغط "Generate key pair"
// 5. انسخ الـ Key pair وضعه هنا
//
// ⚠️ مهم: VAPID Key من Firebase Console
export const VAPID_KEY = "BB7lStxGteKJhc5gmVTl6IZWlbWdmgibq9230JHlGCpBfcbX-cRf64DOH8xuttVJ7Tp7fAIFBE45OzLGBtwfARs";

// ═══════════════════════════════════════════════════════════════════
// طلب إذن الإشعارات والحصول على FCM Token
// ═══════════════════════════════════════════════════════════════════
/**
 * طلب إذن الإشعارات من المستخدم والحصول على FCM Token
 * @returns FCM Token أو null في حالة الفشل
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // التحقق من دعم الإشعارات في المتصفح
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return null;
    }

    // التحقق من وجود messaging
    if (!messaging) {
      console.error("Firebase Messaging not initialized");
      return null;
    }

    // طلب الإذن من المستخدم
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted");

      // تسجيل Service Worker
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      // الحصول على FCM Token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.warn("No registration token available");
        return null;
      }
    } else if (permission === "denied") {
      console.warn("Notification permission denied");
      return null;
    } else {
      console.warn("Notification permission dismissed");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// إرسال FCM Token إلى Backend (Django)
// ═══════════════════════════════════════════════════════════════════
/**
 * إرسال FCM Token إلى Django API
 * @param token - FCM Token
 * @param userId - معرف المستخدم (اختياري)
 */
export const sendTokenToBackend = async (
  token: string,
  userId?: string | number
): Promise<boolean> => {
  try {
    // الحصول على Auth Token من localStorage
    const authToken = localStorage.getItem("token");
    
    if (!authToken) {
      console.error("No auth token found");
      return false;
    }

    // إرسال الطلب إلى Django API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/save-fcm-token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcm_token: token,
          user_id: userId,
          device_type: "web",
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Token sent to backend successfully:", data);
      return true;
    } else {
      const error = await response.json();
      console.error("Error sending token to backend:", error);
      return false;
    }
  } catch (error) {
    console.error("Error sending token to backend:", error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════
// الاستماع للإشعارات عندما يكون التطبيق مفتوحًا (Foreground)
// ═══════════════════════════════════════════════════════════════════
/**
 * معالج الإشعارات عندما يكون التطبيق مفتوحًا
 * @param callback - دالة يتم استدعاؤها عند استقبال إشعار
 */
export const onMessageListener = (
  callback: (payload: any) => void
): (() => void) => {
  if (!messaging) {
    console.error("Firebase Messaging not initialized");
    return () => {};
  }

  // الاستماع للرسائل
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("Message received (Foreground):", payload);
    callback(payload);
  });

  return unsubscribe;
};

// ═══════════════════════════════════════════════════════════════════
// دالة مساعدة لإعداد الإشعارات (جمع كل الخطوات)
// ═══════════════════════════════════════════════════════════════════
/**
 * إعداد الإشعارات بشكل كامل: طلب الإذن + الحصول على Token + إرسال للـ Backend
 */
export const setupNotifications = async (): Promise<void> => {
  try {
    // 1. طلب الإذن والحصول على Token
    const token = await requestNotificationPermission();

    if (token) {
      // 2. إرسال Token إلى Backend
      const success = await sendTokenToBackend(token);
      
      if (success) {
        console.log("Notifications setup completed successfully");
        // حفظ Token في localStorage للمرجعية
        localStorage.setItem("fcm_token", token);
      }
    }
  } catch (error) {
    console.error("Error setting up notifications:", error);
  }
};

export { app, messaging };

