'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react'
import { HeroSlide } from '@/lib/storefrontConfig'

export type { HeroSlide }

export default function HeroSlider({
  slides = [],
  onSelectCategory,
}: {
  slides: HeroSlide[]
  onSelectCategory?: (slug: string) => void
}) {
  const activeSlides = slides.filter((s) => s.isActive)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure index is within bounds if activeSlides length changes
  const slideCount = activeSlides.length
  const currentSlide = activeSlides[currentIndex % (slideCount || 1)]

  const nextSlide = () => {
    if (slideCount <= 1) return
    setCurrentIndex((prev) => (prev + 1) % slideCount)
  }

  const prevSlide = () => {
    if (slideCount <= 1) return
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount)
  }

  // Auto-play slideshow (6 seconds)
  useEffect(() => {
    if (isPaused || slideCount <= 1) return

    timerRef.current = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, isPaused, slideCount])

  if (!currentSlide) {
    return null
  }

  return (
    <section
      className="relative overflow-hidden w-full min-h-[500px] sm:min-h-[560px] md:min-h-[640px] lg:min-h-[700px] flex items-end bg-zinc-950 text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images: Aligned to top so head/face of model is 100% visible */}
      {activeSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex
        const posClass =
          slide.imagePosition === 'center'
            ? 'object-center'
            : slide.imagePosition === 'bottom'
            ? 'object-bottom'
            : 'object-top' // Default: top aligned so head & face are never cropped

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image: Bright, crystal clear, anchored from the top */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className={`w-full h-full object-cover ${posClass} origin-top transition-transform duration-7000 ease-out ${
                isCurrent ? 'scale-[1.01]' : 'scale-100'
              }`}
            />
          </div>
        )
      })}

      {/* IDEA 2: Sleek Bottom Caption Bar (Leaves the whole image clear & unobstructed) */}
      <div className="relative z-20 w-full bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-20 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          
          {/* Collection Title & Subtitle */}
          <div className="space-y-2 max-w-2xl">
            {currentSlide.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/25 to-amber-600/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-400/40 shadow-xs backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{currentSlide.badge}</span>
              </div>
            )}

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
              {currentSlide.title}
            </h1>

            <p className="text-xs sm:text-sm text-rose-100/90 font-light leading-relaxed max-w-xl">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Right Section: Updated Boutique Trust Badges + CTA Button */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Updated Boutique Trust Badges (Removed Silk Mark & Weavers) */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-left shadow-md flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white tracking-wide">100% Quality Assured</h4>
                  <p className="text-[9px] text-zinc-300">Premium Boutique Fabrics</p>
                </div>
              </div>

              <div className="bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-left shadow-md flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white tracking-wide">Direct from Boutique</h4>
                  <p className="text-[9px] text-zinc-300">Dispatched within 24 Hours</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              {currentSlide.buttonLink?.startsWith('/') && !currentSlide.buttonLink.includes('?') ? (
                <Link
                  href={currentSlide.buttonLink}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black px-6 py-2.5 sm:px-7 sm:py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  <span>{currentSlide.buttonText || 'Explore Collection'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <a
                  href={currentSlide.buttonLink || '#catalog'}
                  onClick={(e) => {
                    if (currentSlide.buttonLink?.includes('category=')) {
                      const catSlug = currentSlide.buttonLink.split('category=')[1]
                      if (catSlug && onSelectCategory) {
                        e.preventDefault()
                        onSelectCategory(catSlug)
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black px-6 py-2.5 sm:px-7 sm:py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  <span>{currentSlide.buttonText || 'Explore Collection'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}

              <a
                href="#catalog"
                className="hidden sm:inline-flex bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-5 py-2.5 sm:py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                All Collections
              </a>
            </div>

          </div>

        </div>

        {/* Slide Indicators / Dots */}
        {slideCount > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-400/50'
                    : 'w-2 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {slideCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Banner Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Banner Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  )
}
