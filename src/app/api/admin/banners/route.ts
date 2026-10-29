import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { DEFAULT_STOREFRONT_CONFIG } from '@/lib/storefrontConfig'

export async function GET() {
  try {
    await requireAdmin()

    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'storefront_banners' },
    })

    if (!setting || !setting.value) {
      return NextResponse.json({ config: DEFAULT_STOREFRONT_CONFIG })
    }

    try {
      const parsed = JSON.parse(setting.value)
      return NextResponse.json({ config: parsed })
    } catch {
      return NextResponse.json({ config: DEFAULT_STOREFRONT_CONFIG })
    }
  } catch (error: any) {
    console.error('Admin fetch banners error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to fetch banners' },
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

    const body = await req.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 })
    }

    // Persist to database in SiteSettings
    const updated = await prisma.siteSettings.upsert({
      where: { key: 'storefront_banners' },
      update: {
        value: JSON.stringify(config),
      },
      create: {
        key: 'storefront_banners',
        value: JSON.stringify(config),
      },
    })

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('Update banners error:', error)
    return NextResponse.json(
      { error: error?.message === 'FORBIDDEN' ? 'Access denied' : 'Failed to update storefront settings' },
      { status: error?.message === 'FORBIDDEN' ? 403 : 500 }
    )
  }
}
