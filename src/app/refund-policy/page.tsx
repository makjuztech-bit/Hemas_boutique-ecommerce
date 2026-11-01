import React from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import PolicyNav from '@/components/PolicyNav'
import { RotateCcw, ArrowLeft, Mail, Phone, MapPin, Video, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export const metadata = {
  title: "Refund & Return Policy | Hema's Boutique",
  description: "Comprehensive refund, return, and cancellation policy for women's ethnic wear at Hema's Boutique.",
}

export default function RefundPolicyPage() {
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
            <RotateCcw className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B1522]">
            Refund &amp; Return Policy
          </h1>
          <p className="text-xs text-[#7A6458] mt-2">
            Effective Date: March 8, 2026 | Last Updated: March 2026
          </p>
        </div>

        <PolicyNav />

        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A3B32]">
          <p>
            At <strong>Hema&apos;s Boutique</strong>, each saree, lehenga, kurti, and ethnic ensemble undergoes multi-point hand inspection prior to dispatch. However, in the rare event of a genuine defect or transit issue, returns and replacements are accommodated strictly under the terms outlined below.
          </p>

          {/* Mandatory Unboxing Video Alert */}
          <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
              <Video className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Mandatory 360-Degree Unboxing Video Requirement</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              To be eligible for any return, replacement, or refund claim, <strong>a continuous, unedited 360-degree unboxing video is strictly mandatory</strong>.
            </p>
            <div className="bg-white/80 rounded-xl p-4 border border-amber-200 text-xs space-y-2 text-amber-950">
              <p className="font-semibold text-amber-900">The video recording must clearly show:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The intact, sealed courier box or polybag with the shipping label clearly visible before opening.</li>
                <li>The continuous unpacking process from start to finish without any cuts, pauses, or camera transitions.</li>
                <li>The garment unfolded in good lighting, showing the defect, transit damage, or incorrect product clearly.</li>
              </ul>
              <p className="font-bold text-rose-700 pt-1">
                ⚠️ Without a complete unedited unboxing video, refund or replacement requests cannot be entertained under any circumstance.
              </p>
            </div>
          </div>

          {/* Eligible vs Not Eligible */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Eligible */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-emerald-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Eligible for Return / Replacement</span>
              </div>
              <ul className="text-xs space-y-2 text-[#4A3B32]">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Manufacturing Defect:</strong> Major fabric tear, weaving rupture, or broken feeding zipper existing prior to wearing.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Transit Damage:</strong> Package physically crushed or torn in courier transit.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Wrong Item:</strong> An incorrect design or entirely different ensemble was delivered.</span>
                </li>
              </ul>
            </div>

            {/* Not Eligible */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-rose-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Not Eligible for Return</span>
              </div>
              <ul className="text-xs space-y-2 text-[#4A3B32]">
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Change of Mind:</strong> Personal preference changes or event cancellations.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Size / Fit Preferences:</strong> Where the delivered garment matches the measurements of the size chart chosen at checkout.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Color / Handloom Nuances:</strong> Slight 5-10% natural shade variation due to photographic lighting or handloom silk yarn luster.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Used / Altered Items:</strong> Clothes that have been worn, washed, perfume-scented, dry cleaned, or altered.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Customized Couture:</strong> Sarees with fall/pico, attached tassels, or customized stitched blouses.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span><strong>Sale / Promotional Items:</strong> Festival clearances or discounted seasonal sales.</span>
                </li>
              </ul>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Return Request Timeline
            </h2>
            <p>
              Return requests must be initiated within <strong>48 hours of parcel delivery</strong> as recorded by the courier tracking status. Requests received after 48 hours cannot be processed due to the delicate nature of pure silk and artisanal festive wear.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Condition of Returned Garments
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The garment must be completely unused, unworn, unwashed, and free of any odor, makeup, or perfume.</li>
              <li>All original boutique brand tags, silk mark tags, folds, and plastic sleeves must remain intact and attached.</li>
              <li>The item must be repacked securely in the original box to prevent transit damage during the return journey.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Refund &amp; Replacement Process
            </h2>
            <p>
              Once your return package reaches our Kanchipuram facility, our master craftsman team will inspect the garment and compare it against your unboxing video:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Upon approval, a replacement will be dispatched within 48 hours, or a refund will be initiated.</li>
              <li>Refunds are credited directly to your original payment method (Bank/UPI/Card) within <strong>5 to 7 business days</strong>.</li>
              <li>Original forward shipping charges are non-refundable.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#3B1522] border-b border-[#F0E4D8] pb-2">
              Return Shipping Logistics
            </h2>
            <p>
              Customers are responsible for courier return shipping charges unless the issue is independently verified as a manufacturing defect or wrong shipment sent by our boutique.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-[#FAF4EC] rounded-2xl border border-[#EADBCE] p-6 space-y-3 mt-8">
            <h3 className="font-serif text-base font-bold text-[#3B1522]">
              How to Raise a Return Request
            </h3>
            <p className="text-xs text-[#7A6458]">
              Send your Order ID, explanation, and the <strong>mandatory unboxing video</strong> via WhatsApp or email:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <a
                href="https://wa.me/918056686443?text=Hi%20Hema's%20Boutique,%20I%20would%20like%20to%20raise%20a%20return%20request%20with%20my%20unboxing%20video."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#25D366] hover:text-[#1eb857] font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp Video: +91 80566 86443</span>
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
                <span>Hema&apos;s Boutique, No 33A, Vallal Pachayappan Street, Near Cinderella Scan, Kanchipuram - 631502, Tamil Nadu.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

