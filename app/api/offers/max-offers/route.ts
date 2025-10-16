import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('p') || '1'
    const search = searchParams.get('search') || ''

    // Build URL with query parameters
    let url = `${API_BASE_URL}/offers/max-offers/?p=${page}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Max offers API error:', errorText)
      return NextResponse.json(
        { message: 'Failed to fetch offers', error: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Max offers route error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

