import { NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'

export async function GET() {
  const startTime = Date.now()
  let dbStatus = 'disconnected'

  try {
    // Bounded database health check
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000)),
    ])
    dbStatus = 'connected'
  } catch (err: any) {
    dbStatus = 'unhealthy'
    console.error('Health check database probe failed:', err?.message || err)
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
      responseTimeMs,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  )
}
