import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getSellerByEmail(email: string) {
  return prisma.seller.findUnique({
    where: { email },
  })
}

export async function authenticateSeller(email: string, password: string) {
  const seller = await getSellerByEmail(email)
  if (!seller) {
    return null
  }

  const isValid = await verifyPassword(password, seller.password)
  if (!isValid) {
    return null
  }

  // Return seller without password
  const { password: _, ...sellerWithoutPassword } = seller
  return sellerWithoutPassword
}

// Simple session management (in production, use proper session management)
export function createSession(sellerId: string): string {
  // For MVP, we'll use a simple token. In production, use JWT or session store
  return Buffer.from(`${sellerId}:${Date.now()}`).toString('base64')
}

export function getSellerIdFromRequest(request: Request): string | null {
  // For MVP, get from Authorization header
  // In production, use proper session management
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [sellerId] = decoded.split(':')
    return sellerId || null
  } catch {
    return null
  }
}

