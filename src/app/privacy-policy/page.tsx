import React from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import PolicyNav from '@/components/PolicyNav'
import { ShieldCheck, ArrowLeft, Mail, Phone, MapPin, Lock } from 'lucide-react'

export const metadata = {
  title: "Privacy Policy | Hema's Boutique",
  description: "Privacy policy and data protection practices for Hema's Boutique & hemasethnicwear.com.",
}

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B1522]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#7A6458] mt-2">
            Effective Date: March 8, 2026 | Last Updated: March 2026
          </p>
        </div>

        <PolicyNav />

        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A3B32]">
          <p>
            <strong>Hema&apos;s Boutique</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operating via <em>hemasethnicwear.com</em>, is deeply committed to protecting your privacy. This Privacy Policy outlines how your personal information is collected, safeguarded, and utilized when you visit or make a purchase from our boutique.
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              1. Information We Collect
            </h2>
            <p>
              When you browse our storefront, register an account, or order women&apos;s ethnic wear, we collect the following details:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Contact Information:</strong> Full name, mobile number (for secure OTP login and delivery coordination), and email address.
              </li>
              <li>
                <strong>Shipping &amp; Billing Address:</strong> Street address, city, state, postal PIN code, and landmark to ensure accurate doorstep delivery.
              </li>
              <li>
                <strong>Sizing &amp; Tailoring Preferences:</strong> Garment sizes, bespoke blouse measurements, or custom requests entered during ordering.
              </li>
              <li>
                <strong>Payment Information:</strong> All financial transactions are processed securely through our RBI-authorized, PCI-DSS compliant payment partner, <strong>Razorpay</strong>. We never store, process, or view your complete credit/debit card numbers or CVV.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To confirm, process, tailor, and dispatch your boutique orders.</li>
              <li>To transmit order status updates, AWB tracking codes, and delivery notifications via SMS or WhatsApp.</li>
              <li>To address customer concierge inquiries and support requests.</li>
              <li>To prevent fraudulent transactions and safeguard against payment anomalies.</li>
              <li>To share seasonal boutique collections or exclusive festival promotions (only if you have opted in).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>3. Data Protection &amp; Security</span>
            </h2>
            <p>
              We implement industry-standard encryption protocols (HTTPS/TLS) across our entire platform. Customer records are stored in secure databases protected by multi-factor authentication, row-level access controls, and rate-limiting safeguards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              4. Third-Party Service Providers
            </h2>
            <p>
              We partner with trusted third-party service providers solely to perform essential fulfillment operations:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Payment Gateways:</strong> Razorpay (for encrypted card, UPI, and banking transactions).
              </li>
              <li>
                <strong>Logistics &amp; Courier Partners:</strong> Shiprocket and partner couriers (Blue Dart, Delhivery, DTDC) to fulfill package dispatch and tracking.
              </li>
              <li>
                <strong>Communication Channels:</strong> MSG91 / Firebase for OTP verification and transactional SMS.
              </li>
            </ul>
            <p className="text-xs text-[#7A6458]">
              We strictly <strong>never sell, lease, or monetize</strong> your personal contact information to third-party marketing agencies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              5. Your Privacy Rights
            </h2>
            <p>
              You have the right to access, review, modify, or request the deletion of your personal account data at any time. To request data updates or account deletion, please email our privacy team directly at <strong>hemasethnicwear@gmail.com</strong>.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-[#FAF4EC] rounded-2xl border border-[#EADBCE] p-6 space-y-3 mt-8">
            <h3 className="font-serif text-base font-bold text-[#3B1522]">
              Contacting Our Privacy Team
            </h3>
            <p className="text-xs text-[#7A6458]">
              If you have any questions about our privacy practices, please contact us:
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

