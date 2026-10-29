'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Users,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Skip fetching user on the login page
    if (pathname === '/admin/login') return

    async function loadAdminUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/admin/login')
          return
        }
        const data = await res.json()
        if (data.user && (data.user.role === 'SUPER_ADMIN' || data.user.role === 'STAFF')) {
          setAdminUser(data.user)
        } else {
          router.push('/admin/login')
        }
      } catch (e) {
        console.error('Failed to authenticate admin session:', e)
        router.push('/admin/login')
      }
    }
    loadAdminUser()
  }, [pathname, router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Storefront & Banners', href: '/admin/storefront', icon: Sparkles },
    { name: 'Products & Inventory', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Customer Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Registered Users', href: '/admin/users', icon: Users },
  ]

  // Don't wrap admin login page with admin sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900 border-b border-zinc-800 px-4 h-16 flex items-center justify-between">
        <BrandLogo size="sm" variant="dark" href="/admin" subtitle="Admin Control" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col justify-between transform transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="mb-8">
            <BrandLogo size="md" variant="dark" href="/admin" subtitle="Control Hub" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-zinc-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {adminUser && (
            <div className="px-3 py-2 bg-zinc-800/50 rounded-xl">
              <p className="text-[11px] font-bold text-zinc-200 truncate">
                {adminUser.firstName} {adminUser.lastName}
              </p>
              <p className="text-[10px] text-amber-400 font-mono">{adminUser.role}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
