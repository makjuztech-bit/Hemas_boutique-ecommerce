import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession } from '@/backend/auth/session'

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
    const session = await getSession()
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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
    return NextResponse.json({ error: error?.message || 'Failed to create category' }, { status: 500 })
  }
}
