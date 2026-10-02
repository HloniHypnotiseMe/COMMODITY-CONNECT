import { createPlatformPaymentLink, getPlatformPaymentLink } from './platform-client';

export type PaymentLinkRequest = Parameters<typeof createPlatformPaymentLink>[0];
export type PaymentLinkResponse = Awaited<ReturnType<typeof createPlatformPaymentLink>>;

export function createRemotePayPaymentLink(request: PaymentLinkRequest) {
  return createPlatformPaymentLink(request);
}

export function getRemotePayPaymentLink(paymentId: string) {
  return getPlatformPaymentLink(paymentId);
}
