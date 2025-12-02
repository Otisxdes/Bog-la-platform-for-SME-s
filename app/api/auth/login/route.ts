import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validations'
import { authenticateSeller, createSession } from '@/lib/auth'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// POST /api/auth/login - Basic login endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const seller = await authenticateSeller(validated.email, validated.password)

    if (!seller) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = createSession(seller.id)

    return NextResponse.json({
      seller: {
        id: seller.id,
        name: seller.name,
        slug: seller.slug,
        email: seller.email,
        instagramUrl: seller.instagramUrl,
      },
      token,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

