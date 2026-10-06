import assert from 'node:assert/strict';

const { buildFireIntelligence } = await import('../src/fire.ts');

const findings = buildFireIntelligence({
  dealId:'CC-1', status:'open', kycVerified:false,
  documents:['LOI','BCL'], locked:false, paymentStatus:'pending',
  deliveryEvidence:false, remotePayConfigured:true, c6SaasCoreConfigured:true
});
assert.equal(findings[0].id, 'payment-unconfirmed');
assert.ok(findings.some(f => f.id === 'evidence-gap'));
assert.ok(findings.some(f => f.id === 'kyc-pending'));
assert.ok(findings.some(f => f.id === 'commission-unlocked'));

const complete = buildFireIntelligence({
  dealId:'CC-2', status:'closed', kycVerified:true,
  documents:['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'],
  locked:true, paymentStatus:'paid', deliveryEvidence:true,
  remotePayConfigured:true, c6SaasCoreConfigured:true
});
assert.equal(complete.length, 1);
assert.equal(complete[0].id, 'lifecycle-ready');

const unresolvedRuntime = buildFireIntelligence({
  dealId:'CC-3', status:'open', kycVerified:true,
  documents:['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'],
  locked:true, paymentStatus:'confirmed', deliveryEvidence:false,
  remotePayConfigured:true, c6SaasCoreConfigured:false
});
assert.ok(unresolvedRuntime.some(f => f.id === 'c6-runtime'));

console.log('FIRE core decision tests: 6 passed');
