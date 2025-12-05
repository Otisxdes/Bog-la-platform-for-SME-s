import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutLinkSchema } from '@/lib/validations'
import { getSellerIdFromRequest } from '@/lib/auth'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// GET /api/checkout-links/[id] - Get single checkout link for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const checkoutLink = await prisma.checkoutLink.findFirst({
      where: {
        id,
        sellerId, // Ensure seller can only access their own links
      },
    })

    if (!checkoutLink) {
      return NextResponse.json(
        { error: 'Checkout link not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
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

// PATCH /api/checkout-links/[id] - Update checkout link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = createCheckoutLinkSchema.parse(body)

    // Verify ownership
    const existing = await prisma.checkoutLink.findFirst({
      where: {
        id,
        sellerId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Checkout link not found' },
        { status: 404 }
      )
    }

    // Update the checkout link
    const updated = await prisma.checkoutLink.update({
      where: { id },
      data: {
        name: validated.name,
        price: validated.price,
        currency: validated.currency,
        defaultQty: validated.defaultQty,
        maxQty: validated.maxQty,
        imageUrl: validated.imageUrl || null,
        sizes: JSON.stringify(validated.sizes),
        deliveryOptions: JSON.stringify(validated.deliveryOptions),
        paymentNote: validated.paymentNote,
        // Don't update slug to preserve existing links
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating checkout link:', error)
    return NextResponse.json(
      { error: 'Failed to update checkout link' },
      { status: 500 }
    )
  }
}

// DELETE /api/checkout-links/[id] - Delete checkout link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sellerId = getSellerIdFromRequest(request)
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.checkoutLink.findFirst({
      where: {
        id,
        sellerId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Checkout link not found' },
        { status: 404 }
      )
    }

    // Delete the checkout link (CASCADE will handle related orders)
    await prisma.checkoutLink.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checkout link:', error)
    return NextResponse.json(
      { error: 'Failed to delete checkout link' },
      { status: 500 }
    )
  }
}
