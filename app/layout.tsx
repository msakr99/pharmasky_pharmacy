import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "نظام إدارة الصيدلية",
  description: "نظام متكامل لإدارة الصيدلية",
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

