import { NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { DEFAULT_STOREFRONT_CONFIG } from '@/lib/storefrontConfig'

export async function GET() {
  try {
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
    console.error('Fetch storefront banners error:', error)
    return NextResponse.json({ config: DEFAULT_STOREFRONT_CONFIG })
  }
}
