import { requireC6PlatformUrl } from './platform-client';

type Participant = { userId: string; role: string; commissionPct: number; commissionAmount: number; walletReady: boolean; walletDestination?: string | null };
type DealInput = { reference: string; commodity: string; grade: string; volume: number; unit: string; unitPrice: number; currency: string; totalValue: number; totalCommissionPct: number; participants: Participant[] };
export type RuntimeDeal = { id: string; reference: string; commodity: string; grade: string; volume: number; unit: string; unit_price: number; currency: string; total_value: number; status: string; commission_locked: boolean; remote_pay_reference?: string | null };

async function request<T>(path: string, init: RequestInit, token: string): Promise<T> {
  const key = String(import.meta.env.VITE_C6_PRODUCT_KEY || '').trim();
  if (!key) throw new Error('C6 product capability key is not configured for this environment.');
  if (!token) throw new Error('Sign in before accessing deal runtime actions.');
  const response = await fetch(`${requireC6PlatformUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'X-C6-Product-Key': key, Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || `C6 SaaS Core returned HTTP ${response.status}`);
  return body as T;
}

export function createDeal(token: string, input: DealInput) {
  return request<RuntimeDeal>('/v1/commodity-connect/deals', { method: 'POST', body: JSON.stringify({ reference: input.reference, commodity: input.commodity, grade: input.grade, volume: input.volume, unit: input.unit, unit_price: input.unitPrice, currency: input.currency, total_value: input.totalValue, total_commission_pct: input.totalCommissionPct, participants: input.participants.map(p => ({ user_id: p.userId, role: p.role, commission_pct: p.commissionPct, commission_amount: p.commissionAmount, wallet_ready: p.walletReady, wallet_destination: p.walletDestination ?? null })) }) }, token);
}

export function addDealDocument(token: string, dealId: string, input: { type: string; filename: string; sizeBytes: number; contentType: string }) {
  return request<{ id: string; deal_id: string; type: string; evidence_id: string | null; verified: boolean; filename: string; size_bytes: number; content_type: string }>(`/v1/commodity-connect/deals/${encodeURIComponent(dealId)}/documents`, { method: 'POST', body: JSON.stringify({ type: input.type, filename: input.filename, size_bytes: input.sizeBytes, content_type: input.contentType }) }, token);
}

export function lockCommissionChain(token: string, dealId: string) {
  return request<RuntimeDeal>(`/v1/commodity-connect/deals/${encodeURIComponent(dealId)}/commission-lock`, { method: 'POST' }, token);
}
