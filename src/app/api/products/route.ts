import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { serializeProductDescription } from '@/lib/productMeta'

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
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const {
      name,
      description,
      categoryId,
      price,
      salePrice,
      actualPrice,
      sellingPrice,
      stockQuantity,
      images,
      imageUrl,
      sku,
      sizes,
      hasFeedingZip,
      feedingZipPrice,
    } = await req.json()

    // Determine actual MRP price and selling/offer price
    const inputActual = actualPrice !== undefined && actualPrice !== null && actualPrice !== ''
      ? Number(actualPrice)
      : (price !== undefined && price !== null && price !== '' ? Number(price) : null)

    const inputSelling = sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ''
      ? Number(sellingPrice)
      : (salePrice !== undefined && salePrice !== null && salePrice !== '' ? Number(salePrice) : null)

    if (!name || (!inputActual && !inputSelling)) {
      return NextResponse.json(
        { error: 'Product name and price (Selling Price or Actual Price) are required' },
        { status: 400 }
      )
    }

    let variantPricePaise = 0
    let variantSalePricePaise: number | null = null

    if (inputActual !== null && inputSelling !== null && inputActual > 0 && inputSelling > 0) {
      if (inputActual > inputSelling) {
        variantPricePaise = Math.round(inputActual * 100)
        variantSalePricePaise = Math.round(inputSelling * 100)
      } else {
        variantPricePaise = Math.round(inputSelling * 100)
        variantSalePricePaise = null
      }
    } else if (inputSelling !== null && inputSelling > 0) {
      variantPricePaise = Math.round(inputSelling * 100)
      variantSalePricePaise = null
    } else if (inputActual !== null && inputActual > 0) {
      variantPricePaise = Math.round(inputActual * 100)
      variantSalePricePaise = null
    }

    const effectiveSizes: string[] = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['Free Size']
    const effectiveFeedingZip = Boolean(hasFeedingZip)
    const effectiveZipPrice = Number(feedingZipPrice) >= 0 ? Number(feedingZipPrice) : 200
    const zipPricePaise = Math.round(effectiveZipPrice * 100)

    const finalDescription = serializeProductDescription(description || '', {
      hasFeedingZip: effectiveFeedingZip,
      feedingZipPrice: effectiveZipPrice,
      sizes: effectiveSizes,
    })

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`
    const baseSku = sku?.trim() || `HB-${Date.now().toString().slice(-6)}`

    // Generate variants for each size (and feeding zip add-on if enabled)
    const variantsToCreate: any[] = []
    const qtyPerVariant = Math.max(1, Math.round((Number(stockQuantity) || 10) / effectiveSizes.length))

    effectiveSizes.forEach((sz, idx) => {
      // Standard variant for this size
      variantsToCreate.push({
        sku: `${baseSku}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`,
        size: sz,
        color: 'Standard',
        price: variantPricePaise,
        salePrice: variantSalePricePaise,
        stockQuantity: qtyPerVariant,
      })

      // Add-on variant with mother feeding zip if enabled
      if (effectiveFeedingZip) {
        variantsToCreate.push({
          sku: `${baseSku}-${sz.replace(/[^a-zA-Z0-9]/g, '')}-ZIP`,
          size: sz,
          color: 'Feeding Zip',
          price: variantPricePaise + zipPricePaise,
          salePrice: variantSalePricePaise ? variantSalePricePaise + zipPricePaise : null,
          stockQuantity: qtyPerVariant,
        })
      }
    })

    // Create product with all generated variants
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: finalDescription,
        categoryId: categoryId || null,
        variants: {
          create: variantsToCreate,
        },
      },
      include: {
        category: true,
        variants: true,
      },
    })

    // Process up to 4 images
    const imageList: string[] = []
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === 'string' && img.trim()) {
          imageList.push(img.trim())
        }
      }
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      imageList.push(imageUrl.trim())
    }

    for (let i = 0; i < Math.min(imageList.length, 4); i++) {
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          publicId: `prod_${product.id}_${i}_${Date.now()}`,
          secureUrl: imageList[i],
          altText: `${name} - View ${i + 1}`,
        },
      })

      await prisma.productMedia.create({
        data: {
          productId: product.id,
          mediaAssetId: mediaAsset.id,
          sortOrder: i,
        },
      })
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: true,
        media: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, product: fullProduct })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : (error?.message || 'Failed to create product') },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}
