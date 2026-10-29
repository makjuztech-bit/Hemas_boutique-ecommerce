'use client'

import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Upload,
  CheckCircle,
  Eye,
  Megaphone,
  Tag,
  Link as LinkIcon,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { HeroSlide, DEFAULT_STOREFRONT_CONFIG } from '@/lib/storefrontConfig'

export default function AdminStorefrontBannersPage() {
  const [config, setConfig] = useState(DEFAULT_STOREFRONT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'hero' | 'announcement' | 'spotlight'>('hero')

  // Load current banner configuration
  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) {
        const data = await res.json()
        if (data.config) {
          setConfig(data.config)
        }
      }
    } catch (e) {
      console.error('Failed to load banner settings:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text })
    setTimeout(() => {
      setStatusMessage(null)
    }, 4000)
  }

  // Handle uploading background image for a specific slide
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSlideIndex(slideIndex)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('altText', `Hero Banner Slide ${slideIndex + 1}`)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const updatedSlides = [...config.heroSlides]
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        imageUrl: data.mediaAsset.secureUrl,
      }

      setConfig({ ...config, heroSlides: updatedSlides })
      showToast('success', `Slide ${slideIndex + 1} background photo updated!`)
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed')
    } finally {
      setUploadingSlideIndex(null)
    }
  }

  // Save all settings to backend
  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save changes')

      showToast('success', 'Storefront banners and main page offers published live!')
    } catch (err: any) {
      showToast('error', err.message || 'Error updating settings')
    } finally {
      setSaving(false)
    }
  }

  // Add new hero banner slide
  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      badge: 'New Collection & Offer',
      title: 'Grand Festive Silk Showcase',
      subtitle: 'Handcrafted luxury ethnic ensembles woven for celebratory occasions.',
      buttonText: 'Shop New Arrivals',
      buttonLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85',
      isActive: true,
    }

    setConfig({
      ...config,
      heroSlides: [...config.heroSlides, newSlide],
    })
    showToast('success', 'New banner slide added. Remember to click "Save All Changes"!')
  }

  // Remove slide
  const handleRemoveSlide = (slideIndex: number) => {
    if (config.heroSlides.length <= 1) {
      showToast('error', 'You must keep at least 1 hero banner slide.')
      return
    }

    const updatedSlides = config.heroSlides.filter((_, idx) => idx !== slideIndex)
    setConfig({ ...config, heroSlides: updatedSlides })
    showToast('success', 'Slide removed.')
  }

  // Update specific field in slide
  const handleUpdateSlideField = (index: number, field: keyof HeroSlide, value: any) => {
    const updated = [...config.heroSlides]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setConfig({ ...config, heroSlides: updated })
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-zinc-500 animate-pulse">
        Loading storefront customization settings...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast alert */}
      {statusMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all animate-bounce ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
              : 'bg-rose-950 border-rose-700 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>Storefront Banners &amp; Main Page Offers</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Customize header background images, create promotional discount offers, and showcase new boutique collections on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setConfig(DEFAULT_STOREFRONT_CONFIG)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
            title="Reset to Boutique Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Header Hero Slideshow ({config.heroSlides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'announcement'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Top Offer Announcement Bar</span>
        </button>

        <button
          onClick={() => setActiveTab('spotlight')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'spotlight'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Homepage Collection Spotlight</span>
        </button>
      </div>

      {/* TAB 1: HERO SLIDESHOW */}
      {activeTab === 'hero' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Header Background Banner Slides</h2>
              <p className="text-xs text-zinc-400">
                These slides appear in the full-width carousel on the homepage with high-resolution imagery.
              </p>
            </div>

            <button
              onClick={handleAddSlide}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner Slide</span>
            </button>
          </div>

          <div className="space-y-4">
            {config.heroSlides.map((slide, idx) => {
              const isUploading = uploadingSlideIndex === idx

              return (
                <div
                  key={slide.id || idx}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {slide.title || `Slide ${idx + 1}`}
                      </span>
                      {slide.isActive ? (
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Live Active
                        </span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slide.isActive}
                          onChange={(e) => handleUpdateSlideField(idx, 'isActive', e.target.checked)}
                          className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
                        />
                        <span>Show on Storefront</span>
                      </label>

                      <button
                        onClick={() => handleRemoveSlide(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Image Preview & Upload Column */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-300">
                        Background Image *
                      </label>

                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                        <img
                          src={slide.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c'}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white bg-black/80 px-2 py-1 rounded-md font-medium">
                            Slide Preview
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <input
                          type="url"
                          placeholder="Paste image URL (Unsplash, Cloudinary)..."
                          value={slide.imageUrl}
                          onChange={(e) => handleUpdateSlideField(idx, 'imageUrl', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                        />

                        <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer border border-zinc-700/60 transition-colors w-full">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>{isUploading ? 'Uploading Image...' : 'Upload Background File'}</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={(e) => handleSlideImageUpload(e, idx)}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Text & Offer Content Column */}
                    <div className="md:col-span-2 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">
                            Offer / Collection Badge Pill
                          </label>
                          <input
                            type="text"
                            value={slide.badge}
                            onChange={(e) => handleUpdateSlideField(idx, 'badge', e.target.value)}
                            placeholder="e.g. 2026 Bridal &amp; Festive Edit"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">
                            Main Headline Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={slide.title}
                            onChange={(e) => handleUpdateSlideField(idx, 'title', e.target.value)}
                            placeholder="e.g. Timeless Kanchipuram Silk Sarees"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none focus:border-amber-500 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">
                          Subtitle &amp; Offer Details
                        </label>
                        <textarea
                          rows={2}
                          value={slide.subtitle}
                          onChange={(e) => handleUpdateSlideField(idx, 'subtitle', e.target.value)}
                          placeholder="Short evocative description or discount details..."
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">
                            CTA Button Label
                          </label>
                          <input
                            type="text"
                            value={slide.buttonText}
                            onChange={(e) => handleUpdateSlideField(idx, 'buttonText', e.target.value)}
                            placeholder="e.g. Shop Pure Silks"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">
                            Target Link or Category
                          </label>
                          <input
                            type="text"
                            value={slide.buttonLink}
                            onChange={(e) => handleUpdateSlideField(idx, 'buttonLink', e.target.value)}
                            placeholder="/products?category=silk-sarees"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TOP ANNOUNCEMENT BAR */}
      {activeTab === 'announcement' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Top Notification &amp; Offer Ticker</h2>
              <p className="text-xs text-zinc-400">
                Displays the celebratory offer bar at the very top of all boutique pages.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.announcement.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, enabled: e.target.checked },
                  })
                }
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-white">Enable Top Bar</span>
            </label>
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Live Top Bar Preview
            </span>
            <div className="bg-[#8A1A38] text-white text-[11px] font-medium py-1.5 px-4 text-center rounded-lg flex flex-wrap items-center justify-center gap-3">
              <span>{config.announcement.text}</span>
              {config.announcement.couponCode && (
                <span className="bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  CODE: {config.announcement.couponCode}
                </span>
              )}
              {config.announcement.phone && (
                <span className="text-amber-300 font-semibold">
                  📞 {config.announcement.phone}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">
                Announcement Message Text *
              </label>
              <input
                type="text"
                value={config.announcement.text}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, text: e.target.value },
                  })
                }
                placeholder="e.g. ✨ Grand Festive Edit: Special Discounts on Authentic Pure Silks"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Highlight Coupon Code (Optional)
              </label>
              <input
                type="text"
                value={config.announcement.couponCode || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, couponCode: e.target.value },
                  })
                }
                placeholder="e.g. FESTIVE20"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500 uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Boutique Helpline Phone Number
              </label>
              <input
                type="text"
                value={config.announcement.phone || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, phone: e.target.value },
                  })
                }
                placeholder="e.g. 8056686443"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPOTLIGHT COLLECTION ON HOMEPAGE */}
      {activeTab === 'spotlight' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Homepage Collection Showcase</h2>
              <p className="text-xs text-zinc-400">
                Configure the headline and seasonal badge for new collections showcased on the main storefront.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.spotlight?.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    spotlight: { ...config.spotlight, enabled: e.target.checked },
                  })
                }
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-white">Show Spotlight</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Spotlight Badge Tag
              </label>
              <input
                type="text"
                value={config.spotlight?.tag || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    spotlight: { ...config.spotlight, tag: e.target.value },
                  })
                }
                placeholder="e.g. Artisanal Spotlight"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Showcase Heading Title *
              </label>
              <input
                type="text"
                value={config.spotlight?.title || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    spotlight: { ...config.spotlight, title: e.target.value },
                  })
                }
                placeholder="e.g. New Festive Arrivals"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">
                Showcase Subtitle Description
              </label>
              <input
                type="text"
                value={config.spotlight?.subtitle || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    spotlight: { ...config.spotlight, subtitle: e.target.value },
                  })
                }
                placeholder="e.g. Explore our latest boutique masterpieces, woven to perfection for every celebration."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
