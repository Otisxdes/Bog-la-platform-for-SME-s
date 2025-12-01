import { NextRequest } from 'next/server'

/**
 * Get seller ID from request headers
 * The seller ID is set by the client from localStorage
 */
export function getSellerIdFromRequest(request: NextRequest): string | null {
  const sellerId = request.headers.get('X-Seller-ID')
  return sellerId
}

