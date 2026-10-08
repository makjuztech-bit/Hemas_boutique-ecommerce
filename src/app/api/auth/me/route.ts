import { NextResponse } from 'next/server'
import { deleteSession, getSession } from '@/backend/auth/session'
import prisma from '@/backend/db/prisma'

export async function POST() {
  await deleteSession()
  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      mobileNumber: true,
    },
  })

  return NextResponse.json({ user })
}
