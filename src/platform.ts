import type { DealStatus } from './types';
import type { DocumentType, TradeUnit } from './domain';
import type { RevenueQuote } from './revenue';

/** Wave 6 C6 Platform boundary. Browser code never receives database or control-plane credentials. */
export const C6_PLATFORM_PRODUCT_ID = 'commodity-connect';
export type PlatformPersistence = 'c6-postgresql' | 'legacy-pocketbase';
export type PlatformReadiness = 'configured' | 'not_configured';
export interface C6PlatformConfig { baseUrl: string; productId: typeof C6_PLATFORM_PRODUCT_ID; }
export interface DealRecord {
  id: string; tenantId: string; reference: string; createdBy: string; commodity: string; grade: string;
  volume: number; unit: TradeUnit; unitPrice: number; currency: string; totalValue: number;
  status: DealStatus; totalCommissionPct: number; commissionLocked: boolean; remotePayReference?: string;
}
export interface DocumentRecord { id: string; dealId: string; type: DocumentType; evidenceId?: string; verified: boolean; verifiedBy?: string; sequenceIndex: number; }
export interface EscrowEvidenceRecord {
  id: string; dealId: string; remotePayReference: string;
  status: 'pending' | 'confirmed' | 'release_requested' | 'released' | 'disputed';
  providerStatus: string; paymentEvidence?: Record<string, unknown>; releaseEvidence?: Record<string, unknown>; releaseReference?: string;
}
export interface PlatformStore {
  createDeal(input: Omit<DealRecord, 'id'>): Promise<DealRecord>;
  getDeal(id: string): Promise<DealRecord>;
  addDocument(input: Omit<DocumentRecord, 'id'>): Promise<DocumentRecord>;
  getDealDocuments(dealId: string): Promise<DocumentRecord[]>;
  getEscrow(dealId: string): Promise<EscrowEvidenceRecord | null>;
  saveRevenueQuote(input: RevenueQuote & { tenantId: string; dealId?: string }): Promise<void>;
}
export function getC6PlatformConfig(env: Record<string, string | undefined> = import.meta.env): C6PlatformConfig {
  return { baseUrl: String(env.VITE_C6_SAAS_CORE_URL || '').replace(/\/$/, ''), productId: C6_PLATFORM_PRODUCT_ID };
}
export function platformReadiness(config: C6PlatformConfig = getC6PlatformConfig()): PlatformReadiness {
  return config.baseUrl ? 'configured' : 'not_configured';
}
export function assertServerOnlyCredentialBoundary(headers: Record<string, string>): void {
  const forbidden = ['authorization', 'x-c6-control-key', 'x-c6-api-key'];
  if (forbidden.some(key => Object.keys(headers).some(actual => actual.toLowerCase() === key))) {
    throw new Error('C6 control-plane credentials must not be supplied by the browser.');
  }
}