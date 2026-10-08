'use client'

import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  User,
  MapPin
} from 'lucide-react'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variant: {
    sku: string
    product: {
      name: string
    }
  }
}

type Order = {
  id: string
  orderNumber: string
  status: string
  total: number
  paymentStatus: string
  createdAt: string
  shippingAddress: string
  user: {
    firstName: string | null
    lastName: string | null
    email: string | null
    mobileNumber: string | null
  }
  items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?scope=admin')
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (res.ok) {
        await fetchOrders()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Customer Orders Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review placed orders, verify delivery details, and update dispatch/fulfillment stages.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No customer orders yet</p>
          <p className="text-xs text-zinc-500 mt-1">
            Orders placed on the storefront will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            let address: any = null
            try {
              address = JSON.parse(order.shippingAddress)
            } catch (e) {}

            return (
              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xs transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-base text-white">
                      {formatPrice(order.total)}
                    </span>

                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="bg-zinc-800 text-amber-300 font-semibold text-xs border border-zinc-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Customer & Address Details */}
                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                    <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Customer: {order.user.firstName} {order.user.lastName} ({order.user.email})</span>
                    </p>
                    {address && (
                      <p className="text-zinc-400 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {address.fullName}, {address.street}, {address.city}, {address.state} -{' '}
                          {address.postalCode} | Phone: {address.phone}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Items Ordered */}
                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                    <p className="font-semibold text-zinc-300">Ensemble Items:</p>
                    <div className="space-y-1 text-zinc-400">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.variant.product.name} (SKU: {item.variant.sku}) × {item.quantity}
                          </span>
                          <span className="font-mono text-zinc-300">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
