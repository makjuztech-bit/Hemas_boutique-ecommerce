import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAuth } from '@/backend/auth/session'
import { getRazorpay } from '@/lib/razorpay'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { getEnv } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()

    const rate = checkRateLimit(req, 15, 60 * 1000, 'checkout-razorpay')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { shippingAddress } = body

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      )
    }

    // 1. Fetch customer cart items with current variant and pricing
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Your shopping cart is empty' }, { status: 400 })
    }

    // 2. Validate stock availability and calculate totals on server
    let subtotal = 0
    const orderItemsData: any[] = []

    for (const item of cartItems) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${item.variant.product.name}" (${item.variant.sku}). Available: ${item.variant.stockQuantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        )
      }

      const unitPrice = item.variant.salePrice || item.variant.price
      subtotal += unitPrice * item.quantity

      orderItemsData.push({
        variantId: item.variantId,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        quantity: item.quantity,
        price: item.variant.price,
        salePrice: item.variant.salePrice,
        size: item.variant.size || null,
        color: item.variant.color || null,
      })
    }

    const tax = Math.round(subtotal * 0.05) // 5% GST on boutique luxury wear
    const shippingCharge = subtotal > 200000 ? 0 : 15000 // Free shipping over ₹2000, else ₹150
    const total = subtotal + tax + shippingCharge
    const orderNumber = `HB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

    // 3. Create pending Order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.userId,
        status: 'PENDING_PAYMENT',
        subtotal,
        tax,
        shippingCharge,
        discount: 0,
        total,
        shippingAddress: JSON.stringify(shippingAddress),
        paymentStatus: 'INITIATED',
        items: {
          create: orderItemsData,
        },
      },
    })

    // 4. Initialize Razorpay Order via SDK
    const razorpay = getRazorpay()
    const rzpOrder = await razorpay.orders.create({
      amount: total, // amount in minor units (paise)
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        userId: session.userId,
      },
    })

    // 5. Bind Razorpay Order ID to internal order
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpOrder.id },
    })

    const env = getEnv()

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate online payment order' },
      { status: 500 }
    )
  }
}
