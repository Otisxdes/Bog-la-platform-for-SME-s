import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/checkout-links/[...slug] - Get checkout link by slug (public, for buyer page)
// slug format: ["sellerSlug", "checkoutSlug"]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params

    if (slug.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format. Expected: sellerSlug/checkoutSlug' },
        { status: 400 }
      )
    }

    const [sellerSlug, checkoutSlug] = slug

    // Find seller by slug
    const seller = await prisma.seller.findUnique({
      where: { slug: sellerSlug },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Find checkout link
    const checkoutLink = await prisma.checkoutLink.findUnique({
      where: {
        sellerId_slug: {
          sellerId: seller.id,
          slug: checkoutSlug,
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            slug: true,
            instagramUrl: true,
          },
        },
      },
    })

    if (!checkoutLink) {
      return NextResponse.json(
        { error: 'Checkout link not found' },
        { status: 404 }
      )
    }

    // Parse delivery options and sizes
    const deliveryOptions = JSON.parse(checkoutLink.deliveryOptions)
    const sizes = JSON.parse(checkoutLink.sizes)

    return NextResponse.json({
      ...checkoutLink,
      deliveryOptions,
      sizes,
    })
  } catch (error) {
    console.error('Error fetching checkout link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout link' },
      { status: 500 }
    )
  }
}

