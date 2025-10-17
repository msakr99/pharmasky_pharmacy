import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://167.71.40.9'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE}/notifications/notifications/unread/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching unread notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread notifications' },
      { status: 500 }
    )
  }
}
