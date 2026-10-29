import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { serializeProductDescription, parseProductDescription, extractBaseSku } from '@/lib/productMeta'

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

    const {
      name,
      description,
      categoryId,
      price,
      salePrice,
      actualPrice,
      sellingPrice,
      stockQuantity,
      sku,
      isPublished,
      images,
      sizes,
      hasFeedingZip,
      feedingZipPrice,
    } = body

    // Load existing product to preserve metadata if not explicitly provided
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    })

    const existingMeta = parseProductDescription(existingProduct?.description).meta
    const effectiveSizes: string[] = Array.isArray(sizes) && sizes.length > 0 ? sizes : existingMeta.sizes
    const effectiveFeedingZip: boolean = hasFeedingZip !== undefined ? Boolean(hasFeedingZip) : existingMeta.hasFeedingZip
    const effectiveZipPrice: number = feedingZipPrice !== undefined ? Number(feedingZipPrice) : existingMeta.feedingZipPrice
    const zipPricePaise = Math.round(effectiveZipPrice * 100)

    let finalDescription: string | undefined = undefined
    if (description !== undefined || sizes !== undefined || hasFeedingZip !== undefined || feedingZipPrice !== undefined) {
      const baseDesc = description !== undefined ? description : parseProductDescription(existingProduct?.description).cleanDescription
      finalDescription = serializeProductDescription(baseDesc, {
        hasFeedingZip: effectiveFeedingZip,
        feedingZipPrice: effectiveZipPrice,
        sizes: effectiveSizes,
      })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(finalDescription !== undefined ? { description: finalDescription } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    })

    // Determine actual MRP price and selling/offer price
    const inputActual = actualPrice !== undefined && actualPrice !== null && actualPrice !== ''
      ? Number(actualPrice)
      : (price !== undefined && price !== null && price !== '' ? Number(price) : null)

    const inputSelling = sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ''
      ? Number(sellingPrice)
      : (salePrice !== undefined && salePrice !== null && salePrice !== '' ? Number(salePrice) : null)

    let variantPricePaise: number | undefined = undefined
    let variantSalePricePaise: number | null | undefined = undefined

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

    // Check if any variants are locked by past customer orders
    // Check if any variants are locked by past customer orders
    const hasOrders = await prisma.orderItem.findFirst({
      where: { variant: { productId: id } },
    })

    const baseSku = sku?.trim() || extractBaseSku(existingProduct?.variants[0]?.sku) || `HB-${id.slice(0, 8).toUpperCase()}`
    const effectiveBasePrice = variantPricePaise ?? existingProduct?.variants[0]?.price ?? 199900
    const effectiveSalePrice = variantSalePricePaise !== undefined ? variantSalePricePaise : (existingProduct?.variants[0]?.salePrice ?? null)
    
    const parsedStock = stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ''
      ? Number(stockQuantity)
      : (existingProduct?.variants[0]?.stockQuantity ?? 10)
    const safeStock = isNaN(parsedStock) || parsedStock < 0 ? 0 : parsedStock
    const qtyPerVariant = effectiveSizes.length > 0 ? Math.floor(safeStock / effectiveSizes.length) : safeStock

    // Construct target variants
    const newVariants: any[] = []
    effectiveSizes.forEach((sz) => {
      const cleanSz = sz.replace(/[^a-zA-Z0-9]/g, '')
      const targetSku = effectiveSizes.length === 1 && cleanSz === 'FreeSize' && !effectiveFeedingZip
        ? baseSku
        : `${baseSku}-${cleanSz}`

      // Standard variant
      newVariants.push({
        productId: id,
        sku: targetSku,
        size: sz,
        color: 'Standard',
        price: effectiveBasePrice,
        salePrice: effectiveSalePrice,
        stockQuantity: qtyPerVariant,
      })

      // Feeding zip variant
      if (effectiveFeedingZip) {
        newVariants.push({
          productId: id,
          sku: `${baseSku}-${cleanSz}-ZIP`,
          size: sz,
          color: 'Feeding Zip',
          price: effectiveBasePrice + zipPricePaise,
          salePrice: effectiveSalePrice ? effectiveSalePrice + zipPricePaise : null,
          stockQuantity: qtyPerVariant,
        })
      }
    })

    // Pre-check for SKU collisions against any OTHER product
    const candidateSkus = newVariants.map((v) => v.sku)
    const collisionVariant = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { sku: { in: candidateSkus } },
          { sku: baseSku },
          { sku: { startsWith: `${baseSku}-` } },
        ],
        productId: { not: id },
      },
      select: { sku: true, product: { select: { name: true } } },
    })

    if (collisionVariant) {
      return NextResponse.json(
        {
          error: `SKU "${baseSku}" is already used by "${collisionVariant.product?.name || 'another product'}". Please choose a unique SKU.`,
        },
        { status: 400 }
      )
    }

    if (!hasOrders && (sizes !== undefined || hasFeedingZip !== undefined || variantPricePaise !== undefined || sku !== undefined)) {
      // Safely replace variants with current size & feeding zip combinations
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      await prisma.productVariant.createMany({ data: newVariants })
    } else {
      // If locked by orders, update existing variants in-place to preserve order integrity
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: {
          ...(variantPricePaise !== undefined ? { price: variantPricePaise } : {}),
          ...(variantSalePricePaise !== undefined ? { salePrice: variantSalePricePaise } : {}),
          ...(stockQuantity !== undefined ? { stockQuantity: qtyPerVariant } : {}),
        },
      })

      // Safely update SKU on existing variants if updated and not colliding
      if (sku?.trim()) {
        const canUpdateSku = !await prisma.productVariant.findFirst({
          where: { sku: sku.trim(), productId: { not: id } }
        })
        if (canUpdateSku) {
          await prisma.productVariant.updateMany({
            where: { productId: id },
            data: { sku: sku.trim() }
          })
        }
      }
    }

    // Update images if provided (array of up to 4 image URLs)
    if (Array.isArray(images)) {
      const validImages = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .slice(0, 4)

      // Remove existing product media relations
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      })

      // Link or create media assets with sortOrder 0, 1, 2, 3
      for (let i = 0; i < validImages.length; i++) {
        const url = validImages[i].trim()
        let mediaAsset = await prisma.mediaAsset.findFirst({
          where: { secureUrl: url },
        })

        if (!mediaAsset) {
          mediaAsset = await prisma.mediaAsset.create({
            data: {
              publicId: `prod_${id}_${i}_${Date.now()}`,
              secureUrl: url,
              altText: `${name || updated.name} - View ${i + 1}`,
            },
          })
        }

        await prisma.productMedia.create({
          data: {
            productId: id,
            mediaAssetId: mediaAsset.id,
            sortOrder: i,
          },
        })
      }
    }

    const fullProduct = await prisma.product.findUnique({
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

    return NextResponse.json({ success: true, product: fullProduct })
  } catch (error: any) {
    console.error('Update product error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this SKU already exists. Please choose a unique SKU.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : (error?.message || 'Failed to update product') },
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
