import { Seller, CheckoutLink, Customer, Order } from '@prisma/client'

export type SellerWithRelations = Seller & {
  checkoutLinks: CheckoutLink[]
  customers: Customer[]
  orders: Order[]
}

export type CheckoutLinkWithSeller = CheckoutLink & {
  seller: Seller
}

export type CustomerWithOrders = Customer & {
  orders: Order[]
  _count?: {
    orders: number
  }
}

export type OrderWithRelations = Order & {
  seller: Seller
  checkoutLink: CheckoutLink
  customer: Customer | null
}

export interface DeliveryOptions {
  courierCity?: boolean
  pickup?: boolean
  region?: boolean
}

export interface ContactSnapshot {
  fullName: string
  phone: string
  city: string
  address: string
  username?: string
}

// Extended types with parsed JSON fields
export type CheckoutLinkWithParsedData = Omit<CheckoutLink, 'deliveryOptions' | 'sizes'> & {
  deliveryOptions: DeliveryOptions
  sizes: string[]
}

export type CheckoutLinkWithSellerParsed = CheckoutLinkWithParsedData & {
  seller: Seller
}

