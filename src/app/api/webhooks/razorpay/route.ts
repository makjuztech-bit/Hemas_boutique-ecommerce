import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { getEnv } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    const env = getEnv()
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('[WEBHOOK WARNING] RAZORPAY_WEBHOOK_SECRET is not configured; rejecting webhook payload')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 })
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.warn('[SECURITY] Razorpay webhook signature validation failed')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event
    const paymentEntity = event.payload?.payment?.entity
    const rzpOrderId = paymentEntity?.order_id

    if (!rzpOrderId) {
      return NextResponse.json({ received: true })
    }

    // Process event idempotently
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { razorpayOrderId: rzpOrderId },
          include: { items: true },
        })

        if (!order || order.status === 'PAID') {
          return // Already processed or not found
        }

        // Decrement stock if not yet processed
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            paymentStatus: 'PAID',
            paymentId: paymentEntity.id,
          },
        })

        await tx.paymentEvent.create({
          data: {
            orderId: order.id,
            razorpayPaymentId: paymentEntity.id,
            razorpaySignature: signature,
            status: 'SUCCESS',
            amount: paymentEntity.amount,
            currency: paymentEntity.currency || 'INR',
          },
        })
      })
    } else if (eventType === 'payment.failed') {
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: rzpOrderId },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        })

        await prisma.paymentEvent.create({
          data: {
            orderId: order.id,
            razorpayPaymentId: paymentEntity?.id || null,
            status: 'FAILED',
            amount: paymentEntity?.amount || order.total,
            currency: 'INR',
            errorData: JSON.stringify(paymentEntity?.error_description || 'Payment failed event'),
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
