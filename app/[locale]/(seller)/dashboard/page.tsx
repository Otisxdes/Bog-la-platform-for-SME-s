'use client'

import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/api'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LoadingPage } from '@/components/ui/loading-spinner'

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
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">{t('todayOrders')}</h2>
          <p className="text-3xl font-bold">{stats?.todayOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">{t('totalOrders')}</h2>
          <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">{t('totalCustomers')}</h2>
          <p className="text-3xl font-bold">{stats?.totalCustomers || 0}</p>
        </div>
      </div>

      {/* Latest Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{t('latestOrders')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tOrders('time')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tOrders('buyerName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tOrders('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tOrders('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tOrders('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {t('noOrders')}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.contactSnapshot.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.checkoutLink.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tOrders(`statuses.${order.paymentStatus}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
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

