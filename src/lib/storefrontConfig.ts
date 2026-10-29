export type HeroSlide = {
  id: string
  badge: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  imageUrl: string
  isActive: boolean
}

export type StorefrontConfig = {
  announcement: {
    enabled: boolean
    text: string
    couponCode: string
    phone: string
    link: string
  }
  heroSlides: HeroSlide[]
  spotlight: {
    enabled: boolean
    tag: string
    title: string
    subtitle: string
  }
}

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  announcement: {
    enabled: true,
    text: "✨ Grand Festive Edit: Special Discounts on Authentic Pure Kanchipuram Silks & Bridal Wear",
    couponCode: "FESTIVE20",
    phone: "8056686443",
    link: "/products?category=silk-sarees",
  },
  heroSlides: [
    {
      id: "slide-1",
      badge: "2026 Bridal & Festive Edit",
      title: "Timeless Kanchipuram Silk Sarees",
      subtitle: "Pure zari handloom weaves, handcrafted by master artisans for royal wedding ceremonies.",
      buttonText: "Shop Pure Silks",
      buttonLink: "/products?category=silk-sarees",
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85",
      isActive: true,
    },
    {
      id: "slide-2",
      badge: "Limited Celebration Offers",
      title: "Handcrafted Royal Bridal Lehengas",
      subtitle: "Opulent velvet and raw silk with intricate zardozi, gota patti and resham embroidery.",
      buttonText: "Explore Bridal Sets",
      buttonLink: "/products?category=bridal-lehengas",
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=85",
      isActive: true,
    },
    {
      id: "slide-3",
      badge: "New Season Arrivals",
      title: "Graceful Chanderi & Feeding Kurtis",
      subtitle: "Boutique everyday luxury and maternity-friendly designs with concealed feeding zips.",
      buttonText: "Discover Kurtis",
      buttonLink: "/products?category=designer-kurtis",
      imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1920&q=85",
      isActive: true,
    },
  ],
  spotlight: {
    enabled: true,
    tag: "Artisanal Spotlight",
    title: "New Festive Arrivals",
    subtitle: "Explore our latest boutique masterpieces, woven to perfection for every celebration.",
  },
}
