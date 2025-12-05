'use client'

import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/api'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Order {
  id: string
  createdAt: string
  selectedSize: string
  contactSnapshot: {
    fullName: string
  }
  checkoutLink: {
    name: string
  }
  paymentStatus: string
  deliveryStatus: string
}

export default function OrdersPage() {
  const t = useTranslations('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await authenticatedFetch('/api/orders')
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data.orders)
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all customer orders
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.time')}</TableHead>
              <TableHead>{t('table.buyerName')}</TableHead>
              <TableHead>{t('table.product')}</TableHead>
              <TableHead>{t('table.size')}</TableHead>
              <TableHead>{t('table.paymentStatus')}</TableHead>
              <TableHead>{t('table.deliveryStatus')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground">{t('noOrders')}</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.contactSnapshot.fullName}
                  </TableCell>
                  <TableCell>{order.checkoutLink.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.selectedSize}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.paymentStatus === 'paid'
                          ? 'default'
                          : order.paymentStatus === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {t(`statuses.${order.paymentStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.deliveryStatus === 'delivered'
                          ? 'default'
                          : order.deliveryStatus === 'sent'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {t(`statuses.${order.deliveryStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        {t('table.view')}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

