'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { createCheckoutLinkSchema } from '@/lib/validations'
import { authenticatedFetch } from '@/lib/api'
import type { CreateCheckoutLinkInput } from '@/lib/validations'

export default function EditCheckoutLinkPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    reset,
  } = useForm<CreateCheckoutLinkInput>({
    resolver: zodResolver(createCheckoutLinkSchema),
    defaultValues: {
      currency: 'UZS',
      defaultQty: 1,
      sizes: [''],
      deliveryOptions: {
        courierCity: false,
        pickup: false,
        region: false,
      },
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error - Type issue with react-hook-form field arrays for primitive types
    name: 'sizes',
  })

  const deliveryOptions = watch('deliveryOptions')

  // Fetch existing checkout link data
  useEffect(() => {
    async function fetchCheckoutLink() {
      try {
        const response = await authenticatedFetch(`/api/checkout-links/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch checkout link')
        }
        const data = await response.json()

        // Pre-fill form with existing data
        reset({
          name: data.name,
          price: data.price,
          currency: data.currency,
          defaultQty: data.defaultQty,
          maxQty: data.maxQty,
          imageUrl: data.imageUrl || '',
          sizes: data.sizes.length > 0 ? data.sizes : [''],
          deliveryOptions: data.deliveryOptions,
          paymentNote: data.paymentNote,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load checkout link')
      } finally {
        setFetching(false)
      }
    }
    fetchCheckoutLink()
  }, [params.id, reset])

  const onSubmit = async (data: CreateCheckoutLinkInput) => {
    setLoading(true)
    setError(null)

    try {
      // Filter out empty sizes and handle NaN for maxQty
      const cleanedData = {
        ...data,
        sizes: data.sizes.filter((size: string) => size.trim() !== ''),
        maxQty: isNaN(data.maxQty as any) ? undefined : data.maxQty,
        imageUrl: data.imageUrl?.trim() || '',
      }

      const response = await authenticatedFetch(`/api/checkout-links/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.details
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || 'Failed to update checkout link'
        throw new Error(errorMessage)
      }

      // Redirect to checkout links list
      router.push('/checkout-links')
    } catch (err: any) {
      setError(err.message || 'Failed to update checkout link. Please try again.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Checkout Link</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkoutLinks.create.productName')} *
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder={t('checkoutLinks.create.productNamePlaceholder')}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkoutLinks.create.size')} *
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`sizes.${index}` as const)}
                  placeholder={t('checkoutLinks.create.sizePlaceholder')}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append('')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add another size
            </button>
          </div>
          {errors.sizes && (
            <p className="mt-1 text-sm text-red-600">
              {Array.isArray(errors.sizes)
                ? errors.sizes.find(e => e?.message)?.message
                : errors.sizes.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkoutLinks.create.productImage')}
          </label>
          <input
            type="url"
            {...register('imageUrl')}
            placeholder={t('checkoutLinks.create.productImagePlaceholder')}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          />
          {errors.imageUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('checkoutLinks.create.productImageHelp')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkoutLinks.create.price')} *
            </label>
            <input
              type="number"
              step="1"
              {...register('price', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkoutLinks.create.currency')}
            </label>
            <input
              type="text"
              {...register('currency')}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkoutLinks.create.defaultQty')}
            </label>
            <input
              type="number"
              step="1"
              {...register('defaultQty', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkoutLinks.create.maxQty')}
            </label>
            <input
              type="number"
              step="1"
              {...register('maxQty', { valueAsNumber: true })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('checkoutLinks.create.deliveryOptions')} *
          </label>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('deliveryOptions.courierCity')}
                className="w-4 h-4 text-blue-400 bg-transparent border-gray-100 rounded focus:ring-0 focus:border-gray-200 transition-colors cursor-pointer hover:border-gray-200"
              />
              <span className="ml-3 text-sm text-gray-700">{t('checkoutLinks.create.courierCity')}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('deliveryOptions.pickup')}
                className="w-4 h-4 text-blue-400 bg-transparent border-gray-100 rounded focus:ring-0 focus:border-gray-200 transition-colors cursor-pointer hover:border-gray-200"
              />
              <span className="ml-3 text-sm text-gray-700">{t('checkoutLinks.create.pickup')}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('deliveryOptions.region')}
                className="w-4 h-4 text-blue-400 bg-transparent border-gray-100 rounded focus:ring-0 focus:border-gray-200 transition-colors cursor-pointer hover:border-gray-200"
              />
              <span className="ml-3 text-sm text-gray-700">{t('checkoutLinks.create.regionDelivery')}</span>
            </label>
          </div>
          {(!deliveryOptions?.courierCity &&
            !deliveryOptions?.pickup &&
            !deliveryOptions?.region) && (
            <p className="mt-1 text-sm text-red-600">
              {t('checkoutLinks.create.deliveryError')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkoutLinks.create.paymentNote')} *
          </label>
          <textarea
            {...register('paymentNote')}
            rows={4}
            placeholder={t('checkoutLinks.create.paymentNotePlaceholder')}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          />
          {errors.paymentNote && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentNote.message}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-300"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
