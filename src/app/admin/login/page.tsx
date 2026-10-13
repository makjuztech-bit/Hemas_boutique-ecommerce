'use client'

import React, { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUnauthorizedError = searchParams.get('error') === 'unauthorized'

  const [mode, setMode] = useState<'PASSWORD' | 'FORGOT_PASSWORD'>('PASSWORD')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // OTP Reset state
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const [error, setError] = useState(hasUnauthorizedError ? 'Staff or Admin privileges required to access control hub.' : '')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Admin authentication failed')
      }

      setSuccessMsg('Admin credentials authorized. Launching dashboard...')
      // Full browser navigation to bypass Next.js client router cache
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials')
      setLoading(false)
    }
  }

  const handleSendAdminOtp = async () => {
    if (!email.trim()) {
      setError('Please provide your admin staff email address')
      return
    }

    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: email.trim(),
          type: 'EMAIL',
          purpose: 'FORGOT_PASSWORD',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code')
      }

      setOtpSent(true)
      setCooldown(60)
      setSuccessMsg(data.message || 'Verification code sent to your email')
    } catch (err: any) {
      setError(err.message || 'Could not send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: email.trim(),
          type: 'EMAIL',
          otp: otpCode.trim(),
          purpose: 'FORGOT_PASSWORD',
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccessMsg('Password updated! Launching admin dashboard...')
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || 'Verification code is invalid or expired')
      setLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setMode('PASSWORD')
    setEmail('admin@hemasboutique.com')
    setPassword('Admin@123')
    setError('')
    setSuccessMsg('')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-zinc-950 text-zinc-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <BrandLogo size="lg" variant="dark" href="/admin" subtitle="Control Portal" />
        <p className="mt-3 text-xs text-zinc-400">
          Management &amp; Analytics Dashboard for Store Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          <div className="mb-6 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-white">
              {mode === 'PASSWORD' ? 'Admin Staff Portal' : 'Reset Admin Credentials'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === 'PASSWORD' 
                ? 'Authorized boutique personnel & super administrator access only.'
                : 'Receive a secure 6-digit code via email to configure a new password.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'PASSWORD' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Admin Staff Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hemasboutique.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('FORGOT_PASSWORD'); setError(''); setSuccessMsg(''); setOtpSent(false); }}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
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
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-md shadow-amber-500/10 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating Admin...</span>
                ) : (
                  <>
                    <span>Unlock Admin Operations</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    disabled={otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hemasboutique.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendAdminOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? <span>Sending Code...</span> : <span>Send 6-Digit Verification Code</span>}
                </button>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={handleSendAdminOtp}
                        disabled={cooldown > 0 || loading}
                        className="text-[11px] text-amber-400 hover:underline disabled:text-zinc-600 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? 'animate-spin' : ''}`} />
                        <span>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono tracking-widest text-center text-base font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      New Security Password (min 6 chars)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? <span>Verifying...</span> : <span>Update Password &amp; Open Admin</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Use Different Email
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setMode('PASSWORD'); setError(''); setSuccessMsg(''); }}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 pt-2"
              >
                Back to Standard Password Login
              </button>
            </form>
          )}

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-[11px] font-medium text-amber-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Super Admin Credentials (admin@hemasboutique.com)</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Boutique</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">Loading admin portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
