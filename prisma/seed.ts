import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding sample data...')

  // Create super admin
  const superAdminPassword = await bcrypt.hash('Admin@123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@hemasboutique.com' },
    update: {},
    create: {
      email: 'admin@hemasboutique.com',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  })

  // Create category
  const category = await prisma.category.upsert({
    where: { slug: 'sarees' },
    update: {},
    create: {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Elegant traditional sarees.',
    },
  })

  // Create product
  const product = await prisma.product.upsert({
    where: { slug: 'sample-silk-saree' },
    update: {},
    create: {
      name: 'Sample Silk Saree',
      slug: 'sample-silk-saree',
      description: 'A beautiful sample silk saree.',
      categoryId: category.id,
      variants: {
        create: [
          {
            sku: 'SAREE-SILK-001',
            price: 500000, // 5000.00 INR
            stockQuantity: 10,
          },
        ],
      },
    },
  })

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { key: 'contact_details' },
    update: {},
    create: {
      key: 'contact_details',
      value: JSON.stringify({ email: 'contact@hemasboutique.com', phone: '+919999999999' })
    }
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
