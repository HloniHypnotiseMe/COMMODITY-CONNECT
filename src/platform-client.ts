export type PlatformPaymentLinkRequest = {
  customerReference: string;
  description: string;
  amountMinor: number;
  currency: string;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type PlatformPaymentLinkResponse = {
  payment_id: string;
  transaction_id: string;
  status: string;
  payment_url: string;
  currency: string;
  amount_minor: number;
  merchant_id?: string;
  brand_id?: string;
};

export function requireC6PlatformUrl(): string {
  const url = String(import.meta.env.VITE_C6_SAAS_CORE_URL || '').replace(/\/$/, '');
  if (!url) throw new Error('C6 SaaS Core is not configured for this environment.');
  return url;
}

function productHeaders(): Record<string, string> {
  const key = String(import.meta.env.VITE_C6_PRODUCT_KEY || '').trim();
  if (!key) throw new Error('C6 product capability key is not configured for this environment.');
  return { 'X-C6-Product-Key': key };
}

async function platformRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${requireC6PlatformUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...productHeaders(), ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || `C6 SaaS Core returned HTTP ${response.status}`);
  return body as T;
}

export function createPlatformPaymentLink(request: PlatformPaymentLinkRequest) {
  return platformRequest<PlatformPaymentLinkResponse>('/v1/commodity-connect/payment-links', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getPlatformPaymentLink(paymentId: string) {
  return platformRequest<PlatformPaymentLinkResponse>(
    `/v1/commodity-connect/payment-links/${encodeURIComponent(paymentId)}`,
    { method: 'GET' },
  );
}
