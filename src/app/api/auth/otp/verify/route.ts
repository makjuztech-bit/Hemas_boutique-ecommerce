import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getSession } from '@/backend/auth/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { z } from 'zod'

const verifyOtpSchema = z.object({
  target: z.string().min(3, 'Email or phone number is required'),
  type: z.enum(['EMAIL', 'MOBILE']),
  otp: z.string().min(4, 'OTP must be at least 4 digits'),
  purpose: z.enum(['LOGIN', 'FORGOT_PASSWORD', 'VERIFY_CONTACT']).default('LOGIN'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    const rate = checkRateLimit(req, 15, 60 * 1000, 'auth-otp-verify')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait 1 minute.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = verifyOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { target, type, otp, purpose, newPassword } = parsed.data
    const normalizedTarget = target.trim().toLowerCase()
    const cleanPhone = normalizedTarget.replace(/[^0-9]/g, '')

    const challengeTarget = type === 'EMAIL' ? normalizedTarget : `phone_${cleanPhone}@mobile.local`

    // Find the latest non-expired challenge for this target & purpose
    const challenge = await prisma.emailOtpChallenge.findFirst({
      where: {
        email: challengeTarget,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!challenge) {
      return NextResponse.json(
        { error: 'OTP has expired or no pending verification request found. Please request a new code.' },
        { status: 400 }
      )
    }

    if (challenge.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a fresh OTP.' },
        { status: 429 }
      )
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(otp.trim(), challenge.otpHash)
    if (!isValid) {
      await prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and re-enter.' },
        { status: 400 }
      )
    }

    // Mark challenge as verified
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { verified: true },
    })

    // Find or create associated user
    let user = null
    if (type === 'EMAIL') {
      user = await prisma.user.findUnique({
        where: { email: normalizedTarget },
      })
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobileNumber: cleanPhone },
            { mobileNumber: `+91${cleanPhone}` },
            { mobileNumber: cleanPhone.replace(/^91/, '') }
          ]
        }
      })
    }

    // HANDLE FORGOT PASSWORD
    if (purpose === 'FORGOT_PASSWORD') {
      if (!newPassword) {
        return NextResponse.json(
          { error: 'Please provide your new password' },
          { status: 400 }
        )
      }

      if (!user) {
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 404 }
        )
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          emailVerified: type === 'EMAIL' ? new Date() : user.emailVerified,
          mobileVerified: type === 'MOBILE' ? new Date() : user.mobileVerified,
        },
      })

      await createSession(updatedUser.id, updatedUser.role)

      return NextResponse.json({
        success: true,
        message: 'Password successfully reset! You are now logged in.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
      })
    }

    // HANDLE CONTACT VERIFICATION
    if (purpose === 'VERIFY_CONTACT') {
      const currentSession = await getSession()
      const targetUserId = currentSession?.userId || user?.id

      if (targetUserId) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            emailVerified: type === 'EMAIL' ? new Date() : undefined,
            mobileVerified: type === 'MOBILE' ? new Date() : undefined,
            ...(type === 'MOBILE' && { mobileNumber: cleanPhone }),
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: `${type === 'EMAIL' ? 'Email' : 'Mobile number'} verified successfully!`,
      })
    }

    // HANDLE OTP LOGIN
    if (purpose === 'LOGIN') {
      // If user does not exist yet, auto-provision as customer with verified contact
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: type === 'EMAIL' ? normalizedTarget : null,
            emailVerified: type === 'EMAIL' ? new Date() : null,
            mobileNumber: type === 'MOBILE' ? cleanPhone : null,
            mobileVerified: type === 'MOBILE' ? new Date() : null,
            firstName: type === 'EMAIL' ? normalizedTarget.split('@')[0] : 'Patron',
            role: 'CUSTOMER',
          },
        })
      } else {
        // Mark contact as verified on successful login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: type === 'EMAIL' ? new Date() : user.emailVerified,
            mobileVerified: type === 'MOBILE' ? new Date() : user.mobileVerified,
          },
        })
      }

      await createSession(user.id, user.role)

      return NextResponse.json({
        success: true,
        message: 'Successfully signed in via OTP',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: error?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
