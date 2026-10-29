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
      className="relative overflow-hidden w-full min-h-[460px] sm:min-h-[520px] md:min-h-[580px] flex items-center bg-zinc-950 text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with smooth fade/scale transition */}
      {activeSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex
        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className={`w-full h-full object-cover object-center transition-transform duration-10000 ease-out ${
                isCurrent ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Dark & Brand Burgundy Gradient Overlay for premium luxury legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#4A1222]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30"></div>
          </div>
        )
      })}

      {/* Content Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-20 w-full flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-2xl text-center md:text-left space-y-4">
          {/* Badge */}
          {currentSlide.badge && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400/25 to-amber-600/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-400/40 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
            {currentSlide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-rose-100/90 font-light leading-relaxed max-w-xl">
            {currentSlide.subtitle}
          </p>

          {/* CTA Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
            {currentSlide.buttonLink?.startsWith('/') && !currentSlide.buttonLink.includes('?') ? (
              <Link
                href={currentSlide.buttonLink}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer"
              >
                <span>{currentSlide.buttonText || 'Explore Creations'}</span>
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer"
              >
                <span>{currentSlide.buttonText || 'Explore Creations'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}

            <a
              href="#catalog"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-6 py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Browse All Weaves
            </a>
          </div>
        </div>

        {/* Heritage Trust Badges */}
        <div className="hidden lg:grid grid-cols-2 gap-3.5 w-full max-w-xs shrink-0">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shadow-lg hover:border-amber-400/40 transition-colors">
            <ShieldCheck className="w-6 h-6 text-amber-300 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-white tracking-wide">100% Authentic</h4>
            <p className="text-[10px] text-rose-200/80 mt-0.5">Silk Mark Certified Weaves</p>
          </div>
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shadow-lg hover:border-amber-400/40 transition-colors">
            <Clock className="w-6 h-6 text-amber-300 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-white tracking-wide">Direct Weavers</h4>
            <p className="text-[10px] text-rose-200/80 mt-0.5">Dispatched within 24 Hours</p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (visible when more than 1 slide) */}
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

      {/* Slide Indicators / Dots */}
      {slideCount > 1 && (
        <div className="absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-8 h-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-400/50'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
