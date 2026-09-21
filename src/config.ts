export const config = {
  pocketBaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
  remotePayApiUrl: import.meta.env.VITE_REMOTEPAY_API_URL || '',
  remotePayMerchantId: import.meta.env.VITE_REMOTEPAY_MERCHANT_ID || '',
  remotePayBrandId: import.meta.env.VITE_REMOTEPAY_BRAND_ID || 'commodity-connect',
};

export const isConfigured = {
  pocketBase: Boolean(import.meta.env.VITE_POCKETBASE_URL),
  remotePay: Boolean(config.remotePayApiUrl && config.remotePayMerchantId),
};