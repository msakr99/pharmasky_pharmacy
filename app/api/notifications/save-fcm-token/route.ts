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

    const body = await request.json()
    console.log('Saving FCM token with data:', body)

    // جرب عدة مسارات محتملة
    const possibleEndpoints = [
      `${API_BASE}/notifications/fcm-tokens/`,
      `${API_BASE}/notifications/device-tokens/`,
      `${API_BASE}/notifications/save-fcm-token/`,
      `${API_BASE}/api/notifications/fcm-tokens/`,
      `${API_BASE}/api/notifications/device-tokens/`,
      `${API_BASE}/api/notifications/save-fcm-token/`
    ]

    let response = null
    let workingEndpoint = null

    for (const endpoint of possibleEndpoints) {
      console.log(`Trying endpoint: ${endpoint}`)
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        console.log(`Endpoint ${endpoint} responded with status: ${response.status}`)

        if (response.status !== 404) {
          workingEndpoint = endpoint
          break
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error)
        continue
      }
    }

    if (!response || !workingEndpoint) {
      console.error('All endpoints failed, using fallback endpoint')
      response = await fetch(`${API_BASE}/notifications/fcm-tokens/`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
    }

    console.log(`Using working endpoint: ${workingEndpoint}`)
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
          error: 'Failed to save FCM token',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('FCM token saved successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save FCM token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
