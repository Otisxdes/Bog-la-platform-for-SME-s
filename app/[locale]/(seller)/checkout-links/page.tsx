'use client'

import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/api'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, ExternalLink, Copy, Check, Plus } from 'lucide-react'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage payment links for your products
          </p>
        </div>
        <Button asChild>
          <Link href="/checkout-links/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('newButton')}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.sizes')}</TableHead>
              <TableHead>{t('table.url')}</TableHead>
              <TableHead>{t('table.createdDate')}</TableHead>
              <TableHead>{t('table.ordersCount')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-muted-foreground">{t('noLinks')}</p>
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => {
                const sizes = JSON.parse(link.sizes || '[]')
                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sizes.map((size: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`/b/${sellerSlug}/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t('preview')}
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.slug, link.id)}
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1 text-green-600" />
                              <span className="text-green-600">{t('copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              {t('copyLink')}
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {link._count.orders}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/checkout-links/${link.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            {t('edit')}
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id, link.name)}
                          disabled={deleting === link.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleting === link.id ? t('deleting') : t('delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
