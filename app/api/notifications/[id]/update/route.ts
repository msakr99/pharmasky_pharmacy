import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'http://129.212.140.152'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    console.log('Updating notification with token:', token.substring(0, 20) + '...')

    const body = await request.json()
    const { id } = await context.params

    console.log('Updating notification ID:', id)

    const response = await fetch(
      `${API_BASE}/notifications/notifications/${id}/update/`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
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
          error: 'Failed to update notification',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Notification update response received:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}