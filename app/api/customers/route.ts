import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSellerIdFromRequest } from '@/lib/auth'

// GET /api/customers - List seller's customers with stats
export async function GET(request: NextRequest) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
      where: { sellerId },
      include: {
        _count: {
          select: { orders: true },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format customers with stats
    const customersWithStats = customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      city: customer.city,
      address: customer.address,
      username: customer.username,
      marketingOptIn: customer.marketingOptIn,
      createdAt: customer.createdAt,
      lastUsedAt: customer.lastUsedAt,
      totalOrders: customer._count.orders,
      lastOrderDate: customer.orders[0]?.createdAt || null,
    }))

    return NextResponse.json(customersWithStats)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

