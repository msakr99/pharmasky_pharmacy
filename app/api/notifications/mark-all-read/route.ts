import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://129.212.140.152'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.error('No authorization token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // تحويل Bearer إلى Token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', 'Token ') 
      : authHeader

    console.log('Marking all notifications as read with token:', token.substring(0, 20) + '...')

    const response = await fetch(
      `${API_BASE}/notifications/notifications/mark-all-read/`,
      {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('External API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('External API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to mark all notifications as read',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Mark all read response received:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { 
        error: 'Failed to mark all notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
