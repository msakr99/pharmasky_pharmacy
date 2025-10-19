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
    console.log('NotificationLayout: Retrieved token:', token ? token.substring(0, 20) + '...' : 'null');
    if (token) {
      setAuthToken(token);
    }
    
    // تحقق دوري من توفر token (في حالة تأخر التحميل)
    const checkToken = () => {
      const currentToken = getToken();
      if (currentToken && currentToken !== authToken) {
        console.log('NotificationLayout: Token updated:', currentToken.substring(0, 20) + '...');
        setAuthToken(currentToken);
      }
    };
    
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [authToken]);

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
