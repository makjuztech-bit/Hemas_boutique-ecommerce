'use client'

import React, { useState, useEffect } from 'react'
import { Layers, Plus, X } from 'lucide-react'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create category')

      setName('')
      setDescription('')
      setIsModalOpen(false)
      await fetchCategories()
    } catch (err: any) {
      alert(err.message || 'Error creating category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Categories &amp; Collections
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organize sarees, lehengas, kurtis, and accessories into structured boutique departments.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No categories created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{cat.name}</h3>
                  <span className="text-[10px] font-mono bg-zinc-800 text-amber-400 px-2.5 py-0.5 rounded-full">
                    {cat.slug}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Products in Category:</span>
                <span className="font-bold text-zinc-200">{cat._count?.products || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create New Category</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Enter category title and brief department summary.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bridal Lehengas"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exquisite handwoven designs..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
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
    </div>
  )
}
