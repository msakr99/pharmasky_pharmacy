// app/components/NotificationLayout.tsx
// ═══════════════════════════════════════════════════════════════════
// مكون لإدارة الإشعارات مع authToken
// ═══════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from 'react';
import NotificationProvider from './NotificationProvider';
import { getToken } from '../lib/token-storage';

interface NotificationLayoutProps {
  children: React.ReactNode;
}

export default function NotificationLayout({ children }: NotificationLayoutProps) {
  const [authToken, setAuthToken] = useState<string>('');

  useEffect(() => {
    // الحصول على authToken من localStorage
    const token = getToken();
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // الاستماع لتغييرات token
  useEffect(() => {
    const handleStorageChange = () => {
      const token = getToken();
      setAuthToken(token || '');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <NotificationProvider authToken={authToken} autoSetup={true}>
      {children}
    </NotificationProvider>
  );
}
