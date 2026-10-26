'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import {
  ShoppingBag,
  Heart,
  Share2,
  Check,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Minus,
  Plus,
  Ruler,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { parseProductDescription } from '@/lib/productMeta'

type ProductVariant = {
  id: string
  sku: string
  size?: string | null
  color?: string | null
  price: number // in paise
  salePrice: number | null // in paise
  stockQuantity: number
}

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  category: { id: string; name: string; slug: string } | null
  variants: ProductVariant[]
  media: Array<{
    id?: string
    sortOrder: number
    mediaAsset: { secureUrl: string; altText?: string | null }
  }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [withFeedingZip, setWithFeedingZip] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch product data and cart
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return
      setLoading(true)
      try {
        const [prodRes, cartRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/cart'),
        ])

        const prodData = await prodRes.json()
        const cartData = await cartRes.json()

        if (cartData.items) {
          setCartCount(cartData.items.reduce((acc: number, item: any) => acc + item.quantity, 0))
        }

        if (prodData.product) {
          const p: Product = prodData.product
          setProduct(p)

          // Extract metadata for default size selection
          const { meta } = parseProductDescription(p.description)
          const availableSizes = meta.sizes && meta.sizes.length > 0
            ? meta.sizes
            : Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean))) as string[]

          if (availableSizes.length > 0) {
            setSelectedSize(availableSizes[0])
          } else {
            setSelectedSize('Free Size')
          }

          // Fetch related products
          if (p.category?.slug) {
            const relRes = await fetch(`/api/products?category=${p.category.slug}`)
            const relData = await relRes.json()
            if (relData.products) {
              setRelatedProducts(relData.products.filter((item: Product) => item.id !== p.id).slice(0, 4))
            }
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-3 border-[#8A1A38] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-serif text-[#5A453D] text-sm tracking-wide">
          Unfolding luxury boutique ensemble...
        </p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#3B1522] mb-2">Ensemble Not Found</h1>
        <p className="text-xs text-[#7A6458] mb-6">
          The requested boutique creation may have been archived or is temporarily unavailable.
        </p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 bg-[#8A1A38] text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md hover:bg-[#6D152D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>
      </div>
    )
  }

  // Parse description and Mother Feed Zip configuration
  const { cleanDescription, meta } = parseProductDescription(product.description)
  const availableSizes = meta.sizes && meta.sizes.length > 0
    ? meta.sizes
    : Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[]

  // Find variant matching current selection (Size & Feeding Zip)
  const targetColor = withFeedingZip ? 'Feeding Zip' : 'Standard'
  let matchedVariant = product.variants.find(
    (v) => (v.size === selectedSize || (!v.size && selectedSize === 'Free Size')) && v.color === targetColor
  )

  // Fallback to size-only match or first variant
  if (!matchedVariant) {
    matchedVariant = product.variants.find(
      (v) => v.size === selectedSize || (!v.size && selectedSize === 'Free Size')
    ) || product.variants[0]
  }

  // Base pricing
  const baseActualPrice = matchedVariant?.price || 199900
  const baseSellingPrice = matchedVariant?.salePrice || baseActualPrice

  // Add-on price calculation (if feeding zip is active and not already baked into variant)
  const zipSurchargePaise = withFeedingZip && matchedVariant?.color !== 'Feeding Zip'
    ? Math.round((meta.feedingZipPrice || 200) * 100)
    : 0

  const activeSellingPrice = baseSellingPrice + zipSurchargePaise
  const activeActualPrice = baseActualPrice + zipSurchargePaise
  const hasDiscount = activeSellingPrice < activeActualPrice
  const discountPercent = hasDiscount
    ? Math.round(((activeActualPrice - activeSellingPrice) / activeActualPrice) * 100)
    : 0

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  // Gather 4 images
  const images = product.media && product.media.length > 0
    ? product.media.map((m) => m.mediaAsset?.secureUrl).filter(Boolean)
    : [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
      ]

  const activeImageUrl = images[activeImageIndex] || images[0]

  const handleAddToCart = async (directCheckout = false) => {
    if (!matchedVariant) return
    setAddingToCart(true)

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: matchedVariant.id,
          quantity,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/products/${product.id}`)
          return
        }
        throw new Error(data.error || 'Failed to add item to bag')
      }

      setCartCount((prev) => prev + quantity)
      if (directCheckout) {
        router.push('/checkout')
      } else {
        showToast(
          'success',
          `Added ${quantity}x "${product.name}" (${selectedSize}${withFeedingZip ? ' • Feed Zip' : ''}) to bag!`
        )
      }
    } catch (err: any) {
      showToast('error', err.message || 'Could not add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2421] font-sans antialiased flex flex-col justify-between">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl border animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[#18392B] text-emerald-300 border-emerald-700/60'
              : 'bg-red-950/95 text-red-300 border-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EADBCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 rounded-full hover:bg-[#F2E8DF] text-[#7A6458] transition-colors cursor-pointer"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div onClick={() => router.push('/')} className="cursor-pointer">
              <BrandLogo />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2.5 rounded-full hover:bg-[#F2E8DF] text-[#4A1525] transition-colors cursor-pointer"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#8A1A38] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Product Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-[#7A6458] mb-6 overflow-x-auto whitespace-nowrap">
          <button onClick={() => router.push('/')} className="hover:text-[#8A1A38] transition-colors cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-[#B8A599]" />
          <span>{product.category?.name || 'Boutique Collection'}</span>
          <ChevronRight className="w-3 h-3 text-[#B8A599]" />
          <span className="font-semibold text-[#3B1522] truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: 4 Image Gallery Showcase */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Primary Main Image Viewer */}
            <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-[#F4EDE5] border border-[#EADBCE] shadow-md group">
              <img
                src={activeImageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              {/* Overlays */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.category && (
                  <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {product.category.name}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-[#8A1A38] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {meta.hasFeedingZip && (
                <span className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-rose-900 text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-rose-200">
                  <span>🤱</span> Mother Feeding Zip Available
                </span>
              )}
            </div>

            {/* 4 Interactive Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-4/5 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-[#F5EFE8] ${
                    activeImageIndex === idx
                      ? 'border-[#8A1A38] scale-102 shadow-md ring-2 ring-[#8A1A38]/20'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:border-[#D5C2B4]'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Details, Sizing, Add-ons & Purchase */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-[#8A1A38] uppercase tracking-widest font-mono">
                  {product.category?.name || 'Exclusive Couture'}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3B1522] mt-1 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#7A6458]">
                  <span>SKU: <strong className="font-mono text-[#5A453D]">{matchedVariant?.sku || 'HB-SAR'}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    In Stock ({matchedVariant?.stockQuantity || 10} pieces left)
                  </span>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="p-4 bg-white rounded-2xl border border-[#EADBCE] shadow-xs flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[#8A1A38]">
                      {formatPrice(activeSellingPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-[#9E8B82] line-through font-mono">
                        {formatPrice(activeActualPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7A6458] mt-1">
                    Inclusive of all taxes • Free express shipping across India
                  </p>
                </div>
                {hasDiscount && (
                  <span className="bg-[#FAF0F2] text-[#8A1A38] border border-[#F2D1D8] text-xs font-bold px-3 py-1 rounded-full">
                    Save {formatPrice(activeActualPrice - activeSellingPrice)}
                  </span>
                )}
              </div>

              {/* Sizing Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3B1522] uppercase tracking-wider flex items-center gap-1.5">
                    <span>Select Size:</span>
                    <strong className="text-[#8A1A38]">{selectedSize}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs font-semibold text-[#8A1A38] hover:text-[#6D152D] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Chart Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-12 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#8A1A38] text-white border-[#8A1A38] shadow-md shadow-[#8A1A38]/20 scale-102'
                            : 'bg-white text-[#5A453D] border-[#E0D0C2] hover:border-[#8A1A38] hover:bg-[#FAF4ED]'
                        }`}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mother Feed Zip Add-on Box */}
              {meta.hasFeedingZip && (
                <div
                  onClick={() => setWithFeedingZip(!withFeedingZip)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    withFeedingZip
                      ? 'bg-rose-50/70 border-rose-500 shadow-sm'
                      : 'bg-white border-[#EADBCE] hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={withFeedingZip}
                        onChange={(e) => setWithFeedingZip(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#3B1522]">
                            Add Mother Feed Zip
                          </span>
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            +₹{meta.feedingZipPrice} Surcharge
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6458] mt-1 leading-relaxed">
                          Concealed invisible vertical zippers tailored into the bust seams for easy, dignified nursing &amp; breastfeeding anytime.
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">🤱</span>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#3B1522] uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-[#E0D0C2] rounded-xl bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-[#7A6458] hover:text-black cursor-pointer transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-[#3B1522] font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(matchedVariant?.stockQuantity || 10, quantity + 1))}
                    className="p-2 text-[#7A6458] hover:text-black cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Bag and Buy Now Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={addingToCart}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-[#8A1A38] hover:bg-[#6D152D] shadow-lg shadow-[#8A1A38]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addingToCart ? 'Adding to Bag...' : 'Add to Bag'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={addingToCart}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-[#8A1A38] bg-[#FAF2EB] hover:bg-[#F5E6DA] border border-[#E8DACD] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#8A1A38]" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Boutique Trust Icons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EADBCE] text-[11px] text-[#6B574F]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8A1A38]" />
                  <span>100% Authentic Handloom</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8A1A38]" />
                  <span>Express Delivery (3-5 Days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#8A1A38]" />
                  <span>7-Day Return Assistance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#8A1A38]" />
                  <span>Artisanal Zari Weave</span>
                </div>
              </div>
            </div>

            {/* Description Details Tab / Box */}
            <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] space-y-3 mt-6">
              <h3 className="font-serif font-bold text-sm text-[#3B1522] uppercase tracking-wider">
                Craftsmanship &amp; Heritage
              </h3>
              <p className="text-xs text-[#7A6458] leading-relaxed">
                {cleanDescription || 'Artisanal couture handcrafted with time-honored traditional techniques.'}
              </p>
              <div className="pt-3 border-t border-[#F2E8DF] text-[11px] text-[#8A7268] space-y-1">
                <p><strong>Fabric:</strong> Handwoven Pure Silk &amp; Velvet Zari</p>
                <p><strong>Care:</strong> Dry clean only to preserve luster &amp; weave integrity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-[#EADBCE]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#3B1522]">You May Also Adore</h2>
                <p className="text-xs text-[#7A6458] mt-1">Handpicked matching designs from the same couture collection.</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-xs font-bold text-[#8A1A38] hover:underline cursor-pointer"
              >
                View Full Catalog →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const img = rel.media?.[0]?.mediaAsset?.secureUrl || images[0]
                const v = rel.variants[0]
                const relPrice = v?.salePrice || v?.price || 0
                return (
                  <div
                    key={rel.id}
                    onClick={() => router.push(`/products/${rel.id}`)}
                    className="bg-white rounded-2xl overflow-hidden border border-[#EADBCE] hover:border-[#8A1A38]/30 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer group"
                  >
                    <div className="aspect-4/5 overflow-hidden bg-[#F5EFE8]">
                      <img
                        src={img}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#8A1A38] tracking-wider">{rel.category?.name || 'Silk'}</p>
                        <h4 className="font-serif font-bold text-sm text-[#3B1522] mt-0.5 line-clamp-1 group-hover:text-[#8A1A38] transition-colors">{rel.name}</h4>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#F2E8DF] flex items-center justify-between">
                        <span className="font-bold text-sm text-[#8A1A38]">{formatPrice(relPrice)}</span>
                        <span className="text-[10px] font-semibold text-[#8A1A38]">View Details →</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8DACD] relative animate-scale-in">
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-black p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-5 h-5 text-[#8A1A38]" />
              <h3 className="font-serif text-lg font-bold text-[#3B1522]">Boutique Size Chart (Inches)</h3>
            </div>
            <p className="text-xs text-[#7A6458] mb-5">
              Standard Indian ethnic sizing chart for sarees, lehengas, and maternity feeding kurtis.
            </p>

            <div className="overflow-x-auto border border-[#EADBCE] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF4ED] text-[#3B1522] font-bold border-b border-[#EADBCE]">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust</th>
                    <th className="py-2.5 px-3">Waist</th>
                    <th className="py-2.5 px-3">Hip</th>
                    <th className="py-2.5 px-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E8DF] text-[#5A453D]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">XS (34)</td>
                    <td className="py-2.5 px-3">34"</td>
                    <td className="py-2.5 px-3">28"</td>
                    <td className="py-2.5 px-3">36"</td>
                    <td className="py-2.5 px-3">44"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">S (36)</td>
                    <td className="py-2.5 px-3">36"</td>
                    <td className="py-2.5 px-3">30"</td>
                    <td className="py-2.5 px-3">38"</td>
                    <td className="py-2.5 px-3">45"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">M (38)</td>
                    <td className="py-2.5 px-3">38"</td>
                    <td className="py-2.5 px-3">32"</td>
                    <td className="py-2.5 px-3">40"</td>
                    <td className="py-2.5 px-3">45"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">L (40)</td>
                    <td className="py-2.5 px-3">40"</td>
                    <td className="py-2.5 px-3">34"</td>
                    <td className="py-2.5 px-3">42"</td>
                    <td className="py-2.5 px-3">46"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">XL (42)</td>
                    <td className="py-2.5 px-3">42"</td>
                    <td className="py-2.5 px-3">36"</td>
                    <td className="py-2.5 px-3">44"</td>
                    <td className="py-2.5 px-3">46"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">XXL (44)</td>
                    <td className="py-2.5 px-3">44"</td>
                    <td className="py-2.5 px-3">38"</td>
                    <td className="py-2.5 px-3">46"</td>
                    <td className="py-2.5 px-3">46"</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#8A1A38]">Free Size</td>
                    <td className="py-2.5 px-3" colSpan={4}>Semi-stitched / Adjustable drape (fits 34" to 44")</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-3 border-t border-[#F0E4D8] text-right">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8A1A38] hover:bg-[#6D152D] cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#EADBCE] py-8 text-center text-xs text-[#8A7268] mt-12">
        <p>© 2026 Hema&apos;s Boutique. Crafted with artisanal luxury and love.</p>
      </footer>
    </div>
  )
}
