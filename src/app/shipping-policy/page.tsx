import React from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import PolicyNav from '@/components/PolicyNav'
import { Truck, ArrowLeft, Mail, Phone, MapPin, Clock, ShieldCheck, Globe } from 'lucide-react'

export const metadata = {
  title: "Shipping & Delivery Policy | Hema's Boutique",
  description: "Shipping timelines, delivery rates, and courier dispatch policy for Hema's Boutique.",
}

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2D2421]">
      {/* Header */}
      <header className="bg-white border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[#8A1A38] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold text-[#8A1A38]">Back to Storefront</span>
          </Link>

          <Link href="/" className="font-serif text-xl font-bold text-[#4A1525]">
            Hema&apos;s Boutique
          </Link>

          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8A1A38]/10 text-[#8A1A38] mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B1522]">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-[#7A6458] mt-2">
            Effective Date: March 8, 2026 | Last Updated: March 2026
          </p>
        </div>

        <PolicyNav />

        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A3B32]">
          <p>
            At <strong>Hema&apos;s Boutique</strong>, every garment is carefully folded, wrapped in protective parchment sleeves, and boxed to ensure it reaches you in pristine condition directly from our Kanchipuram flagship boutique.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EADBCE] space-y-2">
              <div className="flex items-center gap-2 text-[#3B1522] font-bold">
                <Clock className="w-4 h-4 text-[#8A1A38]" />
                <span>Order Processing Timelines</span>
              </div>
              <ul className="text-xs space-y-1.5 text-[#4A3B32]">
                <li>
                  <strong>Ready-to-Ship Kurtis &amp; Feeding Wear:</strong> Dispatched within <strong>1 to 2 business days</strong>.
                </li>
                <li>
                  <strong>Ethnic Sets &amp; Anarkalis:</strong> Dispatched within <strong>2 to 3 business days</strong>.
                </li>
                <li>
                  <strong>Custom Tailored Orders:</strong> Dispatched within <strong>3 to 5 business days</strong> following measurement confirmation.
                </li>
              </ul>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EADBCE] space-y-2">
              <div className="flex items-center gap-2 text-[#3B1522] font-bold">
                <Globe className="w-4 h-4 text-[#8A1A38]" />
                <span>Estimated Delivery Timelines</span>
              </div>
              <ul className="text-xs space-y-1.5 text-[#4A3B32]">
                <li>
                  <strong>Tamil Nadu &amp; South India:</strong> 2 to 4 business days.
                </li>
                <li>
                  <strong>Rest of India (Metro &amp; Non-Metro):</strong> 3 to 7 business days.
                </li>
                <li>
                  <strong>International Shipping:</strong> 7 to 15 business days (customs clearance times vary by destination country).
                </li>
              </ul>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Shipping Rates &amp; Free Shipping
            </h2>
            <p>
              Shipping fees are calculated automatically at checkout based on destination pincode and volumetric package weight. We offer <strong>Complimentary Free Shipping across India</strong> on all eligible orders over ₹1,999.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8A1A38]" />
              <span>Real-Time Courier Tracking</span>
            </h2>
            <p>
              We partner with premier logistics aggregators powered by <strong>Shiprocket</strong>, routing your packages through Tier-1 carriers including <strong>Blue Dart, Delhivery, DTDC, and India Post Speed Post</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Once your package is packed and handed to the courier, an AWB tracking code will be shared with you via SMS and WhatsApp.</li>
              <li>You can also track your live package status directly inside your account on our website at <Link href="/orders" className="text-[#8A1A38] font-semibold underline">hemasethnicwear.com/orders</Link>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Transit Delays &amp; Courier Exceptions
            </h2>
            <p>
              While 98% of shipments arrive well before the scheduled delivery date, Hema&apos;s Boutique is not liable for delays arising from unexpected logistical disruptions, regional weather events, national holidays, flight delays, or statutory customs clearance processes.
            </p>
            <p className="text-xs text-[#7A6458]">
              In case of a delayed parcel, our dedicated concierge team will proactively follow up with courier regional hubs to expedite delivery.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-[#FAF4EC] rounded-2xl border border-[#EADBCE] p-6 space-y-3 mt-8">
            <h3 className="font-serif text-base font-bold text-[#3B1522]">
              Shipping Concierge Inquiries
            </h3>
            <p className="text-xs text-[#7A6458]">
              Need urgent express delivery for an upcoming wedding or festival? Contact us directly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <a
                href="tel:+918056686443"
                className="flex items-center gap-2 text-[#3B1522] hover:text-[#8A1A38] font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-[#8A1A38]" />
                <span>+91 80566 86443</span>
              </a>
              <a
                href="mailto:hemasethnicwear@gmail.com"
                className="flex items-center gap-2 text-[#3B1522] hover:text-[#8A1A38] font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-[#8A1A38]" />
                <span>hemasethnicwear@gmail.com</span>
              </a>
              <div className="flex items-start gap-2 text-[#3B1522] sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-[#8A1A38] shrink-0 mt-0.5" />
                <span>No 33A, Vallal Pachayappan Street, Near Cinderella Scan, Kanchipuram - 631502, Tamil Nadu.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

