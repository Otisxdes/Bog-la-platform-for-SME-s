'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'

interface Order {
  id: string
  quantity: number
  totalPrice: number
  deliveryMethod: string
  contactSnapshot: {
    fullName: string
    phone: string
    city: string
    address: string
    username?: string
  }
  checkoutLink: {
    name: string
    price: number
    currency: string
    size: string
    paymentNote: string
  }
  seller: {
    name: string
    slug: string
    instagramUrl: string | null
  }
}

export default function SuccessPage({
  params,
}: {
  params: { sellerSlug: string; checkoutSlug: string }
}) {
  const t = useTranslations('success')
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing')
      setLoading(false)
      return
    }

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
          throw new Error('Failed to load order')
        }
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError('Failed to load order details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const copyCardNumber = () => {
    const cardMatch = order?.checkoutLink.paymentNote.match(/\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/)
    if (cardMatch) {
      navigator.clipboard.writeText(cardMatch[0].replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      navigator.clipboard.writeText(order?.checkoutLink.paymentNote || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('orderNotFound')}</p>
          <Link
            href={`/b/${params.sellerSlug}/${params.checkoutSlug}`}
            className="text-blue-600 hover:underline"
          >
            {t('backToCheckout')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('title', { sellerName: order.seller.name })}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('orderSummary')}</h2>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('product')}</span>
              <span className="font-medium">{order.checkoutLink.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('size')}</span>
              <span className="font-medium">{order.checkoutLink.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('quantity')}</span>
              <span className="font-medium">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('unitPrice')}</span>
              <span className="font-medium">
                {order.checkoutLink.price.toLocaleString()} {order.checkoutLink.currency}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">{t('total')}</span>
              <span className="font-bold text-lg">
                {order.totalPrice.toLocaleString()} {order.checkoutLink.currency}
              </span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div>
              <span className="text-sm text-gray-600">{t('deliveryMethod')}:</span>
              <span className="ml-2 font-medium">
                {order.deliveryMethod === 'courier_city'
                  ? t('deliveryMethods.courierCity')
                  : order.deliveryMethod === 'pickup'
                  ? t('deliveryMethods.pickup')
                  : t('deliveryMethods.regionDelivery')}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('contact')}:</span>
              <span className="ml-2 font-medium">{order.contactSnapshot.fullName}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('phone')}:</span>
              <span className="ml-2 font-medium">{order.contactSnapshot.phone}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">{t('address')}:</span>
              <span className="ml-2 font-medium">
                {order.contactSnapshot.city}, {order.contactSnapshot.address}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">{t('paymentInstructions')}</h2>
          <p className="text-sm text-blue-800 mb-4 whitespace-pre-wrap">
            {order.checkoutLink.paymentNote}
          </p>
          <button
            onClick={copyCardNumber}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {copied ? `✓ ${t('copied')}` : t('copyPaymentDetails')}
          </button>
        </div>

        {/* Contact Seller */}
        {order.seller.instagramUrl && (
          <div className="text-center">
            <a
              href={order.seller.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t('contactInstagram')}
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
