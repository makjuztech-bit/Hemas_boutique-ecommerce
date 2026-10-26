import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession, requireAuth, requireAdmin } from '@/backend/auth/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'

const VALID_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')

    // Admin scope requires admin privileges
    if (scope === 'admin') {
      if (session.role !== 'SUPER_ADMIN' && session.role !== 'STAFF') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }

      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobileNumber: true,
            },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ orders })
    }

    // Customer scope: strictly isolate to session user
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      include: {
                        mediaAsset: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Fetch orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()

    const rate = checkRateLimit(req, 10, 60 * 1000, 'orders-create')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many order requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const { shippingAddress, paymentMethod = 'ONLINE' } = await req.json()

    if (paymentMethod === 'COD') {
      return NextResponse.json(
        { error: 'Cash on delivery is not accepted. Please pay securely online via Razorpay / UPI / Cards.' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      )
    }

    // Fetch customer's cart items from DB (never trust client items or prices)
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
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    let subtotal = 0
    const orderItemsData: any[] = []

    for (const item of cartItems) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for "${item.variant.product.name}" (${item.variant.sku}). Available: ${item.variant.stockQuantity}`,
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

    const tax = Math.round(subtotal * 0.05) // 5% GST
    const shippingCharge = subtotal > 200000 ? 0 : 15000 // Free over ₹2000, else ₹150
    const total = subtotal + tax + shippingCharge
    const orderNumber = `HB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

    // Create order transaction with atomic stock decrement and oversell protection
    const order = await prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction
      for (const item of cartItems) {
        const freshVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        })

        if (!freshVariant || freshVariant.stockQuantity < item.quantity) {
          throw new Error(
            `Item "${item.variant.product.name}" was just reserved by another customer. Please review your cart.`
          )
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.userId,
          status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING_PAYMENT',
          subtotal,
          tax,
          shippingCharge,
          discount: 0,
          total,
          shippingAddress: JSON.stringify(shippingAddress),
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'INITIATED',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      })

      // If Cash On Delivery, commit stock decrement immediately
      if (paymentMethod === 'COD') {
        for (const item of cartItems) {
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

      // Clear customer cart
      await tx.cartItem.deleteMany({
        where: { userId: session.userId },
      })

      return createdOrder
    })

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to place order' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const { orderId, status } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status value' }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (error: any) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to update order status' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}
