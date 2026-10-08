'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  Truck,
  CreditCard,
  Building,
  Sparkles,
  MapPin,
  Lock
} from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any>(null)

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    postalCode: '',
    country: 'India',
  })

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD')

  useEffect(() => {
    async function loadData() {
      try {
        const [cartRes, meRes] = await Promise.all([
          fetch('/api/cart'),
          fetch('/api/auth/me'),
        ])
        const cartData = await cartRes.json()
        const meData = await meRes.json()

        if (cartData.items) setItems(cartData.items)
        if (meData.user) {
          setAddress((prev) => ({
            ...prev,
            fullName: `${meData.user.firstName || ''} ${meData.user.lastName || ''}`.trim(),
            phone: meData.user.mobileNumber || '',
          }))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.variant.salePrice || item.variant.price
    return acc + unitPrice * item.quantity
  }, 0)

  const tax = Math.round(subtotal * 0.05)
  const shipping = subtotal > 200000 || subtotal === 0 ? 0 : 15000
  const grandTotal = subtotal + tax + shipping

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlacingOrder(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: address,
          paymentMethod,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')

      setOrderSuccess(data.order)
    } catch (err: any) {
      alert(err.message || 'Error creating order')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-12 text-[#2D2421]">
        <div className="bg-white max-w-lg w-full p-8 rounded-3xl border border-[#EADBCE] shadow-2xl text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A1A38]">
            Order Confirmed
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B1522] mt-1">
            Thank You For Your Order!
          </h1>
          <p className="text-xs text-[#7A6458] mt-2">
            Your royal ensemble has been reserved and sent for artisanal packing.
          </p>

          <div className="bg-[#FAF4EC] p-4 rounded-2xl border border-[#EADBCE] my-6 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#7A6458]">Order Reference:</span>
              <span className="font-mono font-bold text-[#8A1A38]">{orderSuccess.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6458]">Total Paid / Due:</span>
              <span className="font-bold text-zinc-900">{formatPrice(orderSuccess.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6458]">Payment Mode:</span>
              <span className="font-medium text-zinc-900">
                {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Prepaid)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6458]">Estimated Delivery:</span>
              <span className="font-medium text-emerald-700">3 - 5 Business Days</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/orders"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#8A1A38] hover:bg-[#6D152D] shadow-md transition-colors"
            >
              View Order Tracking
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-[#8A1A38] bg-[#FDF2F4] hover:bg-[#FCE8ED] border border-[#F5D5DC] transition-colors"
            >
              Back to Boutique
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2D2421]">
      <header className="bg-white border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[#8A1A38] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold text-[#8A1A38]">Back to Bag</span>
          </Link>

          <Link href="/" className="font-serif text-xl font-bold text-[#4A1525]">
            Hema&apos;s Boutique
          </Link>

          <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-Bit SSL</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B1522] mb-8">
          Express Checkout
        </h1>

        {items.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#EADBCE] p-8">
            <p className="text-sm text-zinc-600 mb-4">Your bag is empty.</p>
            <Link href="/" className="text-xs font-bold text-[#8A1A38] underline">
              Return to shopping
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Shipping & Payment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-xs">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#3B1522] mb-4">
                  <MapPin className="w-5 h-5 text-[#8A1A38]" />
                  <span>1. Delivery Destination</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        placeholder="Priya Sharma"
                        className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                      Street Address &amp; Flat/House No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="12/A, Heritage Enclave, Near Silk Weaver Colony"
                      className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Chennai / Bangalore"
                        className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="Tamil Nadu"
                        className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A453D] mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="600001"
                        className="w-full px-3.5 py-2.5 border border-[#E8DACD] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-xs">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#3B1522] mb-4">
                  <CreditCard className="w-5 h-5 text-[#8A1A38]" />
                  <span>2. Payment Option</span>
                </div>

                <div className="space-y-3">
                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-[#8A1A38] bg-[#FDF4F6]'
                        : 'border-[#EADBCE] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-[#8A1A38] focus:ring-[#8A1A38]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#3B1522]">Cash on Delivery (COD)</p>
                        <p className="text-xs text-[#7A6458]">Pay in cash or UPI upon package arrival</p>
                      </div>
                    </div>
                    <Building className="w-5 h-5 text-[#8A1A38]" />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'ONLINE'
                        ? 'border-[#8A1A38] bg-[#FDF4F6]'
                        : 'border-[#EADBCE] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                        className="text-[#8A1A38] focus:ring-[#8A1A38]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#3B1522]">
                          Razorpay / Cards / UPI / NetBanking
                        </p>
                        <p className="text-xs text-[#7A6458]">Instant online verification (Test Sandbox)</p>
                      </div>
                    </div>
                    <Sparkles className="w-5 h-5 text-[#8A1A38]" />
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-md sticky top-24 h-fit">
              <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-3 mb-4">
                Ensemble Review ({items.length})
              </h2>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-4">
                {items.map((item) => {
                  const unitPrice = item.variant.salePrice || item.variant.price
                  return (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-zinc-900 line-clamp-1">
                          {item.variant.product.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Qty: {item.quantity} × {formatPrice(unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {formatPrice(unitPrice * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2 text-xs text-[#5A453D] pt-3 border-t border-[#F0E4D8]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-zinc-800">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-zinc-800">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#F0E4D8] flex justify-between items-baseline text-base font-bold text-[#3B1522]">
                  <span>Total Payable</span>
                  <span className="text-xl text-[#8A1A38]">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8A1A38] to-[#A8284C] hover:opacity-95 shadow-lg shadow-[#8A1A38]/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {placingOrder ? (
                  <span>Reserving Ensemble...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm &amp; Place Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
