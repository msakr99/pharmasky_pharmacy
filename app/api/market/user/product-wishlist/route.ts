import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const upstream = await fetch(`${API_BASE_URL}/market/user/product-wishlist/`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    })
  } catch (error) {
    console.error('Proxy /api/market/user/product-wishlist error:', error)
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم - الوكيل' }, { status: 500 })
  }
}


