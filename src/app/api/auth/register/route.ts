import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { createSession } from '@/backend/auth/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional().default(''),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().min(10, 'Mobile number must be at least 10 digits').optional()
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const rate = checkRateLimit(req, 5, 60 * 1000, 'auth-register')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many account creation attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, mobileNumber, password } = parsed.data
    const cleanEmail = email.toLowerCase().trim()
    const rawDigits = mobileNumber ? mobileNumber.replace(/[^0-9]/g, '') : null
    const cleanMobile = rawDigits ? (rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits) : null

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanMobile
            ? [
                { mobileNumber: cleanMobile },
                { mobileNumber: `+91${cleanMobile}` },
                { mobileNumber: `91${cleanMobile}` },
              ]
            : []),
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or mobile number already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || '',
        email: cleanEmail,
        mobileNumber: cleanMobile,
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
      { error: 'Failed to complete registration. Please try again.' },
      { status: 500 }
    )
  }
}
