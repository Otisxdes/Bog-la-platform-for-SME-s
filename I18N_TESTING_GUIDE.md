# i18n Testing Guide

## Overview
This guide helps you test the multilingual (Russian/Uzbek) setup to ensure language switching works correctly across all pages.

## Setup Complete ✅

The following has been implemented:
- ✅ i18n configuration (Russian default, Uzbek support)
- ✅ Translation files for all pages
- ✅ Locale-aware routing for all pages
- ✅ Language switcher component in seller layout
- ✅ Proper middleware configuration
- ✅ All pages moved under `[locale]` directory

## Installation

Before testing, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Testing Checklist

### 1. Language Switcher Visibility
**Location**: Seller pages (checkout-links, orders)
- [ ] Navigate to `/ru/checkout-links` - language switcher should be visible in header
- [ ] Navigate to `/uz/checkout-links` - language switcher should be visible in header
- [ ] Switcher should show "Русский" and "O'zbek" options

### 2. Default Language Redirect
**Expected**: Russian is the default language
- [ ] Navigate to `/` - should redirect to `/ru` or work without locale prefix
- [ ] Type random path like `/checkout-links` - should work with Russian as default

### 3. Language Switching Persistence
**Test on each page type**:

#### Seller - Checkout Links List (`/checkout-links`)
- [ ] Start on `/ru/checkout-links`
- [ ] Switch language to Uzbek using dropdown
- [ ] URL should change to `/uz/checkout-links`
- [ ] Page content should change to Uzbek
- [ ] Switch back to Russian
- [ ] URL should change to `/ru/checkout-links`
- [ ] Page content should change back to Russian

#### Seller - New Checkout Link (`/checkout-links/new`)
- [ ] Navigate to `/ru/checkout-links/new`
- [ ] Switch to Uzbek
- [ ] All form labels should be in Uzbek
- [ ] Switch back to Russian
- [ ] All form labels should be in Russian

#### Seller - Orders List (`/orders`)
- [ ] Test language switching
- [ ] Table headers should translate
- [ ] Status badges text should remain in English (status values)

#### Seller - Order Details (`/orders/[id]`)
- [ ] Test language switching on an order detail page
- [ ] All labels should translate
- [ ] Form fields and buttons should translate

#### Buyer - Checkout Page (`/b/[seller]/[product]`)
- [ ] Navigate to a checkout link (e.g., `/ru/b/testSeller/product`)
- [ ] All text should be in Russian
- [ ] Change URL to `/uz/b/testSeller/product`
- [ ] All text should change to Uzbek
- [ ] Form labels, buttons, error messages should all translate

### 4. Navigation Link Behavior
Test that navigation between pages preserves the locale:

#### Starting from Russian (`/ru`)
- [ ] On `/ru/checkout-links`, click "New Checkout Link" button
- [ ] Should navigate to `/ru/checkout-links/new`
- [ ] Click "Back" or navigate to orders
- [ ] Should navigate to `/ru/orders`
- [ ] Click on an order "View" link
- [ ] Should navigate to `/ru/orders/[id]`

#### Starting from Uzbek (`/uz`)
- [ ] Repeat all above tests starting from `/uz/checkout-links`
- [ ] All navigation should stay within `/uz/` routes

### 5. Form Submission Redirects
**Critical Test**: Ensure form submissions redirect to correct locale

- [ ] On `/ru/checkout-links/new`, fill out and submit form
- [ ] Should redirect to `/ru/checkout-links` (not `/uz` or missing locale)
- [ ] On `/uz/checkout-links/new`, fill out and submit form
- [ ] Should redirect to `/uz/checkout-links`

### 6. API Routes (Should Work Regardless of Locale)
- [ ] Make API calls from Russian pages - should work
- [ ] Make API calls from Uzbek pages - should work
- [ ] API routes don't have locale prefix: `/api/checkout-links`, `/api/orders`

### 7. Browser Back/Forward
- [ ] Start at `/ru/checkout-links`
- [ ] Navigate to `/ru/orders`
- [ ] Switch language to Uzbek (now at `/uz/orders`)
- [ ] Click browser back button
- [ ] Should go to `/ru/orders` (previous state, not `/uz/checkout-links`)

### 8. Direct URL Access
- [ ] Type `/ru/checkout-links` in address bar - should work
- [ ] Type `/uz/orders` in address bar - should work
- [ ] Type `/orders` without locale - should redirect to `/ru/orders` (default)

### 9. Error Messages
- [ ] On buyer checkout page, submit form with empty fields
- [ ] Error messages should be in current language
- [ ] Switch language and submit again
- [ ] Error messages should be in new language

### 10. Translation Completeness
Check these specific translations are working:

**Russian** (`/ru`):
- "Ссылки на оплату" (Checkout Links)
- "Заказы" (Orders)
- "Создать ссылку" (Create Link)
- "Статус оплаты" (Payment Status)

**Uzbek** (`/uz`):
- "To'lov havolalari" (Checkout Links)
- "Buyurtmalar" (Orders)
- "Havola yaratish" (Create Link)
- "To'lov holati" (Payment Status)

## Known Behavior

### What SHOULD Happen:
✅ Language persists across navigation within the same session
✅ Switching language updates URL and content immediately
✅ Direct URL access with locale works
✅ API routes work from any locale
✅ Form validation errors are translated

### What Should NOT Happen:
❌ Mixing locales in URL (e.g., `/ru/checkout-links` linking to `/uz/orders`)
❌ Losing locale when navigating between pages
❌ Language switcher not working
❌ Untranslated text appearing on pages
❌ API routes having locale prefix

## Troubleshooting

### Issue: Language switcher not visible
**Solution**: Check that you're on a seller route (`/checkout-links`, `/orders`, etc.)

### Issue: Translations not showing
**Solution**: 
1. Check that you're accessing via `/ru/` or `/uz/` prefix
2. Verify `messages/ru.json` and `messages/uz.json` exist
3. Check browser console for errors

### Issue: Navigation loses locale
**Solution**: Ensure the page is using `Link` from `@/i18n/routing`, not `next/link`

### Issue: 404 on routes
**Solution**: Make sure you're using the correct path structure with locale prefix

## File Structure Reference

```
app/
├── layout.tsx                          # Root layout
├── [locale]/                           # Locale wrapper
│   ├── layout.tsx                      # Locale layout
│   ├── (seller)/                       # Seller routes
│   │   ├── layout.tsx                  # Seller layout (has LanguageSwitcher)
│   │   ├── checkout-links/
│   │   │   ├── page.tsx                # List page
│   │   │   └── new/
│   │   │       └── page.tsx            # Create page
│   │   └── orders/
│   │       ├── page.tsx                # List page
│   │       └── [id]/
│   │           └── page.tsx            # Detail page
│   └── (buyer)/                        # Buyer routes
│       └── b/
│           └── [sellerSlug]/
│               └── [checkoutSlug]/
│                   └── page.tsx        # Checkout page
└── api/                                # API routes (no locale)
    ├── checkout-links/
    └── orders/
```

## Success Criteria

All tests should pass for the i18n implementation to be considered complete and working correctly. If any test fails, refer to the troubleshooting section or review the implementation.

