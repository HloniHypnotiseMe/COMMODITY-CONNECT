import type { CommissionParticipant, DealStatus } from './types';

export const DEAL_STATUSES: DealStatus[] = ['open', 'escrow_secured', 'closed'];

export const DOCUMENT_SEQUENCE = ['LOI','FCO','BCL','POP','SGS','NCNDA','IMFPA','BL'] as const;

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