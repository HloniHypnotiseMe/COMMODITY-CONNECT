import PocketBase from 'pocketbase';
import { config } from './config';

export const pb = new PocketBase(config.pocketBaseUrl);
pb.autoCancellation(false);

export type PaymentLinkRequest = {
  customerReference: string;
  description: string;
  amountMinor: number;
  currency: string;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type PaymentLinkResponse = {
  payment_id: string;
  transaction_id: string;
  status: string;
  payment_url: string;
  currency: string;
  amount_minor: number;
  merchant_id: string;
  brand_id: string;
};

export async function createRemotePayPaymentLink(request: PaymentLinkRequest) {
  if (!config.remotePayApiUrl || !config.remotePayMerchantId) {
    throw new Error('RemotePay is not configured for this environment.');
  }

  const response = await fetch(`${config.remotePayApiUrl.replace(/\/$/, '')}/payment-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: config.remotePayMerchantId,
      brand_id: config.remotePayBrandId,
      source_system: 'commodity-connect',
      customer_reference: request.customerReference,
      description: request.description,
      amount_minor: request.amountMinor,
      currency: request.currency,
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      idempotency_key: request.idempotencyKey,
      metadata: request.metadata || {},
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || `RemotePay returned HTTP ${response.status}`);
  }
  return body as PaymentLinkResponse;
}

export async function getRemotePayPaymentLink(paymentId: string) {
  if (!config.remotePayApiUrl) throw new Error('RemotePay is not configured for this environment.');
  const response = await fetch(`${config.remotePayApiUrl.replace(/\/$/, '')}/payment-links/${encodeURIComponent(paymentId)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `RemotePay returned HTTP ${response.status}`);
  return body as PaymentLinkResponse;
}