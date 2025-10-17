import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://167.71.40.9'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const response = await fetch(url, {
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
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
