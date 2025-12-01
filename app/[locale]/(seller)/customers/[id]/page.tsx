'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { authenticatedFetch } from '@/lib/api'

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
        setError(err.message || 'Failed to load customer')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || 'Customer not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-900"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Profile</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Customers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Full Name:</span>
              <span className="ml-2 font-medium">{customer.fullName}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Phone:</span>
              <span className="ml-2 font-medium">{customer.phone}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">City:</span>
              <span className="ml-2 font-medium">{customer.city || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Address:</span>
              <span className="ml-2 font-medium">{customer.address || '-'}</span>
            </div>
            {customer.username && (
              <div>
                <span className="text-sm text-gray-600">Username:</span>
                <span className="ml-2 font-medium">{customer.username}</span>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">Marketing Opt-in:</span>
              <span className="ml-2">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.marketingOptIn
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {customer.marketingOptIn ? 'Yes' : 'No'}
                </span>
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Customer Since:</span>
              <span className="ml-2 font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>
            {customer.lastUsedAt && (
              <div>
                <span className="text-sm text-gray-600">Last Order:</span>
                <span className="ml-2 font-medium">
                  {new Date(customer.lastUsedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">Total Orders:</span>
              <span className="ml-2 font-medium">{customer._count.orders}</span>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          {customer.orders.length === 0 ? (
            <p className="text-gray-500">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-blue-600 hover:text-blue-900"
                      >
                        {order.checkoutLink.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {order.totalPrice.toLocaleString()} UZS
                      </p>
                      <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

