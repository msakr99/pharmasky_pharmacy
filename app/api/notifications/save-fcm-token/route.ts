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

    // جرب عدة مسارات وmethods محتملة
    const possibleEndpoints = [
      `${API_BASE}/notifications/fcm-tokens/`,
      `${API_BASE}/notifications/device-tokens/`,
      `${API_BASE}/notifications/save-fcm-token/`,
      `${API_BASE}/api/notifications/fcm-tokens/`,
      `${API_BASE}/api/notifications/device-tokens/`,
      `${API_BASE}/api/notifications/save-fcm-token/`
    ]

    const possibleMethods = ['POST', 'PUT', 'PATCH']

    let response = null
    let workingEndpoint = null
    let workingMethod = null

    for (const endpoint of possibleEndpoints) {
      for (const method of possibleMethods) {
        console.log(`Trying endpoint: ${endpoint} with method: ${method}`)
        try {
          response = await fetch(endpoint, {
            method: method,
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          })

          console.log(`Endpoint ${endpoint} with ${method} responded with status: ${response.status}`)

          if (response.status === 200 || response.status === 201 || response.status === 202) {
            workingEndpoint = endpoint
            workingMethod = method
            break
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} with ${method} failed:`, error)
          continue
        }
      }
      if (workingEndpoint) break
    }

    if (!response || !workingEndpoint) {
      console.error('All endpoints and methods failed, using fallback')
      response = await fetch(`${API_BASE}/notifications/fcm-tokens/`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
    }

    if (workingEndpoint) {
      console.log(`✅ Using working endpoint: ${workingEndpoint} with method: ${workingMethod}`)
    } else {
      console.log(`⚠️ Using fallback endpoint with POST method`)
    }
    console.log('External API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('External API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      // إذا فشل الحفظ، ارجع success: false لكن لا توقف العملية
      console.log('⚠️ FCM token saving failed, but continuing with local storage')
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save FCM token to backend',
          details: errorText,
          status: response.status,
          message: 'FCM token will be saved locally and retried later'
        },
        { status: 200 } // ارجع 200 حتى لا يتوقف النظام
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
