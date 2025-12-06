'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authenticatedFetch } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CheckoutLinkDetail {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  visits: number
  stock: number | null
  _count: {
    orders: number
  }
}

export default function CheckoutLinkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('checkoutLinks.detail')
  const tCommon = useTranslations('common')
  const [link, setLink] = useState<CheckoutLinkDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLink() {
      try {
        const response = await authenticatedFetch(`/api/checkout-links/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch checkout link')
        const data = await response.json()
        setLink(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load checkout link')
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [params.id])

  if (loading) {
    return <LoadingPage />
  }

  if (error || !link) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || 'Checkout link not found'}</p>
      </div>
    )
  }

  const conversionRate = link.visits > 0
    ? ((link._count.orders / link.visits) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/checkout-links')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {tCommon('back')}
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{link.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalVisits')}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{link.visits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('totalVisitsDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalOrders')}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{link._count.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('totalOrdersDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('conversionRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('conversionRateDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Stock Remaining */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stockRemaining')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {link.stock === null ? t('unlimited') : link.stock}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stockRemainingDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('productInfo')}</CardTitle>
          <CardDescription>{t('productInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">{t('productName')}</span>
            <span className="text-sm text-muted-foreground">{link.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">{t('price')}</span>
            <span className="text-sm text-muted-foreground">
              {link.price.toLocaleString()} {link.currency}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">{t('slug')}</span>
            <span className="text-sm text-muted-foreground font-mono">{link.slug}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => router.push(`/checkout-links/${link.id}/edit`)}
        >
          {tCommon('edit')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const sellerData = localStorage.getItem('bogla_seller')
            if (sellerData) {
              const seller = JSON.parse(sellerData)
              window.open(`/b/${seller.slug}/${link.slug}`, '_blank')
            }
          }}
        >
          {t('viewCheckout')}
        </Button>
      </div>
    </div>
  )
}
