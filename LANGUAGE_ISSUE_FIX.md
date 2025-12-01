# Language Issue Fix - English Support

## Issue Identified

You mentioned seeing "English" as an option in the language switcher, and when clicked, the language switcher disappears. This happens because:

1. **English is NOT configured** - Only Russian (ru) and Uzbek (uz) are configured in `i18n/routing.ts`
2. **When you click English** - It tries to navigate to `/en/` routes which don't exist
3. **Result** - 404 or broken layout because the locale layout expects only `ru` or `uz`

## Current Configuration

```typescript
// i18n/routing.ts
export const routing = defineRouting({
  locales: ['ru', 'uz'],  // ← Only Russian and Uzbek
  defaultLocale: 'ru',
  localePrefix: 'as-needed'
});
```

```typescript
// components/LanguageSwitcher.tsx
<select ...>
  <option value="ru">Русский</option>
  <option value="uz">O'zbek</option>
  // No English option here!
</select>
```

## Solutions

### Option 1: Keep Only Russian and Uzbek (Recommended for now)

**This is already done!** The configuration only supports Russian and Uzbek.

**If you're still seeing English:**
1. Clear your browser cache completely
2. Do a hard refresh (Cmd/Ctrl + Shift + R)
3. Check if you have any browser extensions adding language options
4. Restart the development server

**Steps to verify:**
```bash
# Stop the server
# Clear cache
# Start fresh
npm run dev
```

Then navigate to:
- Russian: `http://localhost:3000/ru` or `http://localhost:3000`
- Uzbek: `http://localhost:3000/uz`

**Do NOT try to access:** `http://localhost:3000/en` - it will fail!

---

### Option 2: Add English Support (If needed)

If you actually need English language support, follow these steps:

#### Step 1: Update routing configuration

```typescript
// i18n/routing.ts
export const routing = defineRouting({
  locales: ['ru', 'uz', 'en'],  // ← Add 'en'
  defaultLocale: 'ru',
  localePrefix: 'as-needed'
});
```

#### Step 2: Create English translations

Create `messages/en.json`:

```json
{
  "common": {
    "language": "Language",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "home": {
    "title": "Bog'la for SME's",
    "subtitle": "Simple platform for creating payment links and managing orders for small and medium enterprises",
    "manageLinks": "Manage Links",
    "viewOrders": "View Orders",
    "features": {
      "paymentLinks": {
        "title": "Payment Links",
        "description": "Create personalized links for each product"
      },
      "orderManagement": {
        "title": "Order Management",
        "description": "Track all orders in one place"
      },
      "sizeCustomization": {
        "title": "Size Customization",
        "description": "Add multiple sizes for each product"
      }
    },
    "footer": "All rights reserved"
  },
  "checkoutLinks": {
    "title": "Checkout Links",
    "newButton": "New Link",
    "noLinks": "No checkout links yet. Create your first one!",
    "table": {
      "name": "Name",
      "sizes": "Sizes",
      "url": "URL",
      "createdDate": "Created Date",
      "ordersCount": "Orders Count"
    },
    "create": {
      "title": "Create Checkout Link",
      "productName": "Product Name",
      "productNamePlaceholder": "e.g., Summer T-shirt",
      "size": "Size",
      "sizePlaceholder": "e.g., S, M, L, XL",
      "productImage": "Product Image",
      "productImagePlaceholder": "https://example.com/image.jpg",
      "productImageHelp": "Paste a link to the product image",
      "price": "Price",
      "currency": "Currency",
      "defaultQty": "Default Quantity",
      "maxQty": "Maximum Quantity",
      "deliveryOptions": "Delivery Options",
      "courierCity": "Courier within city",
      "pickup": "Pickup",
      "regionDelivery": "Region delivery",
      "deliveryError": "Select at least one delivery option",
      "paymentNote": "Payment Instructions",
      "paymentNotePlaceholder": "Describe how the buyer should pay...",
      "submit": "Create Link",
      "submitting": "Creating..."
    }
  },
  "orders": {
    "title": "Orders",
    "noOrders": "No orders yet",
    "table": {
      "time": "Time",
      "buyerName": "Buyer Name",
      "product": "Product",
      "size": "Size",
      "paymentStatus": "Payment Status",
      "deliveryStatus": "Delivery Status",
      "actions": "Actions",
      "view": "View"
    },
    "details": {
      "title": "Order Details",
      "orderInfo": "Order Information",
      "orderNumber": "Order Number",
      "createdAt": "Created",
      "product": "Product",
      "quantity": "Quantity",
      "totalPrice": "Total Price",
      "buyerInfo": "Buyer Information",
      "fullName": "Full Name",
      "phone": "Phone",
      "telegram": "Telegram",
      "city": "City",
      "address": "Address",
      "deliveryMethod": "Delivery Method",
      "statuses": "Statuses",
      "paymentStatus": "Payment Status",
      "deliveryStatus": "Delivery Status",
      "updateStatus": "Update Status",
      "paymentStatuses": {
        "pending": "Pending",
        "paid": "Paid",
        "cancelled": "Cancelled"
      },
      "deliveryStatuses": {
        "pending": "Pending",
        "sent": "Sent",
        "delivered": "Delivered"
      }
    }
  },
  "buyer": {
    "checkout": {
      "title": "Checkout",
      "productDetails": "Product Details",
      "price": "Price",
      "selectSize": "Select Size",
      "quantity": "Quantity",
      "deliveryMethod": "Delivery Method",
      "courierCity": "Courier within city",
      "pickup": "Pickup",
      "regionDelivery": "Region delivery",
      "contactInfo": "Contact Information",
      "fullName": "Full Name",
      "fullNamePlaceholder": "Enter your full name",
      "phone": "Phone Number",
      "phonePlaceholder": "+998XXXXXXXXX",
      "telegram": "Telegram username (optional)",
      "telegramPlaceholder": "@username",
      "city": "City",
      "selectCity": "Select city",
      "address": "Delivery Address",
      "addressPlaceholder": "Enter full address",
      "paymentInstructions": "Payment Instructions",
      "totalPrice": "Total to Pay",
      "submit": "Place Order",
      "submitting": "Submitting...",
      "saveDetails": "Save details for next time?",
      "saveYes": "Yes, save",
      "saveNo": "No",
      "useSavedDetails": "Use saved details",
      "clearSavedDetails": "Clear",
      "errors": {
        "loadFailed": "Failed to load checkout page",
        "fullNameRequired": "Full name is required",
        "phoneInvalid": "Invalid Uzbek phone number format (+998XXXXXXXXX)",
        "cityRequired": "City is required",
        "addressRequired": "Address is required",
        "sizeRequired": "Please select a size",
        "deliveryRequired": "Delivery method is required"
      },
      "success": {
        "title": "Order placed successfully!",
        "message": "Thank you for your order. The seller will contact you shortly."
      }
    }
  }
}
```

#### Step 3: Update Language Switcher

```typescript
// components/LanguageSwitcher.tsx
<select ...>
  <option value="ru">Русский</option>
  <option value="uz">O'zbek</option>
  <option value="en">English</option>  {/* ← Add this */}
</select>
```

#### Step 4: Test English routes

After making these changes:
- Navigate to `http://localhost:3000/en`
- Switch between `ru`, `uz`, and `en` using the language switcher
- All pages should work in English

---

## Quick Diagnostic

**To find out where "English" is appearing:**

1. Open browser DevTools (F12)
2. Go to Elements tab
3. Search for "English" in the HTML
4. Look at the element and check if it's:
   - Coming from your code
   - Browser translation feature
   - Browser extension
   - Cached content

**Common causes:**
- ❌ Browser's auto-translate feature (disable it)
- ❌ Browser extension adding language options
- ❌ Stale cache from previous version
- ❌ Old service worker (if you had one)

---

## Current Status

✅ **Russian (ru)** - Fully configured, default language  
✅ **Uzbek (uz)** - Fully configured  
❌ **English (en)** - NOT configured (will break if accessed)

## Recommendation

1. First, verify if you actually need English support
2. If you see "English" appearing mysteriously:
   - Clear all cache
   - Check browser settings
   - Disable extensions
   - Hard refresh
3. If English is genuinely needed, follow Option 2 above to add it properly

## Testing After Fix

```bash
# Start fresh
npm run dev

# Test these URLs:
# ✅ http://localhost:3000         → Should redirect to /ru
# ✅ http://localhost:3000/ru      → Russian (works)
# ✅ http://localhost:3000/uz      → Uzbek (works)
# ❌ http://localhost:3000/en      → 404 (expected if English not configured)
```

## Need Help?

If the issue persists:
1. Take a screenshot of where you see "English"
2. Check the browser console for errors
3. Verify `i18n/routing.ts` only has `['ru', 'uz']`
4. Check `components/LanguageSwitcher.tsx` only shows Russian and Uzbek

