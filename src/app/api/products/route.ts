import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession } from '@/backend/auth/session'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')

    const whereClause: any = {
      isArchived: false,
    }

    if (categorySlug && categorySlug !== 'all') {
      whereClause.category = { slug: categorySlug }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('Fetch products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description, categoryId, price, stockQuantity, imageUrl, sku } = await req.json()

    if (!name || !price) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 })
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`

    // Create product and its default variant
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        categoryId: categoryId || null,
        variants: {
          create: {
            sku: sku || `SKU-${Date.now()}`,
            price: Math.round(Number(price) * 100), // convert to paise
            stockQuantity: Number(stockQuantity) || 0,
          },
        },
      },
      include: {
        category: true,
        variants: true,
      },
    })

    // If image URL is provided, create media asset
    if (imageUrl) {
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          publicId: `prod_${product.id}_${Date.now()}`,
          secureUrl: imageUrl,
          altText: name,
        },
      })

      await prisma.productMedia.create({
        data: {
          productId: product.id,
          mediaAssetId: mediaAsset.id,
          sortOrder: 0,
        },
      })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create product' }, { status: 500 })
  }
}
