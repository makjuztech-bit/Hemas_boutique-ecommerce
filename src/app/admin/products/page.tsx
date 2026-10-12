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
  Save
} from 'lucide-react'

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  category: { id: string; name: string } | null
  variants: Array<{
    id: string
    sku: string
    price: number
    salePrice: number | null
    stockQuantity: number
  }>
  media: Array<{
    mediaAsset: { secureUrl: string }
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = useState<number>(0)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stockQuantity: '10',
    sku: '',
    imageUrl: '',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('altText', formData.name || 'Boutique product photo')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Upload failed')

      setFormData((prev) => ({ ...prev, imageUrl: resData.mediaAsset.secureUrl }))
    } catch (err: any) {
      alert(err.message || 'Image upload error')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')

      // Reset & Reload
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        price: '',
        stockQuantity: '10',
        sku: '',
        imageUrl: '',
      })
      setIsModalOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Error adding product')
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
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the boutique catalog?')) return

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variants[0]?.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Products &amp; Inventory
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your luxury catalog, track live stock units, and list new bridal &amp; silk collections.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, or category..."
          className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
        />
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
                  <th className="py-3 px-4 font-semibold">SKU</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Stock Quantity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.map((p) => {
                  const variant = p.variants[0]
                  const img =
                    p.media[0]?.mediaAsset?.secureUrl ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
                  const inStock = (variant?.stockQuantity || 0) > 0
                  const isEditingThisStock = editingStockId === p.id

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded-lg bg-zinc-800"
                          />
                          <div>
                            <p className="font-bold text-zinc-100 line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-zinc-500 line-clamp-1">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full text-[11px] font-medium">
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {variant?.sku || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-400">
                        {formatPrice(variant?.salePrice || variant?.price || 0)}
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
                              {inStock ? `${variant.stockQuantity} units` : 'Out of stock'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingStockId(p.id)
                                setEditingStockValue(variant?.stockQuantity || 0)
                              }}
                              className="p-1 text-zinc-500 hover:text-amber-400 rounded cursor-pointer"
                              title="Edit Stock"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Archive Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 max-w-xl w-full rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Add New Ensemble to Catalog</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Maroon Velvet Bridal Saree"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                  <label className="block text-zinc-400 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. HB-SAR-101"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Selling Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 15999"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Stock Units Available *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Image Upload / URL */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Product Media Asset</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/... or upload file below"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer font-medium text-[11px] border border-zinc-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading to Storage...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    {formData.imageUrl && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Asset Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Craftsmanship &amp; Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail the fabric purity, zari weave, artisanal embroidery, and included accessories..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  )
}
