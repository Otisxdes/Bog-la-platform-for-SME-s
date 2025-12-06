'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { LoadingPage } from '@/components/ui/loading-spinner'

const uzbekCities = [
  'Tashkent',
  'Samarkand',
  'Bukhara',
  'Andijan',
  'Namangan',
  'Fergana',
  'Nukus',
  'Qarshi',
  'Guliston',
  'Termez',
  'Jizzakh',
  'Navoiy',
  'Urgench',
  'Kokand',
  'Margilan',
  'Other',
]

const uzbekPhoneRegex = /^\+998\d{9}$/

interface CheckoutLink {
  id: string
  name: string
  price: number
  currency: string
  defaultQty: number
  maxQty: number | null
  imageUrl: string | null
  sizes: string[]
  deliveryOptions: {
    courierCity?: boolean
    pickup?: boolean
    region?: boolean
  }
  paymentNote: string
  seller: {
    id: string
    name: string
    slug: string
    instagramUrl: string | null
  }
}

interface SavedProfile {
  fullName: string
  phone: string
  city: string
  address: string
  username?: string
}

// Subtle input class for consistent styling
const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
const selectClass = "w-full px-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2220%22%20height%3d%2220%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%3e%3cpath%20d%3d%22m6%209%206%206%206-6%22%2f%3e%3c%2fsvg%3e')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"

export default function CheckoutPage({
  params,
}: {
  params: { sellerSlug: string; checkoutSlug: string }
}) {
  const t = useTranslations('buyer.checkout')
  const router = useRouter()
  const [checkoutLink, setCheckoutLink] = useState<CheckoutLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [savedProfile, setSavedProfile, removeSavedProfile] = useLocalStorage<SavedProfile | null>(
    checkoutLink ? `bogla_${checkoutLink.seller.id}_buyerProfile` : '',
    null
  )

  const buyerFormSchema = z.object({
    fullName: z.string().min(1, t('errors.fullNameRequired')),
    phone: z.string().regex(uzbekPhoneRegex, t('errors.phoneInvalid')),
    city: z.string().min(1, t('errors.cityRequired')),
    address: z.string().min(1, t('errors.addressRequired')),
    username: z.string().optional(),
    selectedSize: z.string().min(1, t('errors.sizeRequired')),
    deliveryMethod: z.string().min(1, t('errors.deliveryRequired')),
    quantity: z.number().int().positive().min(1),
    saveDetails: z.enum(['no', 'yes']).default('no'),
  })

  type BuyerFormData = z.infer<typeof buyerFormSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      quantity: 1,
      saveDetails: 'no',
    },
  })

  const deliveryMethod = watch('deliveryMethod')

  useEffect(() => {
    async function fetchCheckoutLink() {
      try {
        const response = await fetch(`/api/checkout-links/${params.sellerSlug}/${params.checkoutSlug}`)
        if (!response.ok) {
          throw new Error('Failed to load checkout link')
        }
        const data = await response.json()
        setCheckoutLink(data)
        setQuantity(data.defaultQty || 1)
        setValue('quantity', data.defaultQty || 1)

        // Track visit
        fetch(`/api/checkout-links/${params.sellerSlug}/${params.checkoutSlug}/visit`, {
          method: 'POST',
        }).catch(() => {
          // Silently fail if visit tracking fails
        })
      } catch (err) {
        setError(t('errors.loadFailed'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCheckoutLink()
  }, [params.sellerSlug, params.checkoutSlug, setValue, t])

  // Auto-fill form if saved profile exists
  useEffect(() => {
    if (savedProfile && checkoutLink) {
      setValue('fullName', savedProfile.fullName)
      setValue('phone', savedProfile.phone)
      setValue('city', savedProfile.city)
      setValue('address', savedProfile.address)
      if (savedProfile.username) {
        setValue('username', savedProfile.username)
      }
    }
  }, [savedProfile, checkoutLink, setValue])

  const handleUseSavedDetails = () => {
    if (savedProfile) {
      setValue('fullName', savedProfile.fullName)
      setValue('phone', savedProfile.phone)
      setValue('city', savedProfile.city)
      setValue('address', savedProfile.address)
      if (savedProfile.username) {
        setValue('username', savedProfile.username)
      }
    }
  }

  const onSubmit = async (data: BuyerFormData) => {
    if (!checkoutLink) return

    setSubmitting(true)
    setError(null)

    try {
      const orderData = {
        checkoutLinkId: checkoutLink.id,
        quantity: data.quantity,
        selectedSize: data.selectedSize,
        deliveryMethod: data.deliveryMethod,
        buyer: {
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          address: data.address,
          username: data.username,
        },
        saveDetails: data.saveDetails === 'yes',
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const order = await response.json()

      // Save to localStorage if user opted in
      if (data.saveDetails === 'yes') {
        const profile: SavedProfile = {
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          address: data.address,
          username: data.username,
        }
        setSavedProfile(profile)
      }

      // Redirect to success page
      router.push(
        `/b/${params.sellerSlug}/${params.checkoutSlug}/success?orderId=${order.id}`
      )
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingPage message={t('loading')} />
  }

  if (error && !checkoutLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  if (!checkoutLink) return null

  const deliveryOptions = checkoutLink.deliveryOptions
  const availableDeliveryMethods = []

  if (deliveryOptions.courierCity) {
    availableDeliveryMethods.push({ value: 'courier_city', label: t('courierCity') })
  }
  if (deliveryOptions.pickup) {
    availableDeliveryMethods.push({ value: 'pickup', label: t('pickup') })
  }
  if (deliveryOptions.region) {
    availableDeliveryMethods.push({ value: 'region', label: t('regionDelivery') })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              // Check if we can go back in history
              // If opened in new tab or no history, go to home page
              if (document.referrer && document.referrer !== window.location.href) {
                router.back()
              } else {
                // No referrer means opened directly or in new tab, go to home
                router.push('/')
              }
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{checkoutLink.seller.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Saved Details Banner */}
        {savedProfile && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 mb-3">
              {t('useSavedDetails')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseSavedDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('useSavedDetails')}
              </button>
              <button
                type="button"
                onClick={() => removeSavedProfile()}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Edit manually
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeSavedProfile()}
              className="mt-3 text-xs text-blue-600 hover:underline"
            >
              {t('clearSavedDetails')}
            </button>
          </div>
        )}

        {/* Product Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {checkoutLink.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={checkoutLink.imageUrl}
                alt={checkoutLink.name}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{checkoutLink.name}</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            {checkoutLink.price.toLocaleString()} {checkoutLink.currency}
          </p>

          {/* Quantity Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('quantity')}
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const newQty = Math.max(1, quantity - 1)
                  setQuantity(newQty)
                  setValue('quantity', newQty)
                }}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="text-lg font-semibold w-12 text-center text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  const newQty = checkoutLink.maxQty
                    ? Math.min(checkoutLink.maxQty, quantity + 1)
                    : quantity + 1
                  setQuantity(newQty)
                  setValue('quantity', newQty)
                }}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
                disabled={checkoutLink.maxQty ? quantity >= checkoutLink.maxQty : false}
              >
                +
              </button>
            </div>
            {checkoutLink.maxQty && (
              <p className="text-xs text-gray-500 mt-2">
                Maximum: {checkoutLink.maxQty}
              </p>
            )}
          </div>

          {/* Size Selector */}
          {checkoutLink.sizes && checkoutLink.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectSize')} *
              </label>
              <div className="flex flex-wrap gap-2">
                {checkoutLink.sizes.map((size) => (
                  <label key={size} className="cursor-pointer">
                    <input
                      type="radio"
                      value={size}
                      {...register('selectedSize')}
                      className="peer sr-only"
                    />
                    <div className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-300 transition-colors">
                      {size}
                    </div>
                  </label>
                ))}
              </div>
              {errors.selectedSize && (
                <p className="mt-2 text-sm text-red-500">{errors.selectedSize.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('deliveryMethod')} *
            </label>
            <select
              {...register('deliveryMethod')}
              className={selectClass}
            >
              <option value="">{t('deliveryMethod')}</option>
              {availableDeliveryMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {errors.deliveryMethod && (
              <p className="mt-1.5 text-sm text-red-500">{errors.deliveryMethod.message}</p>
            )}
          </div>

          {/* Buyer Details */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{t('contactInfo')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fullName')} *
              </label>
              <input
                type="text"
                placeholder={t('fullNamePlaceholder')}
                {...register('fullName')}
                className={inputClass}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('phone')} *
              </label>
              <input
                type="tel"
                placeholder={t('phonePlaceholder')}
                {...register('phone')}
                className={inputClass}
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('city')} *
              </label>
              <select
                {...register('city')}
                className={selectClass}
              >
                <option value="">{t('selectCity')}</option>
                {uzbekCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="mt-1.5 text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('address')} *
              </label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder={t('addressPlaceholder')}
                className={`${inputClass} resize-none`}
              />
              {errors.address && (
                <p className="mt-1.5 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('telegram')}
              </label>
              <input
                type="text"
                placeholder={t('telegramPlaceholder')}
                {...register('username')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Privacy Options - Subtle Radio Cards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('saveDetails')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50/80 transition-colors has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/30">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    value="no"
                    {...register('saveDetails')}
                    className="peer w-4 h-4 border border-gray-300 rounded-full appearance-none checked:border-blue-500 checked:border-[5px] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {t('saveNo')}
                </span>
              </label>
              <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50/80 transition-colors has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/30">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    value="yes"
                    {...register('saveDetails')}
                    className="peer w-4 h-4 border border-gray-300 rounded-full appearance-none checked:border-blue-500 checked:border-[5px] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {t('saveYes')}
                </span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
          >
            {submitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </main>
    </div>
  )
}

