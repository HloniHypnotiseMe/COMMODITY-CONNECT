import assert from 'node:assert/strict';

const domain = await import('../src/domain.ts').catch(() => null);
assert.ok(domain, 'domain module should be importable by a TS-aware test runner');

assert.deepEqual([...domain.DOCUMENT_SEQUENCE], ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA']);
assert.equal(domain.nextRequiredDocument([]), 'LOI');
assert.equal(domain.nextRequiredDocument(['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA']), null);
assert.equal(domain.canUploadDocument(['LOI'], 'BCL'), true);
assert.equal(domain.canUploadDocument(['LOI'], 'FCO'), false);
assert.equal(domain.canUploadDocument(['LOI','BCL','FCO','SCO','POP','SGS'], 'BL'), true);
assert.equal(domain.canUploadDocument(['LOI','BCL','FCO','SCO','POP','SGS'], 'NCNDA'), false);

assert.deepEqual(domain.getCommoditySpec('Coal RB1').allowedUnits, ['MT']);
assert.deepEqual(domain.getCommoditySpec('Gold 99.99%').allowedUnits, ['Oz','KG']);
assert.deepEqual(domain.getCommoditySpec('Diesel 50ppm').allowedUnits, ['L']);
assert.deepEqual(domain.getCommoditySpec('Diamond').allowedUnits, ['Carat','KG']);
assert.equal(domain.isAllowedUnit('Petrol', 'L'), true);
assert.equal(domain.isAllowedUnit('Petrol', 'MT'), false);

assert.deepEqual(domain.validateTradeTerms({ commodity:'Coal RB1', grade:'RB1', volume:50000, unit:'MT', unitPrice:130 }), []);
assert.ok(domain.validateTradeTerms({ commodity:'Petrol', grade:'ULP', volume:1000, unit:'MT', unitPrice:1 }).some(e => e.includes('Unit MT')));
assert.ok(domain.validateTradeTerms({ commodity:'Gold 99.99%', grade:'', volume:1, unit:'Oz', unitPrice:1 }).some(e => e.includes('Grade/specification')));

assert.deepEqual(domain.validateTradeTerms({ commodity:'Coal RB1', grade:'RB1', volume:0, unit:'MT', unitPrice:130 }).length, 1);
assert.deepEqual(domain.validateTradeTerms({ commodity:'Coal RB1', grade:'RB1', volume:50000, unit:'MT', unitPrice:-1 }).length, 1);
assert.throws(() => domain.getCommoditySpec('Unknown'), /Unknown/);
assert.throws(() => domain.commissionSnapshot(-1, []), /Total value/);
assert.throws(() => domain.commissionSnapshot(100, [{ role:'buyer', name:'A', percentage:-1, amount:0, walletReady:false }]), /percentage/);
assert.throws(() => domain.commissionSnapshot(100, [{ role:'buyer', name:'A', percentage:101, amount:0, walletReady:false }]), /percentage/);
assert.equal(domain.commissionSnapshot(100000, [{ role:'buyer', name:'A', percentage:1, amount:0, walletReady:false }])[0].amount, 1000);
assert.equal(domain.canAdvanceDeal('open', { paymentConfirmed:true, chainLocked:true }), true);
assert.equal(domain.canAdvanceDeal('escrow_secured', { paymentConfirmed:true, deliveryEvidence:true, chainLocked:true }), true);

console.log('Commodity Connect trade boundary tests: 24 passed');
