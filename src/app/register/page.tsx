'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Successful registration -> session created, redirect to shopping store
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-[#FAF7F2] via-[#FFF9F5] to-[#F5EFE6] text-[#2C2420] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#982245] to-[#C94A6E] text-white shadow-lg mb-3">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#4A1525]">
          Join Hema&apos;s Boutique
        </h1>
        <p className="mt-1 text-xs text-[#7A6458]">
          Create your account for personalized shopping, bridal consultations &amp; express checkout
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-2xl shadow-[#8A2440]/10 rounded-2xl border border-[#F0E4D8] sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A453D] mb-1">
                  First Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <User className="h-3.5 w-3.5 text-[#982245]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Priya"
                    className="block w-full pl-8 pr-2.5 py-2 border border-[#E8DACD] rounded-lg text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#982245]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A453D] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Sharma"
                  className="block w-full px-3 py-2 border border-[#E8DACD] rounded-lg text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#982245]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A453D] mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-3.5 w-3.5 text-[#982245]" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="priya@example.com"
                  className="block w-full pl-8 pr-3 py-2 border border-[#E8DACD] rounded-lg text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#982245]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A453D] mb-1">
                Mobile Number
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="h-3.5 w-3.5 text-[#982245]" />
                </div>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="block w-full pl-8 pr-3 py-2 border border-[#E8DACD] rounded-lg text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#982245]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A453D] mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-3.5 w-3.5 text-[#982245]" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="block w-full pl-8 pr-3 py-2 border border-[#E8DACD] rounded-lg text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#982245]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-[#8A1A38] to-[#A8284C] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#982245] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Register &amp; Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#7A6458]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#8A1A38] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
