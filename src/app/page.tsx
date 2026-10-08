'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  User,
  LogOut,
  Search,
  Sparkles,
  CheckCircle,
  Heart,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  Phone,
  Clock,
  X,
  Plus,
  Minus
} from 'lucide-react'

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  category: { id: string; name: string; slug: string } | null
  variants: Array<{
    id: string
    sku: string
    price: number
    salePrice: number | null
    stockQuantity: number
  }>
  media: Array<{
    mediaAsset: { secureUrl: string; altText: string | null }
  }>
}

type Category = {
  id: string
  name: string
  slug: string
  _count?: { products: number }
}

export default function StorefrontPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  // Fetch current user, categories, and products
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch current user
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()
        if (meData.user) {
          setUser(meData.user)
        }

        // Fetch categories
        const catRes = await fetch('/api/categories')
        const catData = await catRes.json()
        if (catData.categories) {
          setCategories(catData.categories)
        }

        // Fetch cart items count
        const cartRes = await fetch('/api/cart')
        const cartData = await cartRes.json()
        if (cartData.items) {
          setCartCount(cartData.items.reduce((acc: number, item: any) => acc + item.quantity, 0))
        }
      } catch (e) {
        console.error('Error loading initial data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Fetch products when category or search changes
  useEffect(() => {
    async function fetchProducts() {
      try {
        const url = new URL('/api/products', window.location.origin)
        if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory)
        if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim())

        const res = await fetch(url.toString())
        const data = await res.json()
        if (data.products) {
          setProducts(data.products)
        }
      } catch (e) {
        console.error('Error fetching products:', e)
      }
    }
    fetchProducts()
  }, [selectedCategory, searchQuery])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleAddToCart = async (variantId: string, quantity = 1, productName = 'Item') => {
    setAddingToCart(variantId)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add to cart')

      setCartCount((prev) => prev + quantity)
      showToast(`Added "${productName}" to your cart!`)
      if (selectedProduct) setSelectedProduct(null)
    } catch (err: any) {
      alert(err.message || 'Error adding to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2D2421]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#8A1A38] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up border border-[#A8284C]">
          <CheckCircle className="w-5 h-5 text-amber-300" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <Link
            href="/cart"
            className="ml-2 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-semibold transition-colors"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Top Notification Bar */}
      <div className="bg-[#8A1A38] text-white text-[11px] font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-4">
        <span>✨ Welcome to Hema&apos;s Boutique — Handcrafted Luxury Festive &amp; Bridal Collections</span>
        <span className="hidden sm:inline opacity-75">|</span>
        <span className="hidden sm:inline">Free Domestic Shipping on Orders above ₹2,000</span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0E4D8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A1A38] to-[#C94A6E] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#4A1525] block leading-none">
                Hema&apos;s Boutique
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#982245]">
                Haute Couture &amp; Sarees
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Silk Sarees, Lehengas, Kurtis..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF6F0] border border-[#E8DACD] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8A1A38] focus:bg-white transition-all placeholder-[#9E8B82]"
              />
              <Search className="w-4 h-4 text-[#9E8B82] absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3 sm:gap-5">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/orders"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#5A453D] hover:text-[#8A1A38] py-1.5 px-3 rounded-lg hover:bg-[#FAF4EC] transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">My Orders</span>
                </Link>

                <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#7A6458] bg-[#FAF4EC] py-1.5 px-3 rounded-full border border-[#EBDDD2]">
                  <User className="w-3.5 h-3.5 text-[#8A1A38]" />
                  <span>Hello, {user.firstName || 'Shopper'}</span>
                </div>

                {/* Admin Portal Link if staff */}
                {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF') && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 py-1.5 px-3 rounded-lg border border-amber-300 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-[#7A6458] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-white bg-[#8A1A38] hover:bg-[#6D152D] py-2 px-4 rounded-xl shadow-sm transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Cart Icon & Badge */}
            <Link
              href="/cart"
              className="relative p-2.5 bg-[#8A1A38]/5 hover:bg-[#8A1A38]/10 text-[#8A1A38] rounded-xl border border-[#8A1A38]/15 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#8A1A38] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-[#4A1222] via-[#631B30] to-[#360B18] text-white overflow-hidden py-14 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-medium mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> 2026 Festive &amp; Bridal Collection
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Timeless Elegance, Pure Craftsmanship
            </h2>
            <p className="mt-3 text-sm sm:text-base text-rose-100 font-light leading-relaxed">
              Explore authentic Kanchipuram silk, Banarasi zari sarees, and designer bridal sets curated specially for discerning occasions.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                onClick={() => setSelectedCategory('silk-sarees')}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-black px-6 py-2.5 rounded-full font-semibold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer"
              >
                Shop Pure Silks
              </button>
              <button
                onClick={() => setSelectedCategory('bridal-lehengas')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-2.5 rounded-full font-medium text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Bridal Lehengas
              </button>
            </div>
          </div>

          {/* Banner Badges */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <ShieldCheck className="w-6 h-6 text-amber-300 mx-auto mb-1.5" />
              <h4 className="text-xs font-bold text-white">100% Authentic</h4>
              <p className="text-[10px] text-rose-200 mt-0.5">Silk Mark Certified Weaves</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <Clock className="w-6 h-6 text-amber-300 mx-auto mb-1.5" />
              <h4 className="text-xs font-bold text-white">Express Delivery</h4>
              <p className="text-[10px] text-rose-200 mt-0.5">Dispatched within 24h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Pills Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#EADBD0] pb-4 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#8A1A38] text-white shadow-sm'
                  : 'bg-white text-[#6B574F] hover:bg-[#F2E7DC] border border-[#E2D2C4]'
              }`}
            >
              All Creations ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-[#8A1A38] text-white shadow-sm'
                    : 'bg-white text-[#6B574F] hover:bg-[#F2E7DC] border border-[#E2D2C4]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#EADBD0]">
            <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#4A1525]">No products found</h3>
            <p className="text-xs text-[#8A7268] mt-1">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const variant = product.variants[0]
              const price = variant?.price || 0
              const salePrice = variant?.salePrice
              const image =
                product.media[0]?.mediaAsset?.secureUrl ||
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
              const inStock = (variant?.stockQuantity || 0) > 0

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#EADBCE] hover:border-[#8A1A38]/30 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <div
                    onClick={() => {
                      setSelectedProduct(product)
                      setModalQuantity(1)
                    }}
                    className="relative aspect-4/5 bg-[#F5EFE8] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {product.category.name}
                      </span>
                    )}
                    {salePrice && (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Save {Math.round(((price - salePrice) / price) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => {
                          setSelectedProduct(product)
                          setModalQuantity(1)
                        }}
                        className="font-serif text-lg font-bold text-[#3B1522] group-hover:text-[#8A1A38] transition-colors line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#7A6458] line-clamp-2 leading-relaxed">
                        {product.description || 'Pure artisanal ethnic masterpiece.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F2E8DF] flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-[#8A1A38]">
                            {formatPrice(salePrice || price)}
                          </span>
                          {salePrice && (
                            <span className="text-xs text-[#9E8B82] line-through">
                              {formatPrice(price)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold block ${
                            inStock ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {inStock ? `● In Stock (${variant.stockQuantity} left)` : '● Out of Stock'}
                        </span>
                      </div>

                      <button
                        onClick={() => variant && handleAddToCart(variant.id, 1, product.name)}
                        disabled={!inStock || addingToCart === variant?.id}
                        className="flex items-center gap-1.5 bg-[#8A1A38] hover:bg-[#6D152D] disabled:bg-zinc-300 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{addingToCart === variant?.id ? 'Adding...' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8DACD] relative animate-scale-in">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-zinc-600 hover:text-black z-10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square bg-[#F5EFE8]">
                <img
                  src={
                    selectedProduct.media[0]?.mediaAsset?.secureUrl ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A1A38] tracking-wider">
                    {selectedProduct.category?.name || 'Boutique Collection'}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#3B1522] mt-1">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-[#8A1A38]">
                      {formatPrice(
                        selectedProduct.variants[0]?.salePrice ||
                          selectedProduct.variants[0]?.price ||
                          0
                      )}
                    </span>
                    {selectedProduct.variants[0]?.salePrice && (
                      <span className="text-sm text-zinc-400 line-through">
                        {formatPrice(selectedProduct.variants[0]?.price || 0)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-[#6B574F] leading-relaxed">
                    {selectedProduct.description || 'Authentic designer couture crafted with care.'}
                  </p>
                  <div className="mt-3 text-[11px] text-zinc-500">
                    SKU: <span className="font-mono">{selectedProduct.variants[0]?.sku}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F0E4D8]">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold text-[#5A453D]">Quantity:</span>
                    <div className="flex items-center border border-[#E0D0C2] rounded-lg">
                      <button
                        onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                        className="p-1.5 text-zinc-600 hover:text-black cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold">{modalQuantity}</span>
                      <button
                        onClick={() =>
                          setModalQuantity(
                            Math.min(
                              selectedProduct.variants[0]?.stockQuantity || 1,
                              modalQuantity + 1
                            )
                          )
                        }
                        className="p-1.5 text-zinc-600 hover:text-black cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      selectedProduct.variants[0] &&
                      handleAddToCart(
                        selectedProduct.variants[0].id,
                        modalQuantity,
                        selectedProduct.name
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-[#8A1A38] hover:bg-[#6D152D] shadow-md transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {modalQuantity} to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#2D1B22] text-[#E8D9CE] py-12 px-4 sm:px-6 lg:px-8 mt-16 border-t border-[#422933]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-xl font-bold text-white">Hema&apos;s Boutique</h3>
            </div>
            <p className="text-xs text-[#C9B4A7] leading-relaxed">
              Celebrating Indian handloom craftsmanship, royal wedding couture, and bespoke sarees since 2012.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#C9B4A7]">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Storefront Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track My Orders
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Admin Panel Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">
              Customer Concierge
            </h4>
            <div className="space-y-2 text-xs text-[#C9B4A7]">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>+91 99999 99999 / +91 98765 43210</span>
              </p>
              <p>Email: contact@hemasboutique.com</p>
              <p>Mon - Sat, 10:00 AM - 8:00 PM IST</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#422933] text-center text-[11px] text-[#A68F81]">
          &copy; {new Date().getFullYear()} Hema&apos;s Boutique. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
