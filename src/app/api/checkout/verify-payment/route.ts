import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAuth } from '@/backend/auth/session'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Incomplete payment verification payload' },
        { status: 400 }
      )
    }

    // 1. Verify cryptographic HMAC signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    )

    if (!isSignatureValid) {
      console.warn(`[SECURITY] Invalid Razorpay signature attempt for order ${orderId}`)
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted payment details.' },
        { status: 400 }
      )
    }

    // 2. Process order update & stock decrement in an atomic transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Find order and enforce customer isolation
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      if (order.userId !== session.userId) {
        throw new Error('Unauthorized: Order belongs to another account')
      }

      if (order.razorpayOrderId !== razorpayOrderId) {
        throw new Error('Order mismatch with payment gateway reference')
      }

      // Idempotency: If already paid, do not double-decrement inventory
      if (order.status === 'PAID') {
        return order
      }

      // Validate stock availability and decrement
      for (const item of order.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          })

          if (!variant || variant.stockQuantity < item.quantity) {
            throw new Error(`Inventory depletion: Item ${item.productName} is out of stock.`)
          }

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

      // Update order status
      const paidOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          paymentId: razorpayPaymentId,
        },
      })

      // Record payment event audit log
      await tx.paymentEvent.create({
        data: {
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS',
          amount: order.total,
          currency: 'INR',
        },
      })

      // Clear customer's cart
      await tx.cartItem.deleteMany({
        where: { userId: session.userId },
      })

      return paidOrder
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error?.message || 'Payment verification processing error' },
      { status: 500 }
    )
  }
}
