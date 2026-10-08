import { NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { getSession } from '@/backend/auth/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isArchived: false } }),
      prisma.order.count(),
      prisma.order.findMany({
        select: { total: true },
      }),
    ])

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
