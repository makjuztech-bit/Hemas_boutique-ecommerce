import { NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'

export async function GET() {
  try {
    await requireAdmin()

    const [totalUsers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isArchived: false } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
    ])

    const totalRevenue = revenueAgg._sum.total || 0

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
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to fetch admin stats' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}
