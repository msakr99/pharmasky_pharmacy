import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: " PharmaSky ",
  description: "Pharmasky-فارماسكاي ",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  )
}

