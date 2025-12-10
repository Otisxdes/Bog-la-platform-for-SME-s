'use client'

import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/api'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { TrendingUp, TrendingDown, Users, ShoppingBag, Calendar } from 'lucide-react'
import { OrdersChart } from '@/components/charts/orders-chart'

interface Stats {
  todayOrders: number
  totalOrders: number
  totalCustomers: number
}

interface Order {
  id: string
  createdAt: string
  contactSnapshot: {
    fullName: string
  }
  checkoutLink: {
    name: string
  }
  paymentStatus: string
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tOrders = useTranslations('orders')
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ date: string; orders: number }[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch orders
        const ordersResponse = await authenticatedFetch('/api/orders?limit=10')
        if (!ordersResponse.ok) throw new Error('Failed to fetch orders')
        const ordersData = await ordersResponse.json()

        // Fetch customers
        const customersResponse = await authenticatedFetch('/api/customers')
        if (!customersResponse.ok) throw new Error('Failed to fetch customers')
        const customersData = await customersResponse.json()

        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayOrders = ordersData.orders.filter((order: Order) => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= today
        }).length

        setStats({
          todayOrders,
          totalOrders: ordersData.pagination.total,
          totalCustomers: customersData.length,
        })

        setOrders(ordersData.orders)

        // Generate chart data from orders
        const last90Days = new Date()
        last90Days.setDate(last90Days.getDate() - 90)

        // Group orders by date
        const ordersByDate: Record<string, number> = {}
        ordersData.orders.forEach((order: Order) => {
          const date = new Date(order.createdAt).toISOString().split('T')[0]
          ordersByDate[date] = (ordersByDate[date] || 0) + 1
        })

        // Fill in missing dates with 0
        const data: { date: string; orders: number }[] = []
        for (let i = 90; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          data.push({
            date: dateStr,
            orders: ordersByDate[dateStr] || 0
          })
        }

        setChartData(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Today's Orders */}
        <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('todayOrders')}</h3>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats?.todayOrders || 0}</p>
              <p className="text-xs text-muted-foreground">
                {t('todayOrdersSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('totalOrders')}</h3>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">
                {t('totalOrdersSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('totalCustomers')}</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats?.totalCustomers || 0}</p>
              <p className="text-xs text-muted-foreground">
                {t('totalCustomersSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <OrdersChart
        data={chartData}
        title={t('ordersChart.title')}
        subtitle={t('ordersChart.subtitle')}
        last7Days={t('ordersChart.last7Days')}
        last30Days={t('ordersChart.last30Days')}
        last3Months={t('ordersChart.last3Months')}
      />

      {/* Latest Orders */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">{t('latestOrders')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('latestOrdersSubtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-sm">
                  {tOrders('time')}
                </th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-sm">
                  {tOrders('buyerName')}
                </th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-sm">
                  {tOrders('product')}
                </th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-sm">
                  {tOrders('status')}
                </th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-sm">
                  {tOrders('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">{t('noOrders')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="p-4 px-6 align-middle text-sm">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 px-6 align-middle text-sm font-medium">
                      {order.contactSnapshot.fullName}
                    </td>
                    <td className="p-4 px-6 align-middle text-sm">
                      {order.checkoutLink.name}
                    </td>
                    <td className="p-4 px-6 align-middle">
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-600 text-white'
                            : order.paymentStatus === 'cancelled'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {tOrders(`statuses.${order.paymentStatus}`)}
                      </div>
                    </td>
                    <td className="p-4 px-6 align-middle">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm font-medium text-primary hover:underline underline-offset-4"
                      >
                        {tOrders('actions')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

