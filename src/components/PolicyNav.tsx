'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, RotateCcw, Truck, FileText } from 'lucide-react'

export default function PolicyNav() {
  const pathname = usePathname()

  const links = [
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
    { href: '/refund-policy', label: 'Refund & Returns', icon: RotateCcw },
    { href: '/shipping-policy', label: 'Shipping Policy', icon: Truck },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-10 pb-4 border-b border-[#EADBCE]">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[#8A1A38] text-white shadow-xs'
                : 'bg-white text-[#7A6458] border border-[#EADBCE] hover:bg-[#F5EFE8] hover:text-[#3B1522]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

