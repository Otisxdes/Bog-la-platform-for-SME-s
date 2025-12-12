'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { createCheckoutLinkSchema } from '@/lib/validations'
import { authenticatedFetch } from '@/lib/api'
import type { CreateCheckoutLinkInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, ArrowLeft, Upload, ImageIcon } from 'lucide-react'

export default function NewCheckoutLinkPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      setUploadedImageUrl(data.url)
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: CreateCheckoutLinkInput) => {
    setLoading(true)
    setError(null)

    try {
      // Filter out empty sizes and handle NaN for maxQty
      const cleanedData = {
        ...data,
        sizes: data.sizes.filter((size: string) => size.trim() !== ''),
        maxQty: isNaN(data.maxQty as any) ? undefined : data.maxQty,
        imageUrl: uploadedImageUrl || '',
      }

      const response = await authenticatedFetch('/api/checkout-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || 'Failed to create checkout link'
        throw new Error(errorMessage)
      }

      // Redirect to checkout links list
      router.push('/checkout-links')
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout link. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/checkout-links')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('checkoutLinks.create.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('checkoutLinks.create.subtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('checkoutLinks.create.productDetailsTitle')}</CardTitle>
            <CardDescription>{t('checkoutLinks.create.productDetailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('checkoutLinks.create.productName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                {...register('name')}
                placeholder={t('checkoutLinks.create.productNamePlaceholder')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('checkoutLinks.create.size')} <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      type="text"
                      {...register(`sizes.${index}` as const)}
                      placeholder={t('checkoutLinks.create.sizePlaceholder')}
                      className="flex-1"
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append('')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('checkoutLinks.addAnotherSize')}
                </Button>
              </div>
              {errors.sizes && (
                <p className="text-sm text-destructive">
                  {Array.isArray(errors.sizes)
                    ? errors.sizes.find(e => e?.message)?.message
                    : errors.sizes.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageFile">{t('checkoutLinks.create.productImage')}</Label>

              {!uploadedImageUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Uploading...
                      </div>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-sm text-destructive">{uploadError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Max 5MB. JPEG, PNG, WebP, or GIF.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative aspect-square w-48 rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={uploadedImageUrl}
                      alt="Product preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedImageUrl('')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('checkoutLinks.create.pricingTitle')}</CardTitle>
            <CardDescription>{t('checkoutLinks.create.pricingDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {t('checkoutLinks.create.price')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('checkoutLinks.create.currency')}</Label>
                <Input
                  id="currency"
                  type="text"
                  {...register('currency')}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultQty">{t('checkoutLinks.create.defaultQty')}</Label>
                <Input
                  id="defaultQty"
                  type="number"
                  step="1"
                  {...register('defaultQty', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQty">{t('checkoutLinks.create.maxQty')}</Label>
                <Input
                  id="maxQty"
                  type="number"
                  step="1"
                  {...register('maxQty', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('checkoutLinks.create.deliveryPaymentTitle')}</CardTitle>
            <CardDescription>{t('checkoutLinks.create.deliveryPaymentDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>
                {t('checkoutLinks.create.deliveryOptions')} <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('deliveryOptions.courierCity')}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('checkoutLinks.create.courierCity')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('deliveryOptions.pickup')}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('checkoutLinks.create.pickup')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('deliveryOptions.region')}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('checkoutLinks.create.regionDelivery')}</span>
                </label>
              </div>
              {(!deliveryOptions?.courierCity &&
                !deliveryOptions?.pickup &&
                !deliveryOptions?.region) && (
                <p className="text-sm text-destructive">
                  {t('checkoutLinks.create.deliveryError')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNote">
                {t('checkoutLinks.create.paymentNote')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="paymentNote"
                {...register('paymentNote')}
                rows={4}
                placeholder={t('checkoutLinks.create.paymentNotePlaceholder')}
              />
              {errors.paymentNote && (
                <p className="text-sm text-destructive">{errors.paymentNote.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('checkoutLinks.create.submitting') : t('checkoutLinks.create.submit')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/checkout-links')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}

