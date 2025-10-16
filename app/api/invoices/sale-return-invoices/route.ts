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

    const response = await fetch(`${API_BASE_URL}/invoices/sale-return-invoices/`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sale return invoices API error:', errorText)
      return NextResponse.json(
        { message: 'Failed to fetch sale return invoices' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Sale return invoices route error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

