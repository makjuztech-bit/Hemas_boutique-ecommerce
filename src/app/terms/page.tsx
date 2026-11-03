import React from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import PolicyNav from '@/components/PolicyNav'
import { FileText, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export const metadata = {
  title: "Terms of Service | Hema's Boutique",
  description: "Terms and Conditions for purchasing women's designer kurtis, maternity feeding wear, and ethnic apparel at Hema's Boutique.",
}

export default function TermsPage() {
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
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B1522]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#7A6458] mt-2">
            Effective Date: March 8, 2026 | Last Updated: March 2026
          </p>
        </div>

        <PolicyNav />

        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A3B32]">
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              1. General &amp; Acceptance
            </h2>
            <p>
              Welcome to <strong>Hema&apos;s Boutique</strong> (operating under <em>hemasethnicwear.com</em>). By accessing, browsing, or purchasing through our website or physical showroom, you agree to comply with and be bound by the following Terms of Service.
            </p>
            <p>
              Hema&apos;s Boutique specializes in designer kurtis, festive anarkalis, maternity feeding zip wear, ethnic sets, and handcrafted women&apos;s ethnic wear. We reserve the right to revise or update these terms at any time without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              2. Product Craftsmanship &amp; Representation
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Craftsmanship Characteristics:</strong> Our ethnic kurtis and feeding wear collections are tailored with meticulous attention to detail. Subtle natural variations in fabric texture, print placement, or artisanal embroidery are the hallmark of boutique craftsmanship and are not considered defects.
              </li>
              <li>
                <strong>Color Variations:</strong> We take meticulous care to capture accurate colors in natural lighting. However, slight variations in shade may occur depending on individual mobile or monitor screen resolutions and fabric light reflection.
              </li>
              <li>
                <strong>Sizing &amp; Fitting:</strong> Standard size guides are provided on product pages. Please review measurements carefully prior to placing your order.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              3. Pricing &amp; Payments
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise.
              </li>
              <li>
                Prices are subject to revision based on seasonal collections and fabric market fluctuations.
              </li>
              <li>
                Payments must be completed online prior to dispatch via our secure payment gateway partner, <strong>Razorpay</strong> (supporting UPI, Credit/Debit Cards, Net Banking, and Wallets). We do not accept Cash on Delivery (COD).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              4. Order Acceptance &amp; Customizations
            </h2>
            <p>
              Upon placing an order, you will receive an electronic confirmation with your unique order number. We reserve the right to cancel or refuse any order due to unforeseen inventory limitations or payment verification failures, in which case a 100% full refund will be processed immediately.
            </p>
            <p>
              Orders featuring customized blouse stitching, fall/pico finishes, or custom alterations cannot be cancelled or refunded once stitching work has commenced.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              5. Shipping &amp; Logistics
            </h2>
            <p>
              Shipments are fulfilled through trusted courier aggregators (Shiprocket, Delhivery, Blue Dart, DTDC). Once dispatched, real-time AWB tracking numbers will be provided. Hema&apos;s Boutique is not liable for transit delays caused by regional holidays, natural calamities, or customs clearance (for international dispatches).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              6. Intellectual Property
            </h2>
            <p>
              All imagery, graphics, designs, descriptions, logos, and digital branding displayed on this platform are the exclusive intellectual property of Hema&apos;s Boutique. Unauthorized reproduction, commercial distribution, or copying is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              7. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any legal dispute arising out of or related to our services shall be subject to the exclusive jurisdiction of the competent courts in Kanchipuram / Chennai, Tamil Nadu.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-[#FAF4EC] rounded-2xl border border-[#EADBCE] p-6 space-y-3 mt-8">
            <h3 className="font-serif text-base font-bold text-[#3B1522]">
              Customer Care &amp; Grievance Redressal
            </h3>
            <p className="text-xs text-[#7A6458]">
              For any questions regarding our terms, orders, or policies, please reach out to our team:
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

