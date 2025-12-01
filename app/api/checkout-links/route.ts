import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutLinkSchema } from '@/lib/validations'
import { getSellerIdFromRequest } from '@/lib/auth'

// POST /api/checkout-links - Create new checkout link
export async function POST(request: NextRequest) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received checkout link data:', body)
    const validated = createCheckoutLinkSchema.parse(body)
    console.log('Validated checkout link data:', validated)

    // Generate slug from name (simple slugification)
    let slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50)

    // If slug is empty (e.g., non-Latin characters), generate a random one
    if (!slug || slug.length === 0) {
      slug = `product-${Date.now()}`
    }

    // Check if slug already exists for this seller
    const existing = await prisma.checkoutLink.findUnique({
      where: {
        sellerId_slug: {
          sellerId,
          slug,
        },
      },
    })

    let finalSlug = slug
    if (existing) {
      finalSlug = `${slug}-${Date.now()}`
    }

    const checkoutLink = await prisma.checkoutLink.create({
      data: {
        sellerId,
        name: validated.name,
        slug: finalSlug,
        price: validated.price,
        currency: validated.currency,
        defaultQty: validated.defaultQty,
        maxQty: validated.maxQty,
        imageUrl: validated.imageUrl || null,
        sizes: JSON.stringify(validated.sizes),
        deliveryOptions: JSON.stringify(validated.deliveryOptions),
        paymentNote: validated.paymentNote,
      },
    })

    return NextResponse.json(checkoutLink, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating checkout link:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: 'Failed to create checkout link', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/checkout-links - List seller's checkout links
export async function GET(request: NextRequest) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checkoutLinks = await prisma.checkoutLink.findMany({
      where: { sellerId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(checkoutLinks)
  } catch (error) {
    console.error('Error fetching checkout links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout links' },
      { status: 500 }
    )
  }
}

