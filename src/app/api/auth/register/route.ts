import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { createSession } from '@/backend/auth/session'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, mobileNumber, password } = await req.json()

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'First name, email, and password are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(mobileNumber ? [{ mobileNumber: mobileNumber.trim() }] : []),
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or mobile number already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || '',
        email: cleanEmail,
        mobileNumber: mobileNumber?.trim() || null,
        passwordHash,
        role: Role.CUSTOMER,
        emailVerified: new Date(),
      },
    })

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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to register account' },
      { status: 500 }
    )
  }
}
