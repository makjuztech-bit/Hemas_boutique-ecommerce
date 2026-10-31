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
  MapPin,
  ExternalLink,
  Printer,
  Loader2
} from 'lucide-react'

type OrderItem = {
  id: string
  quantity: number
  price: number
  salePrice: number | null
  productName: string
  sku: string
  variant?: {
    sku: string
    product?: {
      name: string
    }
  } | null
}

type Order = {
  id: string
  orderNumber: string
  status: string
  total: number
  paymentStatus: string
  createdAt: string
  shippingAddress: string
  courierName?: string | null
  trackingNumber?: string | null
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
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?scope=admin')
      if (!res.ok) {
        console.error('Failed to fetch orders:', res.status)
        return
      }
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (e) {
      console.error('Error fetching orders:', e)
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

  const handleShiprocketDispatch = async (orderId: string) => {
    setShippingId(orderId)
    setActionNotice(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch order with Shiprocket')
      }

      setActionNotice({
        type: 'success',
        message: `Shipment booked successfully! Courier: ${data.courierName || 'Shiprocket Partner'}, AWB: ${data.awbCode}`,
      })

      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank')
      }

      await fetchOrders()
    } catch (err: any) {
      console.error(err)
      setActionNotice({
        type: 'error',
        message: err.message || 'Error communicating with Shiprocket API',
      })
    } finally {
      setShippingId(null)
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

      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-zinc-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

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
                      {order.items.map((item) => {
                        const unitPrice = item.salePrice || item.price || 0
                        const itemTotal = unitPrice * item.quantity
                        const displayName = item.variant?.product?.name || item.productName || 'Ensemble Item'
                        const displaySku = item.variant?.sku || item.sku || ''

                        return (
                          <div key={item.id} className="flex justify-between">
                            <span>
                              {displayName} {displaySku ? `(SKU: ${displaySku})` : ''} × {item.quantity}
                            </span>
                            <span className="font-mono text-zinc-300">
                              {formatPrice(itemTotal)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Logistics & Shiprocket Dispatch Bar */}
                <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {order.trackingNumber ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-medium">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Courier: <strong>{order.courierName || 'Shiprocket Partner'}</strong></span>
                      </span>
                      <span className="text-zinc-400 font-mono">
                        AWB: <strong className="text-zinc-200">{order.trackingNumber}</strong>
                      </span>
                      <a
                        href={`https://shiprocket.co/tracking/${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Not dispatched with courier yet</span>
                    </div>
                  )}

                  {!order.trackingNumber && order.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      disabled={shippingId === order.id}
                      onClick={() => handleShiprocketDispatch(order.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {shippingId === order.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Booking Courier...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch via Shiprocket</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
