import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pharmacy App - الإشعارات الصوتية',
  description: 'تطبيق الصيدلية مع الإشعارات الصوتية والمراقبة التلقائية',
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
        {children}
        
        {/* تهيئة الإشعارات */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // تهيئة Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
              
              // تهيئة الإشعارات
              if ('Notification' in window) {
                console.log('Notifications supported');
              } else {
                console.log('Notifications not supported');
              }
            `
          }}
        />
      </body>
    </html>
  )
}