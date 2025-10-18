import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://129.212.140.152'

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
    const format = searchParams.get('format') || 'excel'
    const periodId = searchParams.get('period_id') || ''

    if (!periodId) {
      return NextResponse.json(
        { message: 'Period ID is required' },
        { status: 400 }
      )
    }

    // Build URL
    const url = `${API_BASE_URL}/offers/max-offers/download/?format=${format}&period_id=${periodId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Download API error:', errorText)
      return NextResponse.json(
        { message: 'Failed to download file' },
        { status: response.status }
      )
    }

    // Get the blob data
    const blob = await response.blob()
    
    // Return the file
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename=offers.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
      },
    })
  } catch (error) {
    console.error('Download route error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

