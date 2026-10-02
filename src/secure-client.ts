import { requireC6PlatformUrl } from './platform-client';

type Identity = { id: string; email: string; display_name: string; role: string; status: string };
type TokenResponse = { access_token: string; token_type: string; identity: Identity };
type Kyc = { id: string; legal_name: string; role: string; status: string; verification_notes?: string | null; mandate_document_evidence_id?: string | null };

async function request<T>(path: string, init: RequestInit, token = ''): Promise<T> {
  const key = String(import.meta.env.VITE_C6_PRODUCT_KEY || '').trim();
  if (!key) throw new Error('C6 product capability key is not configured for this environment.');
  const headers = { 'X-C6-Product-Key': key, ...(init.headers || {}) } as Record<string, string>;
  if (!(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${requireC6PlatformUrl()}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || `C6 SaaS Core returned HTTP ${response.status}`);
  return body as T;
}

export const registerIdentity = (input: { email: string; password: string; displayName: string; role: string }) =>
  request<TokenResponse>('/v1/commodity-connect/identity/register', { method: 'POST', body: JSON.stringify({ email: input.email, password: input.password, display_name: input.displayName, role: input.role }) });

export const loginIdentity = (email: string, password: string) =>
  request<TokenResponse>('/v1/commodity-connect/identity/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const createKyc = (token: string, input: { legalName: string; role: string; idNumber: string }) =>
  request<Kyc>('/v1/commodity-connect/kyc', { method: 'POST', body: JSON.stringify({ legal_name: input.legalName, role: input.role, id_number: input.idNumber }) }, token);

export const listMyKyc = (token: string) => request<Kyc[]>('/v1/commodity-connect/kyc/me', { method: 'GET' }, token);

export const uploadKycEvidence = (token: string, kycId: string, file: File) => {
  const body = new FormData(); body.append('file', file);
  return request<{ id: string; status: string }>('/v1/commodity-connect/kyc/' + encodeURIComponent(kycId) + '/evidence', { method: 'POST', body }, token);
};

export const uploadDocumentEvidence = (token: string, dealId: string, documentId: string, file: File) => {
  const body = new FormData(); body.append('file', file);
  return request<{ id: string; status: string }>('/v1/commodity-connect/deals/' + encodeURIComponent(dealId) + '/documents/' + encodeURIComponent(documentId) + '/evidence', { method: 'POST', body }, token);
};
