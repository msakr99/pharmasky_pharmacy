import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://129.212.140.152'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.error('No authorization token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // تحويل Bearer إلى Token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', 'Token ') 
      : authHeader

    console.log('Fetching notifications with token:', token.substring(0, 20) + '...')

    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('page_size') || '20'
    const isRead = searchParams.get('is_read')
    const search = searchParams.get('search')
    const ordering = searchParams.get('ordering') || '-created_at'

    let url = `${API_BASE}/notifications/notifications/?page=${page}&page_size=${pageSize}&ordering=${ordering}`
    
    if (isRead !== null) {
      url += `&is_read=${isRead}`
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    console.log('Making request to:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

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
          error: 'Failed to fetch notifications',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Notifications data received:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
