'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles
} from 'lucide-react'

type CartItem = {
  id: string
  quantity: number
  variant: {
    id: string
    sku: string
    price: number
    salePrice: number | null
    stockQuantity: number
    product: {
      id: string
      name: string
      slug: string
      media: Array<{
        mediaAsset: { secureUrl: string }
      }>
    }
  }
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      if (data.items) {
        setItems(data.items)
      }
    } catch (e) {
      console.error('Error fetching cart:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const updateQuantity = async (id: string, newQty: number) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQty }),
      })
      if (res.ok) {
        await fetchCart()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/cart?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCart()
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

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.variant.salePrice || item.variant.price
    return acc + unitPrice * item.quantity
  }, 0)

  const tax = Math.round(subtotal * 0.05) // 5% GST
  const shipping = subtotal > 200000 || subtotal === 0 ? 0 : 15000 // Free above ₹2,000
  const grandTotal = subtotal + tax + shipping

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2D2421]">
      {/* Header */}
      <header className="bg-white border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[#8A1A38] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold text-[#8A1A38]">Continue Shopping</span>
          </Link>

          <Link href="/" className="font-serif text-xl font-bold text-[#4A1525]">
            Hema&apos;s Boutique
          </Link>

          <div className="w-24"></div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#8A1A38]/10 flex items-center justify-center text-[#8A1A38]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B1522]">
              Shopping Bag
            </h1>
            <p className="text-xs text-[#7A6458]">
              {items.length} {items.length === 1 ? 'creation' : 'creations'} in your bag
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-[#7A6458]">Loading your bag...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#EADBCE] max-w-md mx-auto p-8 shadow-xs">
            <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-[#3B1522]">Your bag is empty</h2>
            <p className="text-xs text-[#7A6458] mt-1 mb-6">
              Discover our handcrafted silk sarees and royal couture to fill your bag.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#8A1A38] text-white px-6 py-3 rounded-xl font-semibold text-xs shadow-md hover:bg-[#6D152D] transition-colors"
            >
              <span>Explore Boutique Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const variant = item.variant
                const unitPrice = variant.salePrice || variant.price
                const itemTotal = unitPrice * item.quantity
                const img =
                  variant.product.media[0]?.mediaAsset?.secureUrl ||
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EADBCE] shadow-xs flex gap-4 sm:gap-6 items-center justify-between"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                      <img
                        src={img}
                        alt={variant.product.name}
                        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl bg-[#F5EFE8] flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-base font-bold text-[#3B1522] truncate">
                          {variant.product.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          SKU: {variant.sku}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-bold text-[#8A1A38]">
                            {formatPrice(unitPrice)}
                          </span>
                          {variant.salePrice && (
                            <span className="text-xs text-zinc-400 line-through">
                              {formatPrice(variant.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity adjust */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-[#E0D0C2] rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updatingId === item.id}
                              className="p-1.5 text-zinc-600 hover:text-black cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={
                                updatingId === item.id || item.quantity >= variant.stockQuantity
                              }
                              className="p-1.5 text-zinc-600 hover:text-black cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updatingId === item.id}
                            className="text-xs text-red-600 hover:text-red-800 p-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-[#3B1522]">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-md sticky top-24">
              <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-3 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs text-[#5A453D]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (5%)</span>
                  <span className="font-semibold text-zinc-800">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#8A1A38]" />
                    <span>Shipping</span>
                  </span>
                  <span className="font-semibold text-zinc-800">
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase">Free</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#F0E4D8] flex justify-between items-baseline text-base font-bold text-[#3B1522]">
                  <span>Grand Total</span>
                  <span className="text-xl text-[#8A1A38]">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8A1A38] to-[#A8284C] hover:opacity-95 shadow-lg shadow-[#8A1A38]/20 transition-all"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-4 pt-4 border-t border-[#F5E8DC] text-[11px] text-[#7A6458] space-y-2">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit SSL Encrypted Checkout</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quality Assured Handloom Weaves</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
