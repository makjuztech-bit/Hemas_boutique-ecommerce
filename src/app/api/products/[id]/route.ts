import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        media: {
          include: {
            mediaAsset: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Fetch product error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const { name, description, categoryId, price, stockQuantity, isPublished } = body

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    })

    // Update primary variant price or stock if supplied
    if (price !== undefined || stockQuantity !== undefined) {
      const primaryVariant = await prisma.productVariant.findFirst({
        where: { productId: id },
      })

      if (primaryVariant) {
        await prisma.productVariant.update({
          where: { id: primaryVariant.id },
          data: {
            ...(price !== undefined ? { price: Math.round(Number(price) * 100) } : {}),
            ...(stockQuantity !== undefined ? { stockQuantity: Number(stockQuantity) } : {}),
          },
        })
      }
    }

    return NextResponse.json({ success: true, product: updated })
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to update product' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()
    const { id } = await params

    // Mark as archived rather than destructive deletion if referenced by past orders
    const hasOrders = await prisma.orderItem.findFirst({
      where: { variant: { productId: id } },
    })

    if (hasOrders) {
      await prisma.product.update({
        where: { id },
        data: { isArchived: true, isPublished: false },
      })
    } else {
      await prisma.product.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to delete product' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}
