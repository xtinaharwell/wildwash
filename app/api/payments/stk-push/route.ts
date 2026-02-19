import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract required fields
    const { phone, amount, order_id, accountReference, transactionDesc, investmentPlan, investmentAmount } = body;
    
    // Validate required fields
    if (!phone || !amount) {
      return NextResponse.json(
        { detail: 'phone and amount are required' },
        { status: 400 }
      );
    }

    // Get the Django backend URL from environment
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    
    // Forward the request to Django backend
    const response = await fetch(`${apiBase}/payments/mpesa/stk-push/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        amount,
        order_id: order_id || accountReference, // Support both field names
      }),
    });

    const data = await response.json();

    // Return the response from Django
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('STK Push API Error:', error);
    return NextResponse.json(
      { detail: 'Failed to process payment request' },
      { status: 500 }
    );
  }
}
