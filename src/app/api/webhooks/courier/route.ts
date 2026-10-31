import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'

// Handle GET verification ping (Shiprocket sometimes uses GET to verify endpoint reachability)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'Hemas Boutique Courier Webhook',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Token if configured
    const configuredToken = process.env.SHIPROCKET_WEBHOOK_TOKEN
    if (configuredToken) {
      const incomingApiKey = req.headers.get('x-api-key')
      const incomingAuth = req.headers.get('authorization')
      if (incomingApiKey !== configuredToken && incomingAuth !== configuredToken) {
        return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 })
      }
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Empty test ping from webhook test tools
      return NextResponse.json({ received: true, message: 'Ping acknowledged' })
    }

    const { order_id, awb, current_status, courier_name } = body

    // If Shiprocket sends an empty or initial test ping
    if (!order_id) {
      return NextResponse.json({ received: true, message: 'Test ping acknowledged' })
    }

    const statusText = (current_status || '').toUpperCase()
    let newStatus: string | null = null

    if (statusText.includes('DELIVERED') && !statusText.includes('RTO')) {
      newStatus = 'DELIVERED'
    } else if (
      statusText.includes('IN TRANSIT') ||
      statusText.includes('PICKED UP') ||
      statusText.includes('OUT FOR DELIVERY') ||
      statusText.includes('SHIPPED')
    ) {
      newStatus = 'SHIPPED'
    } else if (statusText.includes('RTO') || statusText.includes('RETURN')) {
      newStatus = 'RETURNED'
    } else if (statusText.includes('CANCEL')) {
      newStatus = 'CANCELLED'
    }

    const updateData: any = {}
    if (newStatus) updateData.status = newStatus
    if (awb) updateData.trackingNumber = awb
    if (courier_name) updateData.courierName = courier_name

    if (Object.keys(updateData).length > 0) {
      await prisma.order.updateMany({
        where: { orderNumber: String(order_id) },
        data: updateData,
      })
    }

    return NextResponse.json({ received: true, status: newStatus || 'ACK' })
  } catch (error: any) {
    console.error('Courier webhook error:', error)
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

