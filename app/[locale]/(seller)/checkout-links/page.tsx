'use client'

import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/api'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, ExternalLink, Copy, Check } from 'lucide-react'

interface CheckoutLink {
  id: string
  name: string
  slug: string
  sizes: string
  createdAt: string
  _count: {
    orders: number
  }
}

export default function CheckoutLinksPage() {
  const t = useTranslations('checkoutLinks')
  const [links, setLinks] = useState<CheckoutLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sellerSlug, setSellerSlug] = useState<string>('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLinks() {
      try {
        const sellerData = localStorage.getItem('bogla_seller')
        if (sellerData) {
          const seller = JSON.parse(sellerData)
          setSellerSlug(seller.slug)
        }

        const response = await authenticatedFetch('/api/checkout-links')
        if (!response.ok) throw new Error('Failed to fetch checkout links')
        const data = await response.json()
        setLinks(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load checkout links')
      } finally {
        setLoading(false)
      }
    }
    fetchLinks()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    setDeleting(id)
    try {
      const response = await authenticatedFetch(`/api/checkout-links/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      // Remove from list
      setLinks(links.filter(link => link.id !== id))
    } catch (err) {
      alert('Failed to delete checkout link')
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyLink = (slug: string, id: string) => {
    const fullUrl = `${window.location.origin}/b/${sellerSlug}/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link
          href="/checkout-links/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {t('newButton')}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.sizes')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.url')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.createdDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.ordersCount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {links.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {t('noLinks')}
                </td>
              </tr>
            ) : (
              links.map((link) => {
                const sizes = JSON.parse(link.sizes || '[]')
                return (
                  <tr key={link.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {link.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {sizes.map((size: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/b/${sellerSlug}/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Preview
                        </a>
                        <button
                          onClick={() => handleCopyLink(link.slug, link.id)}
                          className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link._count.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/checkout-links/${link.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          {t('edit')}
                        </Link>
                        <button
                          onClick={() => handleDelete(link.id, link.name)}
                          disabled={deleting === link.id}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleting === link.id ? t('deleting') : t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
