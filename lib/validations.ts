import { z } from 'zod'

// Uzbek phone number validation (simplified)
const uzbekPhoneRegex = /^\+998\d{9}$/

export const createCheckoutLinkSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().int().positive('Price must be positive'),
  currency: z.string().default('UZS'),
  defaultQty: z.number().int().positive().default(1),
  maxQty: z.number().int().positive().optional().nullable(),
  imageUrl: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
  sizes: z.array(z.string().min(1, 'Size cannot be empty')).min(1, 'At least one size is required'),
  deliveryOptions: z.object({
    courierCity: z.boolean().optional(),
    pickup: z.boolean().optional(),
    region: z.boolean().optional(),
  }).refine(
    (data) => data.courierCity || data.pickup || data.region,
    { message: 'At least one delivery option must be selected' }
  ),
  paymentNote: z.string().min(1, 'Payment instructions are required'),
})

export const createOrderSchema = z.object({
  checkoutLinkId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be positive'),
  selectedSize: z.string().min(1, 'Size selection is required'),
  deliveryMethod: z.string().min(1, 'Delivery method is required'),
  buyer: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().regex(uzbekPhoneRegex, 'Invalid Uzbek phone number format'),
    city: z.string().min(1, 'City is required'),
    address: z.string().min(1, 'Address is required'),
    username: z.string().optional(),
  }),
  saveDetails: z.boolean().default(false),
})

export const updateOrderSchema = z.object({
  paymentStatus: z.enum(['new', 'paid', 'cancelled']).optional(),
  deliveryStatus: z.enum(['pending', 'sent', 'delivered']).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type CreateCheckoutLinkInput = z.infer<typeof createCheckoutLinkSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type LoginInput = z.infer<typeof loginSchema>

