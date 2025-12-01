/**
 * Authenticated fetch wrapper for API calls
 * Adds seller authentication header from localStorage
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Add seller authentication if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bogla_seller_token');
    const sellerData = localStorage.getItem('bogla_seller');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (sellerData) {
      try {
        const seller = JSON.parse(sellerData);
        if (seller.id) {
          headers.set('X-Seller-ID', seller.id);
        }
      } catch (e) {
        console.error('Failed to parse seller data:', e);
      }
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

