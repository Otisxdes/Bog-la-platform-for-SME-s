'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { authenticatedFetch } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Phone, MapPin, User, Package } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

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
    return <LoadingPage />
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Order #{order.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('orderInfo')}
            </CardTitle>
            <CardDescription>Details about this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('createdAt')}</Label>
              <p className="text-sm font-medium">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('product')}</Label>
              <p className="text-sm font-medium">{order.checkoutLink.name}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('size')}</Label>
              <Badge variant="secondary">{order.selectedSize}</Badge>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('quantity')}</Label>
              <p className="text-sm font-medium">{order.quantity}</p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('totalPrice')}</Label>
              <p className="text-2xl font-bold">
                {order.totalPrice.toLocaleString()} {order.checkoutLink.currency}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('deliveryMethod')}</Label>
              <p className="text-sm font-medium capitalize">
                {order.deliveryMethod.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('buyerInfo')}
            </CardTitle>
            <CardDescription>Customer contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('fullName')}</Label>
              <p className="text-sm font-medium">{order.contactSnapshot.fullName}</p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('phone')}
              </Label>
              <Button variant="link" asChild className="p-0 h-auto justify-start">
                <a href={`tel:${order.contactSnapshot.phone}`}>
                  {order.contactSnapshot.phone}
                </a>
              </Button>
            </div>
            {order.contactSnapshot.username && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">{t('telegram')}</Label>
                <Button variant="link" asChild className="p-0 h-auto justify-start">
                  <a
                    href={`https://t.me/${order.contactSnapshot.username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {order.contactSnapshot.username}
                  </a>
                </Button>
              </div>
            )}
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('city')}
              </Label>
              <p className="text-sm font-medium">{order.contactSnapshot.city}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('address')}</Label>
              <p className="text-sm font-medium">{order.contactSnapshot.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Update */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('statuses')}</CardTitle>
            <CardDescription>Update order payment and delivery status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">{t('paymentStatus')}</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t('paymentStatuses.pending')}</SelectItem>
                    <SelectItem value="paid">{t('paymentStatuses.paid')}</SelectItem>
                    <SelectItem value="cancelled">{t('paymentStatuses.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryStatus">{t('deliveryStatus')}</Label>
                <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                  <SelectTrigger id="deliveryStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('deliveryStatuses.pending')}</SelectItem>
                    <SelectItem value="sent">{t('deliveryStatuses.sent')}</SelectItem>
                    <SelectItem value="delivered">{t('deliveryStatuses.delivered')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating || (paymentStatus === order.paymentStatus && deliveryStatus === order.deliveryStatus)}
              className="mt-6"
            >
              {updating ? tCommon('loading') : t('updateStatus')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

