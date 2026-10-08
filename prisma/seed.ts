import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding comprehensive boutique data...')

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@hemasboutique.com' },
    update: {
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: 'admin@hemasboutique.com',
      firstName: 'Hema',
      lastName: 'Admin',
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  })

  // 2. Create Demo Customer
  const customerPassword = await bcrypt.hash('Customer@123', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@hemasboutique.com' },
    update: {
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
    },
    create: {
      email: 'customer@hemasboutique.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      mobileNumber: '+919876543210',
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
      emailVerified: new Date(),
    },
  })

  // 3. Categories
  const categoriesData = [
    {
      name: 'Silk Sarees',
      slug: 'silk-sarees',
      description: 'Handwoven pure Kanchipuram and Banarasi silk sarees with intricate zari borders.',
    },
    {
      name: 'Bridal Lehengas',
      slug: 'bridal-lehengas',
      description: 'Opulent wedding lehengas adorned with hand embroidery, sequins, and pearls.',
    },
    {
      name: 'Designer Kurtis & Anarkalis',
      slug: 'designer-kurtis',
      description: 'Chic everyday and festive ethnic sets crafted in georgette, silk, and chanderi.',
    },
    {
      name: 'Handloom & Daily Wear',
      slug: 'handloom-daily-wear',
      description: 'Breathable organic cotton, linen, and kalamkari sarees for comfort and elegance.',
    },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    })
    createdCategories[cat.slug] = c.id
  }

  // 4. Products Data
  const products = [
    {
      name: 'Royal Crimson Kanchipuram Pure Silk Saree',
      slug: 'royal-crimson-kanchipuram-pure-silk-saree',
      description: 'Exquisite crimson red bridal Kanchipuram silk saree featuring 24k gold zari woven temple motifs, rich brocade pallu, and matching blouse piece.',
      categorySlug: 'silk-sarees',
      price: 1450000, // ₹14,500
      salePrice: 1299900, // ₹12,999
      stock: 8,
      sku: 'HB-KAN-001',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Midnight Blue Banarasi Georgette Saree',
      slug: 'midnight-blue-banarasi-georgette-saree',
      description: 'Lightweight flowy Banarasi georgette draped in deep navy blue with intricate kadwa silver floral jaal and scalloped border.',
      categorySlug: 'silk-sarees',
      price: 980000, // ₹9,800
      salePrice: 850000, // ₹8,500
      stock: 12,
      sku: 'HB-BAN-002',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Gulabi Rani Handcrafted Bridal Velvet Lehenga',
      slug: 'gulabi-rani-handcrafted-bridal-velvet-lehenga',
      description: 'Magnificent bridal masterpiece in rani pink micro-velvet featuring intricate zardozi, dabka, and crystal embellishments with dual net dupattas.',
      categorySlug: 'bridal-lehengas',
      price: 4500000, // ₹45,000
      salePrice: 3899900, // ₹38,999
      stock: 4,
      sku: 'HB-LEH-003',
      imageUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Emerald Sage Embroidered Pastel Lehenga Set',
      slug: 'emerald-sage-embroidered-pastel-lehenga-set',
      description: 'Dreamy pastel sage green lehenga adorned with tonal sequins and mirror work, paired with a plunging neckline blouse and ruffle dupatta.',
      categorySlug: 'bridal-lehengas',
      price: 2850000, // ₹28,500
      salePrice: 2499900, // ₹24,999
      stock: 6,
      sku: 'HB-LEH-004',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Chanderi Silk Flared Anarkali Suit Set',
      slug: 'chanderi-silk-flared-anarkali-suit-set',
      description: 'Graceful mustard yellow floor-length Chanderi silk anarkali with gota patti detailing, paired with churidar and organza floral dupatta.',
      categorySlug: 'designer-kurtis',
      price: 649900, // ₹6,499
      salePrice: 529900, // ₹5,299
      stock: 15,
      sku: 'HB-KUR-005',
      imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Kalamkari Handblock Pure Cotton Saree',
      slug: 'kalamkari-handblock-pure-cotton-saree',
      description: 'Authentic Andhra organic cotton saree hand-painted using natural vegetable dyes showcasing traditional mythological motifs.',
      categorySlug: 'handloom-daily-wear',
      price: 380000, // ₹3,800
      salePrice: 320000, // ₹3,200
      stock: 20,
      sku: 'HB-COT-006',
      imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    },
  ]

  for (const p of products) {
    const categoryId = createdCategories[p.categorySlug]

    // Create or update media asset
    const media = await prisma.mediaAsset.upsert({
      where: { publicId: `media-${p.sku}` },
      update: { secureUrl: p.imageUrl },
      create: {
        publicId: `media-${p.sku}`,
        secureUrl: p.imageUrl,
        altText: p.name,
      },
    })

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        categoryId,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId,
      },
    })

    // Upsert variant
    const variant = await prisma.productVariant.upsert({
      where: { sku: p.sku },
      update: {
        price: p.price,
        salePrice: p.salePrice,
        stockQuantity: p.stock,
      },
      create: {
        productId: product.id,
        sku: p.sku,
        price: p.price,
        salePrice: p.salePrice,
        stockQuantity: p.stock,
      },
    })

    // Connect media
    await prisma.productMedia.upsert({
      where: {
        productId_mediaAssetId: {
          productId: product.id,
          mediaAssetId: media.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        mediaAssetId: media.id,
        sortOrder: 0,
      },
    })
  }

  console.log('Seeding complete! Admin and Customer accounts ready.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
