import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrderSchema } from '@/lib/validations'
import { getSellerIdFromRequest } from '@/lib/auth'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// POST /api/orders - Create order (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Get checkout link to calculate total price
    const checkoutLink = await prisma.checkoutLink.findUnique({
      where: { id: validated.checkoutLinkId },
      include: { seller: true },
    })

    if (!checkoutLink) {
      return NextResponse.json(
        { error: 'Checkout link not found' },
        { status: 404 }
      )
    }

    const totalPrice = checkoutLink.price * validated.quantity

    // Create order with contact snapshot
    const contactSnapshot = JSON.stringify(validated.buyer)

    let customerId: string | null = null

    // If saveDetails is true, create or update customer
    if (validated.saveDetails) {
      const customer = await prisma.customer.upsert({
        where: {
          sellerId_phone: {
            sellerId: checkoutLink.sellerId,
            phone: validated.buyer.phone,
          },
        },
        update: {
          fullName: validated.buyer.fullName,
          city: validated.buyer.city,
          address: validated.buyer.address,
          username: validated.buyer.username,
          marketingOptIn: true,
          lastUsedAt: new Date(),
        },
        create: {
          sellerId: checkoutLink.sellerId,
          fullName: validated.buyer.fullName,
          phone: validated.buyer.phone,
          city: validated.buyer.city,
          address: validated.buyer.address,
          username: validated.buyer.username,
          marketingOptIn: true,
          lastUsedAt: new Date(),
        },
      })
      customerId = customer.id
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        sellerId: checkoutLink.sellerId,
        checkoutLinkId: validated.checkoutLinkId,
        customerId,
        quantity: validated.quantity,
        totalPrice,
        selectedSize: validated.selectedSize,
        contactSnapshot,
        deliveryMethod: validated.deliveryMethod,
      },
      include: {
        checkoutLink: true,
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

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/orders - List seller's orders (seller auth required)
export async function GET(request: NextRequest) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { sellerId },
        include: {
          checkoutLink: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: { sellerId },
      }),
    ])

    // Parse contact snapshots
    const ordersWithParsedSnapshot = orders.map((order) => ({
      ...order,
      contactSnapshot: JSON.parse(order.contactSnapshot),
    }))

    return NextResponse.json({
      orders: ordersWithParsedSnapshot,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

