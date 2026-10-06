import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const domain = await import('../src/domain.ts');
const platform = await import('../src/platform.ts');

const productionGates = await fs.readFile(new URL('../docs/PRODUCTION-GATES.md', import.meta.url), 'utf8');
const reconciliation = await fs.readFile(new URL('../docs/WAVE-1-V1-V2-RECONCILIATION.md', import.meta.url), 'utf8');
const services = await fs.readFile(new URL('../src/services.ts', import.meta.url), 'utf8');
const config = await fs.readFile(new URL('../src/config.ts', import.meta.url), 'utf8');

assert.deepEqual([...domain.DOCUMENT_SEQUENCE], ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA']);
assert.equal(domain.isAllowedUnit('Coal RB1', 'MT'), true);
assert.equal(domain.isAllowedUnit('Gold 99.99%', 'Oz'), true);
assert.equal(domain.isAllowedUnit('Gold 99.99%', 'MT'), false);
assert.equal(domain.canAdvanceDeal('open', { paymentConfirmed: true, chainLocked: true }), true);
assert.equal(domain.canAdvanceDeal('open', { paymentConfirmed: false, chainLocked: true }), false);
assert.equal(domain.canAdvanceDeal('escrow_secured', { paymentConfirmed: true, deliveryEvidence: true, chainLocked: true }), true);
assert.equal(domain.canAdvanceDeal('escrow_secured', { paymentConfirmed: true, deliveryEvidence: false, chainLocked: true }), false);
assert.throws(() => domain.commissionSnapshot(100, [
  { role: 'facilitator', name: 'A', percentage: 60, amount: 0, walletReady: false },
  { role: 'intermediary', name: 'B', percentage: 41, amount: 0, walletReady: false },
]), /cannot exceed 100/);

assert.equal(platform.C6_PLATFORM_PRODUCT_ID, 'commodity-connect');
assert.doesNotMatch(services, /REMOTEPAY_API_URL/);
assert.doesNotMatch(config, /VITE_REMOTEPAY_API_URL|VITE_REMOTEPAY_MERCHANT_ID|VITE_REMOTEPAY_BRAND_ID/);

for (const required of [
  'RemotePay production integration',
  'Verification authority',
  'Financial release',
  'Crypto settlement',
  'UI explicitly distinguishes payment-link creation from actual payment confirmation',
  'RemotePay/provider evidence',
]) assert.ok(productionGates.includes(required), required);

assert.ok(reconciliation.includes('Anything not evidenced is marked **UNVERIFIED**, **PLANNED**, or **MIGRATION GAP**'));
assert.ok(reconciliation.includes('Commodity Connect remains independent of DieselConnect'));

console.log('Testing Department contract gate: 12 checks passed.');
