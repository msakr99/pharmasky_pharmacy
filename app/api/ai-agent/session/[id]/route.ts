import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization') || ''
    const upstream = await fetch(`${API_BASE_URL}/ai-agent/session/${id}/`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      cache: 'no-store',
    })
    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
  } catch (error) {
    console.error('Proxy /api/ai-agent/session GET error:', error)
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم - الوكيل' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization') || ''
    const upstream = await fetch(`${API_BASE_URL}/ai-agent/session/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
      cache: 'no-store',
    })
    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
  } catch (error) {
    console.error('Proxy /api/ai-agent/session DELETE error:', error)
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم - الوكيل' }, { status: 500 })
  }
}


