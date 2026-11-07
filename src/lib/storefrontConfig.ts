export type HeroSlide = {
  id: string
  badge: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  imageUrl: string
  isActive: boolean
  imagePosition?: 'top' | 'center' | 'bottom'
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
    text: "✨ Grand Festive Edit: Special Offers on Designer Kurtis, Feeding Wear & Ethnic Suits",
    couponCode: "FESTIVE20",
    phone: "8056686443",
    link: "/products?category=designer-kurtis",
  },
  heroSlides: [
    {
      id: "slide-1",
      badge: "2026 Festive Collection",
      title: "Designer Kurtis & Festive Anarkalis",
      subtitle: "Handcrafted ethnic silhouettes, delicate threadwork, and rich georgette fabrics designed for elegance.",
      buttonText: "Shop Designer Kurtis",
      buttonLink: "/products?category=designer-kurtis",
      imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&q=90",
      isActive: true,
      imagePosition: "top",
    },
    {
      id: "slide-2",
      badge: "Signature Boutique Specialty",
      title: "Maternity & Feeding Zip Ensembles",
      subtitle: "Comfortable, stylish everyday and festive wear crafted with discreet, skin-friendly concealed feeding zips.",
      buttonText: "Explore Feeding Wear",
      buttonLink: "/products?category=maternity-feeding-wear",
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=90",
      isActive: true,
      imagePosition: "top",
    },
    {
      id: "slide-3",
      badge: "Everyday Luxury",
      title: "Handcrafted Daily Wear & Ethnic Co-ords",
      subtitle: "Breathable pure cotton, chanderi, and contemporary cuts tailored for graceful comfort all day long.",
      buttonText: "View Collection",
      buttonLink: "/products?category=handloom-daily-wear",
      imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1920&q=90",
      isActive: true,
      imagePosition: "top",
    },
  ],
  spotlight: {
    enabled: true,
    tag: "Boutique Spotlight",
    title: "New Festive Arrivals",
    subtitle: "Explore our latest handcrafted women's kurtis, feeding wear, and ethnic ensembles for every occasion.",
  },
}
