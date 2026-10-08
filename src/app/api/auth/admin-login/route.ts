import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import bcrypt from 'bcryptjs'
import { createSession } from '@/backend/auth/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Access denied: Staff or Admin credentials required' },
        { status: 403 }
      )
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    await createSession(user.id, user.role)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during admin login' },
      { status: 500 }
    )
  }
}
