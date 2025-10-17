export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  OFFERS: '/offers',
  SKYREP: '/skysales',
  INVOICES: '/invoices',
  RETURNS: '/returns',
  SHORTAGES: '/shortages',
  CLAIMS: '/claims',
}

export const NAVIGATION_ITEMS = [
  {
    label: 'لوحة التحكم',
    href: ROUTES.DASHBOARD,
  },
  {
    label: 'الفواتير',
    href: ROUTES.INVOICES,
  },
  {
    label: 'المرتجعات',
    href: ROUTES.RETURNS,
  },
  {
    label: 'النواقص',
    href: ROUTES.SHORTAGES,
  },
  {
    label: 'المطالبات',
    href: ROUTES.CLAIMS,
  },
  {
    label: 'العروض',
    href: ROUTES.OFFERS,
  },
  {
    label: 'SkySales',
    href: ROUTES.SKYREP,
  },
]

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export const AI_AGENT_ENDPOINTS = {
  // Use relative paths so the browser calls our Next.js API routes (proxy)
  CHAT: '/api/ai-agent/chat',
  VOICE: '/api/ai-agent/voice',
  CALL: '/api/ai-agent/call',
  SESSION: (sessionId: number) => `/api/ai-agent/session/${sessionId}`,
}

