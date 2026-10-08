import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession } from '@/backend/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'STAFF'
    const scope = searchParams.get('scope')

    // If admin is requesting all orders for admin panel
    if (isAdmin && scope === 'admin') {
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

    // Customer orders
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
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shippingAddress, paymentMethod = 'COD' } = await req.json()

    // Get customer's cart items
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
    const orderItemsData = cartItems.map((item) => {
      const unitPrice = item.variant.salePrice || item.variant.price
      const itemTotal = unitPrice * item.quantity
      subtotal += itemTotal
      return {
        variantId: item.variantId,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        quantity: item.quantity,
        price: item.variant.price,
        salePrice: item.variant.salePrice,
        size: item.variant.size || null,
        color: item.variant.color || null,
      }
    })

    const tax = Math.round(subtotal * 0.05) // 5% GST
    const shippingCharge = subtotal > 200000 ? 0 : 15000 // Free shipping over ₹2000, else ₹150
    const total = subtotal + tax + shippingCharge
    const orderNumber = `HB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

    // Create order transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.userId,
          status: paymentMethod === 'COD' ? 'PROCESSING' : 'PAID',
          subtotal,
          tax,
          shippingCharge,
          discount: 0,
          total,
          shippingAddress: JSON.stringify(shippingAddress),
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      })

      // Update variant stock quantities
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
    const session = await getSession()
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { orderId, status } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (error: any) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
