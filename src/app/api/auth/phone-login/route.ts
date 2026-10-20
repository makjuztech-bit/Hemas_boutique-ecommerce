import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { createSession } from '@/backend/auth/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { z } from 'zod'

import { jwtVerify, createRemoteJWKSet } from 'jose'

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hemasboutique-fc61c'
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

const phoneLoginSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid mobile number is required'),
  idToken: z.string().min(10, 'Valid Firebase authentication token is required'),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const rate = checkRateLimit(req, 15, 60 * 1000, 'auth-phone-login')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait 1 minute.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = phoneLoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phoneNumber, idToken } = parsed.data
    // Normalize phone number (strip spaces, symbols, leading +91 or 0)
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '')
    const tenDigitPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits

    if (tenDigitPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }

    // Cryptographically verify Google Firebase ID Token
    try {
      const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      })
      const tokenPhone = ((payload.phone_number as string) || '').replace(/[^0-9]/g, '')
      if (!tokenPhone.endsWith(tenDigitPhone)) {
        return NextResponse.json(
          { error: 'Phone number does not match verified Google token' },
          { status: 401 }
        )
      }
    } catch (tokenErr: any) {
      console.warn('[SECURITY] Invalid Firebase ID Token for phone login:', tokenErr?.message)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired phone verification token' },
        { status: 401 }
      )
    }

    // Find existing user by mobile variations
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: tenDigitPhone },
          { mobileNumber: `+91${tenDigitPhone}` },
          { mobileNumber: `91${tenDigitPhone}` },
        ],
      },
    })

    if (!user) {
      // Auto-provision new customer account for verified phone number
      user = await prisma.user.create({
        data: {
          mobileNumber: tenDigitPhone,
          mobileVerified: new Date(),
          firstName: 'Boutique Patron',
          role: 'CUSTOMER',
        },
      })
    } else {
      // Ensure mobileVerified is up-to-date
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          mobileVerified: new Date(),
        },
      })
    }

    // Create secure HTTP-only session cookie
    await createSession(user.id, user.role)

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully. Welcome to Hema\'s Boutique!',
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Phone login error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to authenticate mobile user' },
      { status: 500 }
    )
  }
}
