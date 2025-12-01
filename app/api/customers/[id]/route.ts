import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSellerIdFromRequest } from '@/lib/auth'

// GET /api/customers/[id] - Get customer detail with orders
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        sellerId, // Ensure seller owns this customer
      },
      include: {
        orders: {
          include: {
            checkoutLink: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Parse contact snapshots in orders
    const ordersWithParsedSnapshot = customer.orders.map((order) => ({
      ...order,
      contactSnapshot: JSON.parse(order.contactSnapshot),
    }))

    return NextResponse.json({
      ...customer,
      orders: ordersWithParsedSnapshot,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

