import React from 'react'
import Link from 'next/link'
import BrandLogo from './BrandLogo'
import { MapPin, Phone, MessageCircle, Mail, Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#2D1B22] text-[#E8D9CE] py-14 px-4 sm:px-6 lg:px-8 mt-16 border-t border-[#422933]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1: Brand & Craftsmanship */}
        <div className="space-y-4">
          <BrandLogo size="md" variant="dark" href="/" subtitle="Women's Tex Valley" />
          <p className="text-xs text-[#C9B4A7] leading-relaxed">
            Celebrating heritage Indian handloom craftsmanship, pure Kanchipuram silk sarees, bespoke bridal couture, and maternity feeding zip collections.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Pure Zari &amp; Handloom Certified</span>
          </div>
        </div>

        {/* Col 2: Flagship Boutique Store Address */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Visit Our Boutique</span>
          </h4>
          <address className="not-italic text-xs text-[#C9B4A7] leading-relaxed space-y-1.5">
            <p className="font-semibold text-white">Hema&apos;s Boutique</p>
            <p>No 33a, Vallal Pachayappan Street,</p>
            <p>Near Cinderella Scan,</p>
            <p>Kanchipuram - 631502, Tamil Nadu.</p>
          </address>
          <a
            href="https://www.google.com/maps/search/?api=1&query=No+33a+vallal+pachayappan+street+near+Cinderella+scan+kanchipuram+631502"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Open in Google Maps →</span>
          </a>
        </div>

        {/* Col 3: Customer Concierge & Direct Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-400" />
            <span>Customer Concierge</span>
          </h4>
          <ul className="space-y-3 text-xs text-[#C9B4A7]">
            <li>
              <a
                href="tel:+918056686443"
                className="flex items-center gap-2.5 text-white hover:text-amber-400 font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+91 80566 86443</span>
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/918056686443?text=Hello%20Hema's%20Boutique,%20I%20would%20like%20to%20inquire%20about%20your%20collection."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[#25D366] hover:text-[#2fe671] font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp: +91 80566 86443</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@hemasboutique.com"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>contact@hemasboutique.com</span>
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-[11px] text-[#A68F81] pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Mon - Sat: 10:00 AM - 8:30 PM IST</span>
            </li>
          </ul>
        </div>

        {/* Col 4: Quick Navigation Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
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
                Shopping Bag
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

          <div className="mt-5 pt-3 border-t border-[#422933] flex items-center gap-2 text-[11px] text-[#A68F81]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Secure 100% Online Payments</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#422933] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A68F81] gap-3">
        <p>
          &copy; {currentYear} Hema&apos;s Boutique. Crafted with artisanal luxury and love.
        </p>
        <p className="flex items-center gap-1.5">
          <span>Kanchipuram Silk Heritage</span>
          <span>&bull;</span>
          <span>Handcrafted in Tamil Nadu</span>
        </p>
      </div>
    </footer>
  )
}
