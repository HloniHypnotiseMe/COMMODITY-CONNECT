import assert from 'node:assert/strict';
import { buildRoleDashboard } from '../src/command-centre.ts';

const base = {
  dealId: 'CC-TEST',
  status: 'open' as const,
  kycVerified: false,
  documents: ['LOI','BCL','FCO','SCO'],
  locked: false,
  paymentStatus: 'pending',
  deliveryEvidence: false,
  remotePayConfigured: true,
  c6SaasCoreConfigured: true,
};

const buyer = buildRoleDashboard('buyer', base);
assert.equal(buyer.role, 'buyer');
assert.ok(buyer.priorities.some(x => x.action.includes('KYC')));

const seller = buildRoleDashboard('seller', base);
assert.ok(seller.priorities.some(x => x.action.includes('POP')));

const facilitator = buildRoleDashboard('facilitator', {
  ...base,
  kycVerified: true,
  documents: ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'],
});
assert.ok(facilitator.priorities.some(x => x.action.includes('commission chain')));

const intermediary = buildRoleDashboard('intermediary', base);
assert.ok(intermediary.priorities.some(x => x.action.includes('document')));

console.log('role operating view tests passed');
