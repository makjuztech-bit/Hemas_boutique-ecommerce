import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark'
  showText?: boolean
  subtitle?: string
  href?: string | null
  className?: string
}

export default function BrandLogo({
  size = 'md',
  variant = 'light',
  showText = true,
  subtitle = "Women's Tex Valley",
  href = '/',
  className = '',
}: BrandLogoProps) {
  // Dimensions for the emblem
  const dimensions = {
    sm: { width: 36, height: 36, textTitle: 'text-base', textSub: 'text-[9px]' },
    md: { width: 48, height: 48, textTitle: 'text-xl', textSub: 'text-[10px]' },
    lg: { width: 64, height: 64, textTitle: 'text-2xl', textSub: 'text-xs' },
    xl: { width: 96, height: 96, textTitle: 'text-3xl', textSub: 'text-sm' },
  }[size]

  const emblem = (
    <div
      className={`relative rounded-xl overflow-hidden shadow-md shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
        variant === 'dark'
          ? 'border-amber-500/40 shadow-amber-500/10 bg-black'
          : 'border-amber-600/30 shadow-black/10 bg-black'
      }`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <Image
        src="/logo.png"
        alt="Hema's Boutique - Women's Tex Valley Logo"
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  )

  const content = (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      {emblem}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-serif font-bold tracking-tight block leading-tight ${dimensions.textTitle} ${
              variant === 'dark' ? 'text-white' : 'text-[#3B1522]'
            }`}
          >
            Hema&apos;s
          </span>
          <span
            className={`font-semibold uppercase tracking-widest ${dimensions.textSub} ${
              variant === 'dark' ? 'text-amber-400' : 'text-[#8A1A38]'
            }`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}
