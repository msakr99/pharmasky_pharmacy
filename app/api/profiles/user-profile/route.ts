import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://129.212.140.152'

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/user-profile/`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    return new NextResponse(null, { status: response.status })
  } catch (error) {
    console.error('Health check failed:', error)
    return new NextResponse(null, { status: 503 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    console.log('Received token:', token ? `${token.substring(0, 20)}...` : 'No token')
    
    if (!token) {
      console.error('No authorization token provided')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Validate token format
    if (!token.startsWith('Token ')) {
      console.error('Invalid token format:', token)
      return NextResponse.json(
        { message: 'Invalid token format' },
        { status: 401 }
      )
    }


    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    console.log('Making request to:', `${API_BASE_URL}/profiles/user-profile/`)
    console.log('Using token:', token.substring(0, 20) + '...')
    
    const response = await fetch(`${API_BASE_URL}/profiles/user-profile/`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
      signal: controller.signal
    })
    
    console.log('External API response status:', response.status)
    console.log('External API response ok:', response.ok)

    clearTimeout(timeoutId)


    if (!response.ok) {
      const errorText = await response.text()
      console.error('User profile API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${API_BASE_URL}/profiles/user-profile/`
      })
      
      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { 
            message: 'Unauthorized - invalid token',
            details: errorText,
            status: response.status
          },
          { status: 401 }
        )
      } else if (response.status === 403) {
        return NextResponse.json(
          { 
            message: 'Forbidden - insufficient permissions',
            details: errorText,
            status: response.status
          },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { 
            message: 'Failed to fetch user profile',
            details: errorText,
            status: response.status
          },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log('External API response data:', data)
    console.log('Data keys:', Object.keys(data))
    console.log('Data type:', typeof data)
    
    // Check if the data is empty or invalid
    if (!data || Object.keys(data).length === 0) {
      console.error('Empty response from external API:', data)
      return NextResponse.json(
        { 
          message: 'Empty response from user profile API',
          error: 'No data received from external API'
        },
        { status: 204 }
      )
    }
    
    // Validate that we have the required fields
    if (!data.user || !data.user.id) {
      console.error('Invalid response structure - missing user data:', data)
      return NextResponse.json(
        { 
          message: 'Invalid response structure',
          error: 'Missing required user data'
        },
        { status: 422 }
      )
    }
    
    console.log('Returning data to frontend:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('User profile route error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          message: 'Request timeout - API server is not responding',
          error: 'Timeout after 10 seconds'
        },
        { status: 504 }
      )
    }
    
    // Handle connection refused error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          message: 'API server is not available',
          error: 'Connection refused - server may be down',
          details: 'Please check if the API server is running and accessible'
        },
        { status: 503 }
      )
    }
    
    // Handle network errors
    if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json(
        { 
          message: 'Network error - cannot reach API server',
          error: error.message,
          details: 'Please check your internet connection and server availability'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


