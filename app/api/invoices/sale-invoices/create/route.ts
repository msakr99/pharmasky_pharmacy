import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://129.212.140.152'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📄 Creating invoice with data:', body)

    const response = await fetch(`${API_BASE_URL}/invoices/sale-invoices/create/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('📄 External API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create invoice API error:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      return NextResponse.json(
        { message: 'Failed to create invoice', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📄 Invoice created successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create invoice route error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
