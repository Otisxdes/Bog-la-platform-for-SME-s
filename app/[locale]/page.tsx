'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('bogla_seller_token')
    
    if (token) {
      // If logged in, go to dashboard
      router.replace('/dashboard')
    } else {
      // If not logged in, go to login
      router.replace('/login')
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
