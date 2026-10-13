'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react'

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

      // Successful login -> Redirect to shopping store
      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCustomer = () => {
    setEmail('customer@hemasboutique.com')
    setPassword('Customer@123')
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
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-2xl shadow-[#8A2440]/10 rounded-2xl border border-[#F0E4D8] sm:px-10">
          <div className="mb-6 border-b border-[#F5E8DC] pb-4">
            <h2 className="text-xl font-semibold text-[#3C1824]">Customer Sign In</h2>
            <p className="text-xs text-[#8A7268] mt-1">
              Please sign in to access the exclusive catalog and begin shopping.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="yourname@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D5C2B4] text-xs focus:outline-none focus:ring-2 focus:ring-[#982245]"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-zinc-700">Password</label>
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

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#F5E8DC]">
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#8A1A38] bg-[#FDF2F4] hover:bg-[#FCE8ED] rounded-lg border border-[#F5D5DC] transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Fill Demo Customer Account (Priya Sharma)
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-center text-xs text-[#7A6458]">
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#8A1A38] hover:underline">
                Create Account
              </Link>
            </div>
            <div className="pt-2 border-t border-[#F5E8DC]">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1 font-medium text-zinc-500 hover:text-zinc-800"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal Login
              </Link>
            </div>
          </div>
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
