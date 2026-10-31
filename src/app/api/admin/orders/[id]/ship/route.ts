import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import {
  createShiprocketOrder,
  assignShiprocketCourier,
  generateShiprocketLabel,
} from '@/lib/shiprocket'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id: orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 1. Create order on Shiprocket
    const srOrderRes = await createShiprocketOrder(order)

    const shipmentId = srOrderRes.shipment_id || srOrderRes.payload?.shipment_id
    if (!shipmentId) {
      const errMsg =
        srOrderRes.message ||
        (srOrderRes.errors ? JSON.stringify(srOrderRes.errors) : 'Failed to create Shiprocket shipment')
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    // 2. Assign best courier partner & generate AWB
    let awbCode: string | null = null
    let courierName = 'Shiprocket Courier'
    let labelUrl: string | null = null

    try {
      const awbRes = await assignShiprocketCourier(shipmentId)
      const awbData = awbRes?.response?.data
      if (awbData) {
        awbCode = awbData.awb_code || null
        courierName = awbData.courier_name || courierName
      }
    } catch (awbErr) {
      console.warn('AWB auto-assignment warning:', awbErr)
    }

    // 3. Try to generate shipping label PDF
    try {
      const labelRes = await generateShiprocketLabel(shipmentId)
      labelUrl = labelRes?.label_url || null
    } catch (labelErr) {
      console.warn('Label generation warning:', labelErr)
    }

    // 4. Update the order in our Prisma database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        courierName: courierName,
        trackingNumber: awbCode || `SR-${shipmentId}`,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      shipmentId,
      awbCode: awbCode || `SR-${shipmentId}`,
      courierName,
      labelUrl,
      message: 'Shipment created and dispatched via Shiprocket successfully',
    })
  } catch (error: any) {
    console.error('Shiprocket dispatch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch order via Shiprocket' },
      { status: 500 }
    )
  }
}

