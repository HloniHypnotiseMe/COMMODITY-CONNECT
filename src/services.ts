import { createPlatformPaymentLink, getPlatformPaymentLink } from './platform-client';

export type PaymentLinkRequest = Parameters<typeof createPlatformPaymentLink>[0];
export type PaymentLinkResponse = Awaited<ReturnType<typeof createPlatformPaymentLink>>;

export function createRemotePayPaymentLink(request: PaymentLinkRequest, token: string) {
  return createPlatformPaymentLink(request, token);
}

export function getRemotePayPaymentLink(paymentId: string, token: string) {
  return getPlatformPaymentLink(paymentId, token);
}
