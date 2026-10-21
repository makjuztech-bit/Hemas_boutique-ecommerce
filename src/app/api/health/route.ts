import { NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'

export async function GET() {
  const startTime = Date.now()
  let dbStatus = 'disconnected'

  let dbError: string | null = null

  try {
    // Bounded database health check
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000)),
    ])
    dbStatus = 'connected'
  } catch (err: any) {
    dbStatus = 'unhealthy'
    dbError = err?.message || String(err)
    console.error('Health check database probe failed:', dbError)
  }

  const isHealthy = dbStatus === 'connected'
  const responseTimeMs = Date.now() - startTime

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      services: {
        database: dbStatus,
        api: 'operational',
      },
      error: dbError,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      responseTimeMs,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  )
}
