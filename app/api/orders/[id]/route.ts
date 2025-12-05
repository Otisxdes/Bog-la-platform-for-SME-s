import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// GET /api/orders/[id] - Get single order (public for success page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        checkoutLink: {
          select: {
            name: true,
            price: true,
            currency: true,
            paymentNote: true,
          },
        },
        seller: {
          select: {
            name: true,
            slug: true,
            instagramUrl: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Parse the contactSnapshot JSON
    const contactSnapshot = JSON.parse(order.contactSnapshot)

    // Extract size from contactSnapshot (it's stored there)
    const size = contactSnapshot.selectedSize || ''

    return NextResponse.json({
      id: order.id,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      deliveryMethod: order.deliveryMethod,
      contactSnapshot,
      checkoutLink: {
        name: order.checkoutLink.name,
        price: order.checkoutLink.price,
        currency: order.checkoutLink.currency,
        size,
        paymentNote: order.checkoutLink.paymentNote,
      },
      seller: order.seller,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
