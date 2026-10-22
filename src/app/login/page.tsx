'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { Sparkles, Lock, Mail, Phone, ArrowRight, ShieldCheck, UserCheck, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react'

type AuthMode = 'PASSWORD' | 'OTP' | 'FORGOT_PASSWORD'

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  const [mode, setMode] = useState<AuthMode>('PASSWORD')
  
  // Password Mode state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // OTP & Forgot Password state
  const [otpTarget, setOtpTarget] = useState('')
  const [targetType, setTargetType] = useState<'EMAIL' | 'MOBILE'>('EMAIL')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Handle standard password sign in
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setSuccessMsg('Authentication successful! Opening boutique...')
      // Full authoritative navigation to prevent Next.js client router cache stall
      window.location.href = redirectUrl
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  // Firebase Phone Auth confirmation result
  const [confirmationResult, setConfirmationResult] = useState<any>(null)

  // Send OTP for OTP-login or Password Reset
  const handleSendOtp = async () => {
    if (!otpTarget.trim()) {
      setError(`Please provide your ${targetType === 'EMAIL' ? 'email address' : 'mobile number'}`)
      return
    }

    setError('')
    setSuccessMsg('')
    setLoading(true)

    // Try Google Firebase Phone Auth for MOBILE
    let fbHandled = false
    if (targetType === 'MOBILE' && mode === 'OTP') {
      try {
        const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await import('@/lib/firebase/client')
        
        // Format to E.164 (+91 for 10-digit Indian numbers)
        const cleanDigits = otpTarget.trim().replace(/[^0-9]/g, '')
        const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : otpTarget.startsWith('+') ? otpTarget.trim() : `+${cleanDigits}`

        // Initialize invisible RecaptchaVerifier
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          })
        }

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier)
        setConfirmationResult(confirmation)
        setOtpSent(true)
        setResendCooldown(60)
        setSuccessMsg(`SMS verification code dispatched to ${formattedPhone} via Google Firebase!`)
        setLoading(false)
        fbHandled = true
        return
      } catch (fbErr: any) {
        console.warn('[FIREBASE_PHONE] Firebase SMS failed, falling back to boutique OTP engine:', fbErr?.code || fbErr?.message)
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear()
          } catch {}
          (window as any).recaptchaVerifier = null
        }
        setConfirmationResult(null)
        // Seamlessly continue to the backend boutique OTP engine below
      }
    }

    // Default / Fallback API OTP dispatch
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: otpTarget.trim(),
          type: targetType,
          purpose: mode === 'FORGOT_PASSWORD' ? 'FORGOT_PASSWORD' : 'LOGIN',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code')
      }

      setOtpSent(true)
      setResendCooldown(60)
      if (data.demoOtp) {
        setSuccessMsg(`${data.message} (Test OTP: ${data.demoOtp})`)
      } else {
        setSuccessMsg(data.message || 'Verification code sent!')
      }
    } catch (err: any) {
      setError(err.message || 'Could not send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP for Login or Password Reset
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code')
      return
    }

    if (mode === 'FORGOT_PASSWORD' && (!newPassword || newPassword.length < 6)) {
      setError('Your new password must be at least 6 characters long')
      return
    }

    setLoading(true)

    // Handle Firebase Phone Confirmation if active
    if (targetType === 'MOBILE' && confirmationResult && mode === 'OTP') {
      try {
        const userCredential = await confirmationResult.confirm(otpCode.trim())
        const idToken = await userCredential.user.getIdToken()

        const res = await fetch('/api/auth/phone-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: userCredential.user.phoneNumber || otpTarget,
            idToken,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Phone authentication failed')
        }

        setSuccessMsg(data.message || 'Authentication successful! Directing to store...')
        window.location.href = redirectUrl
        return
      } catch (fbVerifyErr: any) {
        console.warn('[FIREBASE_VERIFY] Failed confirmation:', fbVerifyErr)
        // Fallback to standard verification if user used local OTP
      }
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: otpTarget.trim(),
          type: targetType,
          otp: otpCode.trim(),
          purpose: mode === 'FORGOT_PASSWORD' ? 'FORGOT_PASSWORD' : 'LOGIN',
          newPassword: mode === 'FORGOT_PASSWORD' ? newPassword : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccessMsg(data.message || 'Verification complete! Directing to store...')
      // Full authoritative navigation
      window.location.href = redirectUrl
    } catch (err: any) {
      setError(err.message || 'Verification code is invalid or expired')
      setLoading(false)
    }
  }

  const fillDemoCustomer = () => {
    setMode('PASSWORD')
    setEmail('customer@hemasboutique.com')
    setPassword('Customer@123')
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-[#FAF7F2] via-[#FFF9F5] to-[#F5EFE6] text-[#2C2420] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <BrandLogo size="lg" variant="light" href="/" subtitle="Women's Tex Valley" />
        <p className="mt-3 text-xs text-[#7A6458]">
          Exclusive Handcrafted Sarees, Bridal Lehengas &amp; Ethnic Couture
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/85 backdrop-blur-md py-8 px-6 shadow-2xl shadow-[#8A2440]/10 rounded-2xl border border-[#F0E4D8] sm:px-10">
          
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#F0E4D8] mb-6">
            <button
              type="button"
              onClick={() => { setMode('PASSWORD'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-colors border-b-2 ${
                mode === 'PASSWORD'
                  ? 'border-[#8A1A38] text-[#8A1A38]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('OTP'); setError(''); setSuccessMsg(''); setOtpSent(false); }}
              className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                mode === 'OTP'
                  ? 'border-[#8A1A38] text-[#8A1A38]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant OTP Login</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#3C1824]">
              {mode === 'PASSWORD' && 'Customer Sign In'}
              {mode === 'OTP' && 'Instant OTP Sign In'}
              {mode === 'FORGOT_PASSWORD' && 'Reset Your Password'}
            </h2>
            <p className="text-xs text-[#8A7268] mt-1">
              {mode === 'PASSWORD' && 'Sign in with your email and password to access your boutique cart.'}
              {mode === 'OTP' && 'No password needed. Receive a one-time code to your email or mobile phone.'}
              {mode === 'FORGOT_PASSWORD' && 'Verify your identity via 6-digit OTP to set a new password.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: PASSWORD LOGIN */}
          {mode === 'PASSWORD' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patron@hemasboutique.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-xs focus:outline-none focus:ring-2 focus:ring-[#982245]"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('FORGOT_PASSWORD'); setError(''); setSuccessMsg(''); setOtpSent(false); }}
                    className="text-[11px] font-medium text-[#8A1A38] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-xs focus:outline-none focus:ring-2 focus:ring-[#982245]"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-[#8A1A38] via-[#A8284C] to-[#8A1A38] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#982245] disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In &amp; Begin Shopping</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2 & 3: OTP LOGIN OR FORGOT PASSWORD */}
          {(mode === 'OTP' || mode === 'FORGOT_PASSWORD') && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Channel Selector: Email vs Phone */}
              {!otpSent && (
                <div className="grid grid-cols-2 gap-2 bg-[#F7F2EC] p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('EMAIL')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      targetType === 'EMAIL'
                        ? 'bg-white shadow-sm text-[#8A1A38]'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('MOBILE')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      targetType === 'MOBILE'
                        ? 'bg-white shadow-sm text-[#8A1A38]'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>SMS OTP (Mobile)</span>
                  </button>
                </div>
              )}

              {/* Target Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {targetType === 'EMAIL' ? 'Registered Email Address' : '10-Digit Mobile Number'}
                </label>
                <div className="relative">
                  <input
                    type={targetType === 'EMAIL' ? 'email' : 'tel'}
                    required
                    disabled={otpSent}
                    value={otpTarget}
                    onChange={(e) => setOtpTarget(e.target.value)}
                    placeholder={targetType === 'EMAIL' ? 'patron@hemasboutique.com' : '9876543210'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-xs focus:outline-none focus:ring-2 focus:ring-[#982245] disabled:bg-zinc-100"
                  />
                  {targetType === 'EMAIL' ? (
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  ) : (
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  )}
                </div>
              </div>

              {/* Request OTP Button */}
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-[#8A1A38] via-[#A8284C] to-[#8A1A38] hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? <span>Sending Code...</span> : <span>Send Verification Code</span>}
                </button>
              ) : (
                <>
                  {/* Enter OTP Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={resendCooldown > 0 || loading}
                        className="text-[11px] text-[#8A1A38] hover:underline disabled:text-zinc-400 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                        <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-center font-mono tracking-widest text-base font-bold text-[#8A1A38] focus:outline-none focus:ring-2 focus:ring-[#982245]"
                      />
                      <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  {/* If in FORGOT PASSWORD mode, ask for New Password */}
                  {mode === 'FORGOT_PASSWORD' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Choose New Password (min 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-xs focus:outline-none focus:ring-2 focus:ring-[#982245]"
                        />
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-[#8A1A38] via-[#A8284C] to-[#8A1A38] hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <span>Verifying...</span>
                    ) : mode === 'FORGOT_PASSWORD' ? (
                      <span>Reset Password &amp; Enter Store</span>
                    ) : (
                      <span>Verify Code &amp; Sign In</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Change Email / Mobile Number
                  </button>
                </>
              )}
            </form>
          )}

          {/* Quick Demo Credentials (Development only) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 pt-5 border-t border-[#F5E8DC]">
              <button
                type="button"
                onClick={fillDemoCustomer}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#8A1A38] bg-[#FDF2F4] hover:bg-[#FCE8ED] rounded-lg border border-[#F5D5DC] transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Fill Demo Customer Account (Priya Sharma)
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 text-center text-xs text-[#7A6458]">
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#8A1A38] hover:underline">
                Create Account
              </Link>
            </div>
            {/* Admin portal login is only accessible via the admin backend URL */}
          </div>

          {/* Invisible Google Firebase Recaptcha Container */}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs text-[#7A6458]">Loading royal boutique sign-in...</div>}>
      <CustomerLoginForm />
    </Suspense>
  )
}
