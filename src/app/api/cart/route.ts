import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession, requireAuth } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ items: [] })
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.userId },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Fetch cart error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()

    const rate = checkRateLimit(req, 30, 60 * 1000, 'cart-add')
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many cart requests. Please slow down.' }, { status: 429 })
    }

    const { variantId, quantity = 1 } = await req.json()

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    const parsedQty = Math.max(1, Math.min(20, Number(quantity) || 1))

    // Check if variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 })
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId: session.userId,
          variantId,
        },
      },
    })

    const currentQtyInCart = existingCartItem?.quantity || 0
    const totalRequested = currentQtyInCart + parsedQty

    if (variant.stockQuantity < totalRequested) {
      const remainingAvailable = Math.max(0, variant.stockQuantity - currentQtyInCart)
      return NextResponse.json(
        {
          error:
            remainingAvailable > 0
              ? `You already have ${currentQtyInCart} in your bag. Only ${remainingAvailable} more available.`
              : `Cannot add more. You already have all available stock (${variant.stockQuantity}) in your bag.`,
        },
        { status: 400 }
      )
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_variantId: {
          userId: session.userId,
          variantId,
        },
      },
      update: {
        quantity: { increment: parsedQty },
      },
      create: {
        userId: session.userId,
        variantId,
        quantity: parsedQty,
      },
    })

    return NextResponse.json({ success: true, cartItem })
  } catch (error: any) {
    console.error('Cart add error:', error)
    return NextResponse.json(
      { error: error?.message === 'UNAUTHORIZED' ? 'Please log in' : 'Failed to update cart' },
      { status: error?.message === 'UNAUTHORIZED' ? 401 : 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()
    const { id, quantity } = await req.json()

    const parsedQty = Number(quantity)

    if (parsedQty <= 0) {
      await prisma.cartItem.deleteMany({
        where: { id, userId: session.userId },
      })
      return NextResponse.json({ success: true, deleted: true })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { id, userId: session.userId },
      include: { variant: true },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (existingItem.variant.stockQuantity < parsedQty) {
      return NextResponse.json(
        { error: `Only ${existingItem.variant.stockQuantity} items in stock.` },
        { status: 400 }
      )
    }

    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: Math.min(20, parsedQty) },
    })

    return NextResponse.json({ success: true, count: 1 })
  } catch (error: any) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: error?.message === 'UNAUTHORIZED' ? 'Unauthorized' : 'Failed to update cart item' },
      { status: error?.message === 'UNAUTHORIZED' ? 401 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.cartItem.deleteMany({
        where: { id, userId: session.userId },
      })
    } else {
      await prisma.cartItem.deleteMany({
        where: { userId: session.userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { error: error?.message === 'UNAUTHORIZED' ? 'Unauthorized' : 'Failed to remove item' },
      { status: error?.message === 'UNAUTHORIZED' ? 401 : 500 }
    )
  }
}
