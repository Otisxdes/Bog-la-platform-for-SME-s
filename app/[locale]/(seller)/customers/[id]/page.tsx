'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { authenticatedFetch } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Phone, MapPin, User, Calendar, ShoppingBag } from 'lucide-react'

interface Order {
  id: string
  quantity: number
  totalPrice: number
  createdAt: string
  checkoutLink: {
    name: string
  }
}

interface Customer {
  id: string
  fullName: string
  phone: string
  city: string | null
  address: string | null
  username: string | null
  marketingOptIn: boolean
  createdAt: string
  lastUsedAt: string | null
  orders: Order[]
  _count: {
    orders: number
  }
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const t = useTranslations('customers.detail')
  const tCustomers = useTranslations('customers')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const response = await authenticatedFetch(`/api/customers/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch customer')
        const data = await response.json()
        setCustomer(data)
      } catch (err: any) {
        setError(err.message || t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [params.id])

  if (loading) {
    return <LoadingPage />
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || t('customerNotFound')}</p>
        <Button
          variant="link"
          onClick={() => router.back()}
          className="mt-4 p-0 h-auto"
        >
          {t('goBack')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToCustomers')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer #{customer.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('customerInformation')}
            </CardTitle>
            <CardDescription>Personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('fullName')}</Label>
              <p className="text-sm font-medium">{customer.fullName}</p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('phone')}
              </Label>
              <Button variant="link" asChild className="p-0 h-auto justify-start">
                <a href={`tel:${customer.phone}`}>
                  {customer.phone}
                </a>
              </Button>
            </div>
            {customer.username && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">{t('username')}</Label>
                <Button variant="link" asChild className="p-0 h-auto justify-start">
                  <a
                    href={`https://t.me/${customer.username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {customer.username}
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
              <p className="text-sm font-medium">{customer.city || '-'}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('address')}</Label>
              <p className="text-sm font-medium">{customer.address || '-'}</p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('marketingOptIn')}</Label>
              <Badge variant={customer.marketingOptIn ? 'default' : 'outline'}>
                {customer.marketingOptIn ? tCustomers('yes') : tCustomers('no')}
              </Badge>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('customerSince')}
              </Label>
              <p className="text-sm font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
            {customer.lastUsedAt && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">{t('lastOrder')}</Label>
                <p className="text-sm font-medium">
                  {new Date(customer.lastUsedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('totalOrders')}</Label>
              <Badge variant="secondary">{customer._count.orders}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t('orderHistory')}
            </CardTitle>
            <CardDescription>Complete purchase history for this customer</CardDescription>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('noOrders')}</p>
            ) : (
              <div className="space-y-4">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Button variant="link" asChild className="p-0 h-auto">
                          <Link href={`/orders/${order.id}`}>
                            {order.checkoutLink.name}
                          </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-semibold">
                          {order.totalPrice.toLocaleString()} UZS
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('quantity')} {order.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

