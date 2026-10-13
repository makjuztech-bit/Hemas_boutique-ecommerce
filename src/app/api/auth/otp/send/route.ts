import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { sendOtpEmail, sendOtpSms } from '@/lib/comms'
import { z } from 'zod'

const sendOtpSchema = z.object({
  target: z.string().min(3, 'Email or phone number is required'),
  type: z.enum(['EMAIL', 'MOBILE']),
  purpose: z.enum(['LOGIN', 'FORGOT_PASSWORD', 'VERIFY_CONTACT']).default('LOGIN'),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const rate = checkRateLimit(req, 10, 60 * 1000, 'auth-otp-send')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = sendOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { target, type, purpose } = parsed.data
    const normalizedTarget = target.trim().toLowerCase()

    // If purpose is FORGOT_PASSWORD, check if user exists
    let existingUser = null
    if (type === 'EMAIL') {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedTarget },
      })
    } else {
      const cleanPhone = normalizedTarget.replace(/[^0-9]/g, '')
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mobileNumber: cleanPhone },
            { mobileNumber: `+91${cleanPhone}` },
            { mobileNumber: cleanPhone.replace(/^91/, '') }
          ]
        }
      })
    }

    if (purpose === 'FORGOT_PASSWORD' && !existingUser) {
      return NextResponse.json(
        { error: `No registered account found for this ${type === 'EMAIL' ? 'email address' : 'mobile number'}` },
        { status: 404 }
      )
    }

    // Generate secure 6-digit OTP
    const otpNumber = crypto.randomInt(100000, 999999).toString()
    const otpHash = await bcrypt.hash(otpNumber, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    if (type === 'EMAIL') {
      // Store in EmailOtpChallenge
      await prisma.emailOtpChallenge.create({
        data: {
          email: normalizedTarget,
          otpHash,
          purpose,
          expiresAt,
          userId: existingUser?.id || null,
        },
      })

      const sendRes = await sendOtpEmail({
        to: normalizedTarget,
        otp: otpNumber,
        purpose,
        name: existingUser?.firstName || 'Valued Guest',
      })

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${normalizedTarget}`,
        // In local development, also return demo hint if email provider is in sandbox
        demoOtp: process.env.NODE_ENV !== 'production' ? otpNumber : undefined,
      })
    } else {
      // Mobile SMS OTP
      const cleanPhone = normalizedTarget.replace(/[^0-9]/g, '')
      const msg91RequestId = `req_${Date.now()}_${Math.floor(Math.random() * 10000)}`

      await prisma.mobileOtpAttempt.create({
        data: {
          mobileNumber: cleanPhone,
          msg91RequestId,
          purpose,
          status: 'PENDING',
          userId: existingUser?.id || null,
        },
      })

      // Also store challenge for local verification fallback
      await prisma.emailOtpChallenge.create({
        data: {
          email: `phone_${cleanPhone}@mobile.local`,
          otpHash,
          purpose,
          expiresAt,
          userId: existingUser?.id || null,
        },
      })

      await sendOtpSms({
        mobile: cleanPhone,
        otp: otpNumber,
        purpose,
      })

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${cleanPhone}`,
        demoOtp: process.env.NODE_ENV !== 'production' ? otpNumber : undefined,
      })
    }
  } catch (error: any) {
    console.error('Send OTP route error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch verification code' },
      { status: 500 }
    )
  }
}
