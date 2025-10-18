import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://129.212.140.152'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the pharmacy login endpoint
    const response = await fetch(`${API_BASE_URL}/accounts/pharmacy-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', await response.text())
      return NextResponse.json(
        { message: 'خطأ في الاتصال بالخادم - استجابة غير صحيحة' },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.detail || data.error || 'فشل تسجيل الدخول' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      token: data.token || data.auth_token,
      user: {
        id: data.user?.id || data.id,
        username: data.user?.username || data.username || body.username,
        name: data.user?.name || data.name,
      }
    })
  } catch (error) {
    console.error('Login API Error:', error)
    return NextResponse.json(
      { message: 'خطأ في الاتصال بالخادم' },
      { status: 500 }
    )
  }
}

