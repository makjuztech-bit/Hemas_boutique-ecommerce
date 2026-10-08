'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

type Stats = {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  recentOrders: any[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Operational Overview
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Real-time metrics, revenue performance, and inventory health for Hema&apos;s Boutique.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500">Loading metrics...</div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Gross sales value</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total Orders</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{stats?.totalOrders || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-2">Customer purchases</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Active Products</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{stats?.totalProducts || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-2">Live catalog items</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Registered Customers</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{stats?.totalUsers || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-2">Shopper user base</p>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Recent Customer Orders</h2>
                <p className="text-xs text-zinc-400">Latest transactions received on the storefront</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Manage All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.recentOrders?.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No orders received yet. Place a test order from the storefront!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Order ID</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {stats?.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-800/30">
                        <td className="py-3.5 font-mono text-amber-400 font-bold">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 text-zinc-200">
                          {order.user?.firstName} {order.user?.lastName} ({order.user?.email})
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
