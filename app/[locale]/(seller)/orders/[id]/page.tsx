'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { authenticatedFetch } from '@/lib/api'
import { useTranslations } from 'next-intl'

interface Order {
  id: string
  createdAt: string
  quantity: number
  totalPrice: number
  selectedSize: string
  deliveryMethod: string
  paymentStatus: string
  deliveryStatus: string
  contactSnapshot: {
    fullName: string
    phone: string
    city: string
    address: string
    username?: string
  }
  checkoutLink: {
    name: string
    currency: string
  }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('orders.details')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('')

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await authenticatedFetch(`/api/orders?id=${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch order')
        const data = await response.json()
        
        if (data.orders && data.orders.length > 0) {
          const orderData = data.orders[0]
          setOrder(orderData)
          setPaymentStatus(orderData.paymentStatus)
          setDeliveryStatus(orderData.deliveryStatus)
        } else {
          throw new Error('Order not found')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [params.id])

  const handleUpdateStatus = async () => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await authenticatedFetch(`/api/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentStatus,
          deliveryStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update order')

      const updatedOrder = await response.json()
      setOrder(updatedOrder)
      alert('Order status updated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || 'Order not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          {tCommon('back')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← {tCommon('back')}
        </button>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('orderInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orderNumber')}</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{order.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('createdAt')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('product')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.checkoutLink.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('size')}</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {order.selectedSize}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('quantity')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('totalPrice')}</dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">
                {order.totalPrice.toLocaleString()} {order.checkoutLink.currency}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('deliveryMethod')}</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {order.deliveryMethod.replace('_', ' ')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Buyer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('buyerInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fullName')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.contactSnapshot.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('phone')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a href={`tel:${order.contactSnapshot.phone}`} className="text-blue-600 hover:underline">
                  {order.contactSnapshot.phone}
                </a>
              </dd>
            </div>
            {order.contactSnapshot.username && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('telegram')}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={`https://t.me/${order.contactSnapshot.username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {order.contactSnapshot.username}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('city')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.contactSnapshot.city}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('address')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.contactSnapshot.address}</dd>
            </div>
          </dl>
        </div>

        {/* Status Update */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">{t('statuses')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('paymentStatus')}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">{t('paymentStatuses.pending')}</option>
                <option value="paid">{t('paymentStatuses.paid')}</option>
                <option value="cancelled">{t('paymentStatuses.cancelled')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deliveryStatus')}
              </label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">{t('deliveryStatuses.pending')}</option>
                <option value="sent">{t('deliveryStatuses.sent')}</option>
                <option value="delivered">{t('deliveryStatuses.delivered')}</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleUpdateStatus}
            disabled={updating || (paymentStatus === order.paymentStatus && deliveryStatus === order.deliveryStatus)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? tCommon('loading') : t('updateStatus')}
          </button>
        </div>
      </div>
    </div>
  )
}

