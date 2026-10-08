'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles
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
      media: Array<{ mediaAsset: { secureUrl: string } }>
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
  items: OrderItem[]
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders')
        const data = await res.json()
        if (data.orders) setOrders(data.orders)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        )
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Dispatched &amp; In Transit
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Processing &amp; Packaging
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2D2421]">
      <header className="bg-white border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[#8A1A38] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold text-[#8A1A38]">Back to Storefront</span>
          </Link>

          <Link href="/" className="font-serif text-xl font-bold text-[#4A1525]">
            Hema&apos;s Boutique
          </Link>

          <div className="w-24"></div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#8A1A38]/10 flex items-center justify-center text-[#8A1A38]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B1522]">
              My Boutique Orders
            </h1>
            <p className="text-xs text-[#7A6458]">Track order history and shipping status</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-[#7A6458]">Fetching orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#EADBCE] p-8 shadow-xs">
            <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-[#3B1522]">No orders placed yet</h2>
            <p className="text-xs text-[#7A6458] mt-1 mb-6">
              When you place an order for our sarees or lehengas, it will show up here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#8A1A38] text-white px-6 py-3 rounded-xl font-semibold text-xs shadow-md hover:bg-[#6D152D] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Collection</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              let parsedAddress: any = null
              try {
                parsedAddress = JSON.parse(order.shippingAddress)
              } catch (e) {}

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#EADBCE] shadow-xs overflow-hidden"
                >
                  <div className="bg-[#FAF4EC] p-4 sm:p-6 border-b border-[#EADBCE] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A1A38] tracking-wider">
                        Order #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <span className="font-serif text-lg font-bold text-[#3B1522]">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    {order.items.map((item) => {
                      const img =
                        item.variant.product.media[0]?.mediaAsset?.secureUrl ||
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'

                      return (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={img}
                            alt={item.variant.product.name}
                            className="w-16 h-20 object-cover rounded-xl bg-[#F5EFE8]"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-[#3B1522] truncate">
                              {item.variant.product.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              SKU: {item.variant.sku}
                            </p>
                            <p className="text-xs text-[#8A1A38] font-semibold mt-1">
                              Qty: {item.quantity} × {formatPrice(item.unitPrice)} = {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {parsedAddress && (
                      <div className="mt-4 pt-4 border-t border-[#F2E8DF] text-xs text-zinc-600">
                        <span className="font-semibold text-zinc-900">Delivering to: </span>
                        {parsedAddress.fullName}, {parsedAddress.street}, {parsedAddress.city},{' '}
                        {parsedAddress.state} - {parsedAddress.postalCode} (Ph: {parsedAddress.phone})
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
