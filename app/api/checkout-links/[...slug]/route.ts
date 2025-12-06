import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

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

// POST /api/checkout-links/[...slug] - Track visit to checkout page
// slug format: ["sellerSlug", "checkoutSlug", "visit"]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params

    // Handle visit tracking
    if (slug.length === 3 && slug[2] === 'visit') {
      const [sellerSlug, checkoutSlug] = slug

      // Find seller by slug
      const seller = await prisma.seller.findUnique({
        where: { slug: sellerSlug },
      })

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      // Increment visit counter
      await prisma.checkoutLink.update({
        where: {
          sellerId_slug: {
            sellerId: seller.id,
            slug: checkoutSlug,
          },
        },
        data: {
          visits: {
            increment: 1,
          },
        },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid endpoint' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error tracking visit:', error)
    return NextResponse.json(
      { error: 'Failed to track visit' },
      { status: 500 }
    )
  }
}

