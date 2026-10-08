import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession } from '@/backend/auth/session'

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
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login to add items to cart' }, { status: 401 })
    }

    const { variantId, quantity = 1 } = await req.json()

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    // Check if variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 })
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_variantId: {
          userId: session.userId,
          variantId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: session.userId,
        variantId,
        quantity,
      },
    })

    return NextResponse.json({ success: true, cartItem })
  } catch (error: any) {
    console.error('Cart add error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update cart' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, quantity } = await req.json()

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id, userId: session.userId },
      })
      return NextResponse.json({ success: true, deleted: true })
    }

    const updated = await prisma.cartItem.update({
      where: { id, userId: session.userId },
      data: { quantity },
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error: any) {
    console.error('Update cart item error:', error)
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.cartItem.delete({
        where: { id, userId: session.userId },
      })
    } else {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: { userId: session.userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete cart item error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}
