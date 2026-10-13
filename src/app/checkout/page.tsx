'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
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

// Resilient helper to guarantee Razorpay checkout SDK is loaded
function ensureRazorpayLoaded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if ((window as any).Razorpay) {
      resolve(true)
      return
    }

    const scriptId = 'razorpay-checkout-sdk'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existing) {
      let attempts = 0
      const poll = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(poll)
          resolve(true)
        } else if (attempts++ > 60) {
          clearInterval(poll)
          resolve(false)
        }
      }, 50)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      let attempts = 0
      const poll = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(poll)
          resolve(true)
        } else if (attempts++ > 40) {
          clearInterval(poll)
          resolve(!!(window as any).Razorpay)
        }
      }, 50)
    }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    postalCode: '',
    country: 'India',
  })

  const [userEmail, setUserEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('ONLINE')

  useEffect(() => {
    // Preload Razorpay checkout SDK in the background immediately
    ensureRazorpayLoaded()

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
          setUserEmail(meData.user.email || '')
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
    setErrorMsg(null)

    // 1. Client-side Delivery Address Validation
    if (!address.fullName.trim()) {
      setErrorMsg('Please enter the recipient full name.')
      return
    }
    if (!address.phone.trim()) {
      setErrorMsg('Please enter a valid mobile contact number for delivery updates.')
      return
    }
    if (!address.street.trim()) {
      setErrorMsg('Please enter the delivery street address / flat details.')
      return
    }
    if (!address.city.trim()) {
      setErrorMsg('Please enter the delivery City / Town.')
      return
    }
    if (!address.postalCode.trim()) {
      setErrorMsg('Please enter the 6-digit postal PIN code.')
      return
    }

    setPlacingOrder(true)

    try {
      if (paymentMethod === 'COD') {
        // Cash on delivery flow
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: address,
            paymentMethod: 'COD',
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to place order')
        setOrderSuccess(data.order)
      } else {
        // Razorpay Online Payment Flow
        const scriptLoaded = await ensureRazorpayLoaded()
        if (!scriptLoaded) {
          throw new Error('Razorpay payment gateway failed to load. Please check your internet connection or disable ad-blockers.')
        }

        // 1. Create server-side order and razorpay order
        const createRes = await fetch('/api/checkout/razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shippingAddress: address }),
        })

        const orderData = await createRes.json()
        if (!createRes.ok) throw new Error(orderData.error || 'Failed to initialize payment gateway order')

        // 2. Open Razorpay Checkout modal
        const cleanPhone = address.phone ? address.phone.replace(/[^0-9]/g, '') : ''
        const options = {
          key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TmxBXynfsXvC1j',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: "Hema's Boutique",
          description: `Order #${orderData.orderNumber} - Artisanal Silk & Luxury Couture`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: address.fullName,
            email: userEmail || undefined,
            contact: cleanPhone,
          },
          theme: {
            color: '#8A1A38',
          },
          handler: async (response: any) => {
            try {
              setPlacingOrder(true)
              // 3. Verify signature server-side
              const verifyRes = await fetch('/api/checkout/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              })

              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment signature verification failed')
              }

              setOrderSuccess(verifyData.order)
            } catch (err: any) {
              setErrorMsg(err.message || 'Payment verification failed')
            } finally {
              setPlacingOrder(false)
            }
          },
          modal: {
            ondismiss: () => {
              setPlacingOrder(false)
              setErrorMsg('Payment modal closed. You can retry whenever you are ready.')
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', (response: any) => {
          setPlacingOrder(false)
          setErrorMsg(response.error?.description || 'Payment was declined by issuing bank')
        })
        rzp.open()
        // Modal is now open, return button to ready state
        setPlacingOrder(false)
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setErrorMsg(err.message || 'Error processing your checkout')
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
                {orderSuccess.status === 'PAID' ? 'Razorpay Online Verified' : 'Cash on Delivery (Pending)'}
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
              Continue Exploring
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2421]">
      <header className="bg-white border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-xs font-medium text-[#7A6458] hover:text-[#3B1522] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Royal Cart</span>
          </Link>
          <BrandLogo size="sm" variant="light" href="/" subtitle="Women's Tex Valley" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-medium">256-Bit SSL Secured</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {errorMsg && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold text-red-900 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-[#8A1A38] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-[#7A6458]">Preparing secure checkout experience...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white max-w-md mx-auto p-8 rounded-3xl border border-[#EADBCE] text-center">
            <p className="text-sm font-medium text-[#3B1522]">Your shopping cart is empty</p>
            <Link
              href="/"
              className="mt-4 inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8A1A38]"
            >
              Explore Boutique Collection
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF4EC] text-[#8A1A38] flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#3B1522]">
                      1. Delivery Address
                    </h2>
                    <p className="text-xs text-[#7A6458]">
                      Where should we deliver your handcrafted ensemble?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Full Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Mobile Contact *</label>
                    <input
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-700 font-semibold mb-1">Street Address &amp; House/Flat *</label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      placeholder="e.g. 42 Royal Palms Avenue, T. Nagar"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">City / Town *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      placeholder="Chennai"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Postal PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] focus:outline-none focus:ring-2 focus:ring-[#8A1A38]"
                      placeholder="600017"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Country</label>
                    <input
                      type="text"
                      disabled
                      value={address.country}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2B4] bg-[#F5ECE1] text-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF4EC] text-[#8A1A38] flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#3B1522]">
                      2. Payment Method
                    </h2>
                    <p className="text-xs text-[#7A6458]">
                      Select your preferred payment channel
                    </p>
                  </div>
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
                        <p className="text-xs text-[#7A6458]">Pay upon delivery via cash or UPI to delivery agent</p>
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
                        <p className="text-xs text-[#7A6458]">Official Razorpay Gateway (Instant verification &amp; order confirmation)</p>
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

              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"></span>
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8A1A38] to-[#A8284C] hover:opacity-95 shadow-lg shadow-[#8A1A38]/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {placingOrder ? (
                  <span>Connecting to Gateway...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{paymentMethod === 'ONLINE' ? 'Proceed with Razorpay' : 'Confirm Cash on Delivery'}</span>
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
