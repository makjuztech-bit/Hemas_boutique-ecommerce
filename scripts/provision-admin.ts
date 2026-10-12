import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const firstName = process.env.ADMIN_FIRST_NAME || 'Super'
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin'

  if (!email || !password) {
    console.error('Error: Please provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.')
    console.error('Usage: ADMIN_EMAIL=admin@domain.com ADMIN_PASSWORD=StrongPass123! npx tsx scripts/provision-admin.ts')
    process.exit(1)
  }

  if (password.length < 10) {
    console.error('Error: Admin password must be at least 10 characters long.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  })

  console.log(`[SUCCESS] Super administrator provisioned for email: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
