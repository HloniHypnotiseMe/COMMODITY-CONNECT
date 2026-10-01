import type { CommissionParticipant, Commodity, DealStatus } from './types';

export const DEAL_STATUSES: DealStatus[] = ['open', 'escrow_secured', 'closed'];

/**
 * Product workflow contract. This is an application sequencing rule, not a
 * statement that any document has a particular legal effect in every market.
 */
export const DOCUMENT_SEQUENCE = ['LOI', 'BCL', 'FCO', 'SCO', 'POP', 'SGS', 'BL', 'NCNDA', 'IMFPA'] as const;
export type DocumentType = typeof DOCUMENT_SEQUENCE[number];

export type TradeUnit = 'MT' | 'KG' | 'Oz' | 'L' | 'Carat';

export interface CommoditySpec {
  allowedUnits: readonly TradeUnit[];
  gradeRequired: boolean;
}

const MT: readonly TradeUnit[] = ['MT'];
const MT_KG: readonly TradeUnit[] = ['MT', 'KG'];
const OZ_KG: readonly TradeUnit[] = ['Oz', 'KG'];
const LIQUID: readonly TradeUnit[] = ['L'];
const CARAT_KG: readonly TradeUnit[] = ['Carat', 'KG'];

export const COMMODITY_SPECS: Record<Commodity, CommoditySpec> = {
  'Coal RB1': { allowedUnits: MT, gradeRequired: true },
  'Coal RB2': { allowedUnits: MT, gradeRequired: true },
  'Chrome 42%': { allowedUnits: MT, gradeRequired: true },
  'Manganese': { allowedUnits: MT, gradeRequired: true },
  'Gold 99.99%': { allowedUnits: OZ_KG, gradeRequired: true },
  'Platinum': { allowedUnits: OZ_KG, gradeRequired: true },
  'Palladium': { allowedUnits: OZ_KG, gradeRequired: true },
  'Rhodium': { allowedUnits: OZ_KG, gradeRequired: true },
  'Iron Ore': { allowedUnits: MT, gradeRequired: true },
  'Copper': { allowedUnits: MT_KG, gradeRequired: true },
  'Cobalt': { allowedUnits: MT_KG, gradeRequired: true },
  'Lithium': { allowedUnits: MT_KG, gradeRequired: true },
  'Diamond': { allowedUnits: CARAT_KG, gradeRequired: true },
  'Uranium': { allowedUnits: MT_KG, gradeRequired: true },
  'Vanadium': { allowedUnits: MT_KG, gradeRequired: true },
  'Titanium': { allowedUnits: MT_KG, gradeRequired: true },
  'Diesel 50ppm': { allowedUnits: LIQUID, gradeRequired: true },
  'Diesel 500ppm': { allowedUnits: LIQUID, gradeRequired: true },
  'Petrol': { allowedUnits: LIQUID, gradeRequired: true },
  'Sugar ICUMSA 45': { allowedUnits: MT, gradeRequired: true },
  'Maize': { allowedUnits: MT, gradeRequired: true },
  'Nickel': { allowedUnits: MT_KG, gradeRequired: true },
};

export function getCommoditySpec(commodity: Commodity): CommoditySpec {
  return COMMODITY_SPECS[commodity];
}

export function isAllowedUnit(commodity: Commodity, unit: string): unit is TradeUnit {
  return getCommoditySpec(commodity).allowedUnits.includes(unit as TradeUnit);
}

export function validateTradeTerms(input: { commodity: Commodity; grade: string; volume: number; unit: string; unitPrice: number }): string[] {
  const errors: string[] = [];
  const spec = getCommoditySpec(input.commodity);
  if (!Number.isFinite(input.volume) || input.volume <= 0) errors.push('Volume must be greater than zero.');
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) errors.push('Unit price cannot be negative.');
  if (!isAllowedUnit(input.commodity, input.unit)) errors.push(`Unit ${input.unit} is not configured for ${input.commodity}. Allowed: ${spec.allowedUnits.join(', ')}.`);
  if (spec.gradeRequired && !input.grade.trim()) errors.push(`Grade/specification is required for ${input.commodity}.`);
  return errors;
}

export function nextRequiredDocument(existing: readonly string[]): DocumentType | null {
  return DOCUMENT_SEQUENCE.find(type => !existing.includes(type)) ?? null;
}

export function canUploadDocument(existing: readonly string[], type: string): boolean {
  const index = DOCUMENT_SEQUENCE.indexOf(type as DocumentType);
  if (index < 0) return false;
  return DOCUMENT_SEQUENCE.slice(0, index).every(required => existing.includes(required));
}

export function canAdvanceDeal(status: DealStatus, evidence: { paymentConfirmed: boolean; deliveryEvidence: boolean; chainLocked: boolean }) {
  if (status === 'open') return evidence.paymentConfirmed && evidence.chainLocked;
  if (status === 'escrow_secured') return evidence.deliveryEvidence && evidence.chainLocked;
  return false;
}

export function commissionSnapshot(totalValue: number, participants: CommissionParticipant[]) {
  return participants.map((participant) => ({
    ...participant,
    amount: Math.round(totalValue * (participant.percentage / 100) * 100) / 100,
  }));
}
