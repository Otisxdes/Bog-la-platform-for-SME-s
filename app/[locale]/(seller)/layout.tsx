'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter, Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LoadingPage } from '@/components/ui/loading-spinner'

interface SellerData {
  id: string
  name: string
  slug: string
  email: string
  instagramUrl: string | null
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [seller, setSeller] = useState<SellerData | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Check if this is the login page
  const isLoginPage = pathname?.includes('/login') ?? false

  useEffect(() => {
    setMounted(true)
    
    // Don't check auth on login page
    if (isLoginPage) return

    // Check localStorage for auth
    try {
      const token = localStorage.getItem('bogla_seller_token')
      const sellerData = localStorage.getItem('bogla_seller')

      if (!token || !sellerData) {
        router.replace('/login')
        return
      }

      setSeller(JSON.parse(sellerData))
    } catch {
      router.replace('/login')
    }
  }, [isLoginPage, router])

  const handleLogout = () => {
    localStorage.removeItem('bogla_seller_token')
    localStorage.removeItem('bogla_seller')
    router.push('/login')
  }

  // Login page - always render immediately
  if (isLoginPage) {
    return children
  }

  // Other pages - wait for mount and auth check
  if (!mounted) {
    return <LoadingPage />
  }

  // Not authenticated
  if (!seller) {
    return null
  }

  const navLinks = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/checkout-links', label: t('checkoutLinks') },
    { href: '/orders', label: t('orders') },
    { href: '/customers', label: t('customers') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Bog&apos;la</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === link.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <span className="text-sm text-gray-700">{seller.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 ml-2"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

