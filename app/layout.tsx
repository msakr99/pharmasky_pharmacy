import type { Metadata } from 'next'
import './globals.css'
import NotificationLayout from './components/NotificationLayout'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Pharmacy App -فارماسكاي',
  description: ' فارماسكاي ',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pharmacy App" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <NotificationLayout>
          {children}
        </NotificationLayout>
        <Toaster position="top-center" />
        
        {/* تهيئة Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // تهيئة Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(registration => {
                      console.log('✅ Firebase SW registered: ', registration);
                    })
                    .catch(registrationError => {
                      console.log('❌ Firebase SW registration failed: ', registrationError);
                    });
                });
              }
              
              // تهيئة الإشعارات
              if ('Notification' in window) {
                console.log('✅ Notifications supported');
              } else {
                console.log('❌ Notifications not supported');
              }
            `
          }}
        />
      </body>
    </html>
  )
}