import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Fetch categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const { name, description } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category'
    let slug = baseSlug
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || '',
      },
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : (error?.message || 'Failed to create category') },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const { id, name, slug, description } = await req.json()
    if (!id || !name) {
      return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 })
    }

    // Sanitize slug if provided, or derive from name
    const rawSlug = slug && slug.trim() ? slug : name
    const baseSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category'
    let finalSlug = baseSlug

    // Check if another category has this slug
    const existing = await prisma.category.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id },
      },
    })
    if (existing) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description !== undefined ? description : undefined,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json({ success: true, category: updated })
  } catch (error: any) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : (error?.message || 'Failed to update category') },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to delete category' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}

