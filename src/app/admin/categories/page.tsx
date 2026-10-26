'use client'

import React, { useState, useEffect } from 'react'
import { Layers, Plus, X, Edit2, Trash2, Search, Check, AlertCircle } from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  _count?: { products: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form State for Create
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createDescription, setCreateDescription] = useState('')

  // Form State for Edit
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text })
    setTimeout(() => {
      setStatusMessage(null)
    }, 4000)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          slug: createSlug.trim() || undefined,
          description: createDescription.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create category')

      setCreateName('')
      setCreateSlug('')
      setCreateDescription('')
      setIsCreateModalOpen(false)
      showToast('success', `Category "${data.category?.name || 'New'}" created successfully!`)
      await fetchCategories()
    } catch (err: any) {
      showToast('error', err.message || 'Error creating category')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditDescription(cat.description || '')
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editName.trim(),
          slug: editSlug.trim(),
          description: editDescription.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update category')

      showToast('success', `Category "${data.category?.name}" updated successfully!`)
      setEditingCategory(null)
      await fetchCategories()
    } catch (err: any) {
      showToast('error', err.message || 'Error updating category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    const productCount = cat._count?.products || 0
    const warning = productCount > 0
      ? `Category "${cat.name}" has ${productCount} assigned products. Deleting it will unassign those products. Do you want to proceed?`
      : `Are you sure you want to permanently delete category "${cat.name}"?`

    if (!confirm(warning)) return

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete category')

      showToast('success', `Category "${cat.name}" deleted.`)
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting category')
    }
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl border animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
              : 'bg-red-950/90 text-red-300 border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
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
            Categories &amp; Collections
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Customize and edit your boutique departments, URL slugs, and luxury bridal collections.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateName('')
            setCreateSlug('')
            setCreateDescription('')
            setIsCreateModalOpen(true)
          }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories by name, slug, or keywords..."
          className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No categories found</p>
          <p className="text-xs text-zinc-500 mt-1">
            {search ? 'Try clearing your search query' : 'Create your first boutique category to organize products.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="inline-block mt-1 text-[10px] font-mono bg-zinc-800 text-amber-400/90 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      /{cat.slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditCategory(cat)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                  {cat.description || <span className="italic text-zinc-600">No description provided.</span>}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Products in Category:</span>
                <span className="font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-md">
                  {cat._count?.products || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create New Category</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Organize your ensembles into browsable departments.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value)
                    if (!createSlug || createSlug === createName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
                      setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                    }
                  }}
                  placeholder="e.g. Bridal Lehengas"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Custom URL Slug
                </label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="e.g. bridal-lehengas"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Used for SEO links and storefront filters: /category/{createSlug || '...'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Exquisite handwoven bridal couture with rich zardozi work..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Edit Category</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Modify category name, customize URL slug, or update description.
            </p>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Category Name"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Custom URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="category-slug"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Storefront URL identifier: /{editSlug}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Category summary..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
