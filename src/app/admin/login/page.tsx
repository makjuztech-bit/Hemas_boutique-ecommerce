'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUnauthorizedError = searchParams.get('error') === 'unauthorized'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(hasUnauthorizedError ? 'Staff or Admin credentials required' : '')
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Admin login failed')
      }

      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setEmail('admin@hemasboutique.com')
    setPassword('Admin@123')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-zinc-950 text-zinc-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black shadow-lg mb-3">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Boutique Admin Portal
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Management &amp; Analytics Dashboard for Store Operations
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-zinc-800 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Admin Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hemasboutique.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700 rounded-xl text-sm bg-zinc-800/80 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700 rounded-xl text-sm bg-zinc-800/80 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 transition-all cursor-pointer shadow-md"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fill Admin Demo credentials */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 rounded-lg border border-amber-800/50 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Fill Super Admin Credentials (Hema Admin)
            </button>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Customer Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
