import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a test seller
  const hashedPassword = await bcrypt.hash('password123', 10)

  const seller = await prisma.seller.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      name: 'Test Seller',
      slug: 'test-seller',
      email: 'seller@example.com',
      password: hashedPassword,
      instagramUrl: 'https://instagram.com/testseller',
    },
  })

  console.log('Created seller:', seller)

  // Create a sample checkout link
  const checkoutLink = await prisma.checkoutLink.create({
    data: {
      sellerId: seller.id,
      name: 'White Oversized Hoodie',
      slug: 'white-hoodie',
      price: 150000,
      currency: 'UZS',
      defaultQty: 1,
      maxQty: 5,
      deliveryOptions: JSON.stringify({
        courierCity: true,
        pickup: true,
        region: false,
      }),
      paymentNote: 'Pay via Payme or Uzcard to this card: 8600 1234 5678 9012',
    },
  })

  console.log('Created checkout link:', checkoutLink)
  console.log(`\nCheckout URL: http://localhost:3000/b/${seller.slug}/${checkoutLink.slug}`)
  console.log(`\nLogin credentials:`)
  console.log(`Email: seller@example.com`)
  console.log(`Password: password123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

