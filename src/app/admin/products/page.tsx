'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  X,
  Layers,
  Image as ImageIcon,
  Upload,
  Edit2,
  Save,
  Tag,
  AlertCircle,
  Check,
  Sparkles,
  Heart
} from 'lucide-react'
import { parseProductDescription, extractBaseSku } from '@/lib/productMeta'

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']

type ProductVariant = {
  id: string
  sku: string
  size?: string | null
  color?: string | null
  price: number // in paise (actual MRP)
  salePrice: number | null // in paise (discounted selling price)
  stockQuantity: number
}

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId?: string | null
  category: { id: string; name: string } | null
  variants: ProductVariant[]
  media: Array<{
    id?: string
    sortOrder: number
    mediaAsset: { secureUrl: string; altText?: string | null }
  }>
}

type Category = {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fast inline stock edit
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = useState<number>(0)

  // 4 image slots for Add Modal
  const [addImages, setAddImages] = useState<string[]>(['', '', '', ''])
  // Sizing and Mother Feed Zip for Add Modal
  const [addSizes, setAddSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'Free Size'])
  const [addHasFeedingZip, setAddHasFeedingZip] = useState<boolean>(false)
  const [addFeedingZipPrice, setAddFeedingZipPrice] = useState<string>('200')

  // Form State for Adding Product
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    actualPrice: '', // MRP ₹
    sellingPrice: '', // Offer price ₹
    stockQuantity: '10',
    sku: '',
  })

  // 4 image slots for Edit Modal
  const [editImages, setEditImages] = useState<string[]>(['', '', '', ''])
  // Sizing and Mother Feed Zip for Edit Modal
  const [editSizes, setEditSizes] = useState<string[]>(['Free Size'])
  const [editHasFeedingZip, setEditHasFeedingZip] = useState<boolean>(false)
  const [editFeedingZipPrice, setEditFeedingZipPrice] = useState<string>('200')

  // Form State for Editing Product
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    actualPrice: '',
    sellingPrice: '',
    stockQuantity: '10',
    sku: '',
  })

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ])
      const prodData = await prodRes.json()
      const catData = await catRes.json()

      if (prodData.products) setProducts(prodData.products)
      if (catData.categories) setCategories(catData.categories)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text })
    setTimeout(() => {
      setStatusMessage(null)
    }, 4000)
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSlotIndex(slotIndex)
    try {
      const data = new FormData()
      data.append('file', file)
      const productName = isEdit ? editForm.name : addForm.name
      data.append('altText', `${productName || 'Boutique Product'} - View ${slotIndex + 1}`)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Upload failed')

      const uploadedUrl = resData.mediaAsset.secureUrl

      if (isEdit) {
        setEditImages((prev) => {
          const updated = [...prev]
          updated[slotIndex] = uploadedUrl
          return updated
        })
      } else {
        setAddImages((prev) => {
          const updated = [...prev]
          updated[slotIndex] = uploadedUrl
          return updated
        })
      }
      showToast('success', `Photo for View ${slotIndex + 1} attached!`)
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed')
    } finally {
      setUploadingSlotIndex(null)
    }
  }

  const resetAddForm = () => {
    setAddForm({
      name: '',
      description: '',
      categoryId: '',
      actualPrice: '',
      sellingPrice: '',
      stockQuantity: '10',
      sku: '',
    })
    setAddImages(['', '', '', ''])
    setAddSizes(['S', 'M', 'L', 'XL', 'Free Size'])
    setAddHasFeedingZip(false)
    setAddFeedingZipPrice('200')
    setIsAddModalOpen(false)
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const filteredImages = addImages.filter((img) => img.trim().length > 0)

      const payload = {
        name: addForm.name.trim(),
        description: addForm.description.trim(),
        categoryId: addForm.categoryId || null,
        actualPrice: addForm.actualPrice ? Number(addForm.actualPrice) : null,
        sellingPrice: addForm.sellingPrice ? Number(addForm.sellingPrice) : null,
        price: addForm.actualPrice || addForm.sellingPrice,
        salePrice: addForm.sellingPrice || null,
        stockQuantity: Number(addForm.stockQuantity) || 0,
        sku: addForm.sku.trim(),
        images: filteredImages,
        sizes: addSizes,
        hasFeedingZip: addHasFeedingZip,
        feedingZipPrice: Number(addFeedingZipPrice) || 200,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')

      showToast('success', `Ensemble "${data.product?.name || 'Product'}" published!`)
      resetAddForm()
      await loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Error adding product')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditProduct = (p: Product) => {
    const primaryVariant = p.variants[0]
    let actPrice = ''
    let sellPrice = ''

    if (primaryVariant) {
      if (primaryVariant.salePrice) {
        actPrice = String(Math.round(primaryVariant.price / 100))
        sellPrice = String(Math.round(primaryVariant.salePrice / 100))
      } else {
        actPrice = String(Math.round(primaryVariant.price / 100))
        sellPrice = String(Math.round(primaryVariant.price / 100))
      }
    }

    const { cleanDescription, meta } = parseProductDescription(p.description)

    setEditForm({
      name: p.name,
      description: cleanDescription || '',
      categoryId: p.category?.id || p.categoryId || '',
      actualPrice: actPrice,
      sellingPrice: sellPrice,
      stockQuantity: String(primaryVariant?.stockQuantity ?? 10),
      sku: extractBaseSku(primaryVariant?.sku) || '',
    })

    // Sizing and Mother Feed Zip
    setEditSizes(meta.sizes && meta.sizes.length > 0 ? meta.sizes : ['Free Size'])
    setEditHasFeedingZip(meta.hasFeedingZip)
    setEditFeedingZipPrice(String(meta.feedingZipPrice || 200))

    // Populate the 4 image slots
    const currentImages = ['', '', '', '']
    p.media?.forEach((m, idx) => {
      if (idx < 4 && m.mediaAsset?.secureUrl) {
        currentImages[idx] = m.mediaAsset.secureUrl
      }
    })
    setEditImages(currentImages)
    setEditingProduct(p)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setSubmitting(true)

    try {
      const filteredImages = editImages.filter((img) => img.trim().length > 0)

      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        categoryId: editForm.categoryId || null,
        actualPrice: editForm.actualPrice ? Number(editForm.actualPrice) : null,
        sellingPrice: editForm.sellingPrice ? Number(editForm.sellingPrice) : null,
        price: editForm.actualPrice || editForm.sellingPrice,
        salePrice: editForm.sellingPrice || null,
        stockQuantity: Number(editForm.stockQuantity) || 0,
        sku: editForm.sku.trim(),
        images: filteredImages,
        sizes: editSizes,
        hasFeedingZip: editHasFeedingZip,
        feedingZipPrice: Number(editFeedingZipPrice) || 200,
      }

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update product')

      showToast('success', `Product "${data.product?.name}" updated successfully!`)
      setEditingProduct(null)
      await loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Error updating product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStock = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: editingStockValue }),
      })

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              const updatedVariants = [...p.variants]
              if (updatedVariants[0]) {
                updatedVariants[0] = { ...updatedVariants[0], stockQuantity: editingStockValue }
              }
              return { ...p, variants: updatedVariants }
            }
            return p
          })
        )
        setEditingStockId(null)
        showToast('success', 'Stock count updated.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the catalog?`)) return

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id))
        showToast('success', `Product "${name}" deleted.`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleSize = (size: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSizes((prev) =>
        prev.includes(size)
          ? (prev.length > 1 ? prev.filter((s) => s !== size) : prev)
          : [...prev, size]
      )
    } else {
      setAddSizes((prev) =>
        prev.includes(size)
          ? (prev.length > 1 ? prev.filter((s) => s !== size) : prev)
          : [...prev, size]
      )
    }
  }

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variants[0]?.sku?.toLowerCase().includes(search.toLowerCase())
  )

  // Helper component for 4 Image Slots
  const renderImageSlots = (
    images: string[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
    isEdit: boolean
  ) => {
    const slotLabels = [
      { title: 'Image 1: Primary Cover', note: 'Main catalog front view' },
      { title: 'Image 2: Drape & Angle', note: 'Side or full-length view' },
      { title: 'Image 3: Fabric & Zari', note: 'Border & weave close-up' },
      { title: 'Image 4: Pallu & Styling', note: 'Back or model look' },
    ]

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-zinc-300 font-bold text-xs uppercase tracking-wider">
            Product Media Gallery (4 Photos) *
          </label>
          <span className="text-[11px] text-amber-400 font-medium">
            {images.filter((img) => img.trim()).length} of 4 photos attached
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {slotLabels.map((slot, index) => {
            const currentUrl = images[index] || ''
            const isUploading = uploadingSlotIndex === index

            return (
              <div
                key={index}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                    {slot.title}
                  </span>
                  {currentUrl ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3" /> Attached
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Empty</span>
                  )}
                </div>

                {/* Thumbnail Preview if available */}
                {currentUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 group">
                    <img
                      src={currentUrl}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...images]
                        updated[index] = ''
                        setImages(updated)
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-600 text-white p-1 rounded-md text-[10px] transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 text-[11px]">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>{slot.note}</span>
                  </div>
                )}

                {/* Direct URL input */}
                <input
                  type="url"
                  placeholder="Paste image URL..."
                  value={currentUrl}
                  onChange={(e) => {
                    const updated = [...images]
                    updated[index] = e.target.value
                    setImages(updated)
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />

                {/* Upload Button */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer border border-zinc-700/60 transition-colors">
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, index, isEdit)}
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-[10px] text-zinc-500 italic">PNG, JPG, WEBP</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Sizing Options & Mother Feeding Zip Section
  const renderSizingAndFeedingZip = (
    sizes: string[],
    hasFeedingZip: boolean,
    setHasFeedingZip: (val: boolean) => void,
    feedingZipPrice: string,
    setFeedingZipPrice: (val: string) => void,
    isEdit: boolean
  ) => {
    return (
      <div className="space-y-4">
        {/* Sizing Pills */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-zinc-300 font-bold text-xs uppercase tracking-wider">
              Available Sizes *
            </label>
            <span className="text-[10px] text-zinc-500">
              Click to toggle sizes available in stock
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SIZES.map((sz) => {
              const selected = sizes.includes(sz)
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz, isEdit)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  <span>{sz}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mother Feed Zip Customization */}
        <div className="p-4 bg-gradient-to-r from-rose-950/20 to-zinc-950 border border-rose-900/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🤱</span>
              <div>
                <p className="font-bold text-white text-xs">
                  Mother Feed Zip Add-on (Nursing / Maternity)
                </p>
                <p className="text-[10px] text-zinc-400">
                  Allow mothers to order this outfit with concealed nursing zippers
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasFeedingZip}
                onChange={(e) => setHasFeedingZip(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {hasFeedingZip && (
            <div className="pt-2 border-t border-rose-900/20 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[11px]">
                  Add-on Surcharge Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={feedingZipPrice}
                    onChange={(e) => setFeedingZipPrice(e.target.value)}
                    placeholder="200"
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-rose-800/40 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  e.g. ₹200 added to product total if opted by customer
                </span>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-rose-300 flex items-center">
                <span>
                  ✓ Two concealed side zippers will be offered on the product page for this price.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl border animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
              : 'bg-red-950/90 text-red-300 border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Products &amp; Inventory
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your boutique catalog, edit product details, set Actual &amp; Selling prices, configure sizes, and offer Mother Feed Zip add-ons.
          </p>
        </div>
        <button
          onClick={() => {
            resetAddForm()
            setIsAddModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, or category..."
          className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading catalog...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No products found</p>
          <p className="text-xs text-zinc-500 mt-1">Add a new product or modify your search filter.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">SKU &amp; Sizes</th>
                  <th className="py-3 px-4 font-semibold">Pricing (Selling vs Actual)</th>
                  <th className="py-3 px-4 font-semibold">Stock Quantity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.map((p) => {
                  const variant = p.variants[0]
                  const actualPrice = variant?.price || 0
                  const sellingPrice = variant?.salePrice || actualPrice
                  const hasDiscount = variant?.salePrice && variant.salePrice < actualPrice

                  const { meta } = parseProductDescription(p.description)
                  const sizesList = meta.sizes && meta.sizes.length > 0
                    ? meta.sizes
                    : Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean)))

                  const img =
                    p.media[0]?.mediaAsset?.secureUrl ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
                  const photosCount = p.media?.length || 0
                  const totalStock = p.variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0)
                  const inStock = totalStock > 0
                  const isEditingThisStock = editingStockId === p.id

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={img}
                              alt={p.name}
                              className="w-12 h-14 object-cover rounded-lg bg-zinc-800 shrink-0"
                            />
                            {photosCount > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-black/90 text-amber-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-zinc-700">
                                {photosCount}📷
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-100 line-clamp-1">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {meta.hasFeedingZip && (
                                <span className="bg-rose-950/80 text-rose-300 border border-rose-800/50 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>🤱</span> Feed Zip (+₹{meta.feedingZipPrice})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full text-[11px] font-medium">
                          {p.category?.name || 'Unassigned'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-zinc-400 text-[11px]">
                          {extractBaseSku(variant?.sku) || 'N/A'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sizesList.map((sz) => (
                            <span
                              key={String(sz)}
                              className="text-[9px] font-bold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded"
                            >
                              {String(sz)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-amber-400 text-sm">
                              {formatPrice(sellingPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-zinc-500 line-through">
                                {formatPrice(actualPrice)}
                              </span>
                            )}
                          </div>
                          {hasDiscount ? (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              Save {Math.round(((actualPrice - sellingPrice) / actualPrice) * 100)}% (MRP: {formatPrice(actualPrice)})
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">
                              Standard Price
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isEditingThisStock ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(Number(e.target.value))}
                              className="w-16 px-2 py-1 rounded bg-zinc-800 border border-amber-500 text-white font-mono text-xs focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateStock(p.id)}
                              className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded cursor-pointer"
                              title="Save Stock"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1 text-zinc-500 hover:text-white rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                inStock
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                                  : 'bg-red-950/60 text-red-400 border border-red-800/50'
                              }`}
                            >
                              {inStock ? `${totalStock} units` : 'Out of stock'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingStockId(p.id)
                                setEditingStockValue(totalStock)
                              }}
                              className="p-1 text-zinc-500 hover:text-amber-400 rounded cursor-pointer"
                              title="Quick Edit Stock"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Add New Ensemble to Catalog</h3>
              </div>
              <button
                onClick={resetAddForm}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Royal Maroon Velvet Bridal Saree / Feeding Kurta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category *</label>
                  <select
                    required
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Base SKU Code</label>
                  <input
                    type="text"
                    value={addForm.sku}
                    onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })}
                    placeholder="e.g. HB-KUR-101"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pricing Section: Selling Price and Actual Price */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Pricing &amp; Discounts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Actual Price / MRP (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={addForm.actualPrice}
                      onChange={(e) => setAddForm({ ...addForm, actualPrice: e.target.value })}
                      placeholder="e.g. 19999"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Original printed / strikethrough price
                    </span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Selling Price / Offer (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={addForm.sellingPrice}
                      onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                      placeholder="e.g. 14999"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500 font-bold"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Actual price customer pays at checkout
                    </span>
                  </div>
                </div>

                {/* Savings Calculation preview */}
                {addForm.actualPrice && addForm.sellingPrice && Number(addForm.actualPrice) > Number(addForm.sellingPrice) && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
                    <span>
                      Customer Saves: ₹{(Number(addForm.actualPrice) - Number(addForm.sellingPrice)).toLocaleString('en-IN')}
                    </span>
                    <span className="bg-emerald-800/80 text-white px-2 py-0.5 rounded-md text-[10px]">
                      {Math.round(((Number(addForm.actualPrice) - Number(addForm.sellingPrice)) / Number(addForm.actualPrice)) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Sizing & Mother Feed Zip Add-on Controls */}
              {renderSizingAndFeedingZip(
                addSizes,
                addHasFeedingZip,
                setAddHasFeedingZip,
                addFeedingZipPrice,
                setAddFeedingZipPrice,
                false
              )}

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Stock Units Available *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addForm.stockQuantity}
                  onChange={(e) => setAddForm({ ...addForm, stockQuantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4 Image Slots Section */}
              {renderImageSlots(addImages, setAddImages, false)}

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Craftsmanship &amp; Description</label>
                <textarea
                  rows={3}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Detail the fabric purity, zari weave, artisanal embroidery, and included accessories..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Edit Boutique Product</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Product Title"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category *</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Base SKU Code</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    placeholder="e.g. HB-KUR-101"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pricing Section: Selling Price and Actual Price */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Pricing &amp; Discounts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Actual Price / MRP (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.actualPrice}
                      onChange={(e) => setEditForm({ ...editForm, actualPrice: e.target.value })}
                      placeholder="e.g. 19999"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Original printed / strikethrough price
                    </span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">
                      Selling Price / Offer (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.sellingPrice}
                      onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                      placeholder="e.g. 14999"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500 font-bold"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Actual price customer pays at checkout
                    </span>
                  </div>
                </div>

                {/* Savings Calculation preview */}
                {editForm.actualPrice && editForm.sellingPrice && Number(editForm.actualPrice) > Number(editForm.sellingPrice) && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
                    <span>
                      Customer Saves: ₹{(Number(editForm.actualPrice) - Number(editForm.sellingPrice)).toLocaleString('en-IN')}
                    </span>
                    <span className="bg-emerald-800/80 text-white px-2 py-0.5 rounded-md text-[10px]">
                      {Math.round(((Number(editForm.actualPrice) - Number(editForm.sellingPrice)) / Number(editForm.actualPrice)) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Sizing & Mother Feed Zip Add-on Controls */}
              {renderSizingAndFeedingZip(
                editSizes,
                editHasFeedingZip,
                setEditHasFeedingZip,
                editFeedingZipPrice,
                setEditFeedingZipPrice,
                true
              )}

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Stock Units Available *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editForm.stockQuantity}
                  onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4 Image Slots Section */}
              {renderImageSlots(editImages, setEditImages, true)}

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Craftsmanship &amp; Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Detail the fabric purity, zari weave, artisanal embroidery..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
