import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader = req.headers.get('authorization') || ''

    const upstream = await fetch(`${API_BASE_URL}/ai-agent/call/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': contentType,
      },
    })
  } catch (error) {
    console.error('Proxy /api/ai-agent/call error:', error)
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم - الوكيل' }, { status: 500 })
  }
}

 
