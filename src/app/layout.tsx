import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#8A1A38",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Hema's Boutique | Luxury Handcrafted Sarees & Bridal Lehengas",
    template: "%s | Hema's Boutique",
  },
  description:
    "Discover authentic handcrafted Kanchipuram silk sarees, Banarasi georgettes, royal bridal lehengas, and bespoke festive ethnic couture at Hema's Boutique. Flagship store at Vallal Pachayappan Street, Kanchipuram.",
  keywords: [
    "Hema's Boutique",
    "Kanchipuram Silk Sarees",
    "Bridal Lehenga",
    "Banarasi Sarees",
    "Indian Ethnic Wear",
    "Handloom Sarees",
    "Bridal Couture",
    "Kanchipuram Boutique",
    "Vallal Pachayappan Street",
    "Women's Tex Valley",
  ],
  authors: [{ name: "Hema's Boutique" }],
  creator: "Hema's Boutique",
  publisher: "Hema's Boutique",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "Hema's Boutique | Royal Silk Sarees & Bridal Lehengas",
    description:
      "Exclusive Indian handcrafted luxury sarees and bridal couture. Woven with pure zari and timeless craftsmanship.",
    siteName: "Hema's Boutique",
    images: [
      {
        url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Hema's Boutique Silk Ensemble",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hema's Boutique | Royal Silk Sarees & Bridal Lehengas",
    description: "Exclusive Indian handcrafted luxury sarees and bridal couture.",
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
