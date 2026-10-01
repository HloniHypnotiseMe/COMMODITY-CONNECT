import assert from 'node:assert/strict';
const rank = { critical: 4, high: 3, medium: 2, info: 1 };
function build(snapshot) {
  const out = []; const has = t => snapshot.documents.includes(t);
  if (!snapshot.dealId) out.push({ id:'deal-not-saved', severity:'high' }); else if (!snapshot.kycVerified) out.push({ id:'kyc-pending', severity:'high' });
  const required = ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA']; const missing = required.filter(t => !has(t));
  if (missing.length) out.push({ id:'evidence-gap', severity:'high' });
  if (!snapshot.locked) out.push({ id:'commission-unlocked', severity:snapshot.status === 'open' ? 'high' : 'critical' });
  const paid = snapshot.paymentStatus === 'paid' || snapshot.paymentStatus === 'confirmed';
  if (snapshot.dealId && !paid) out.push({ id:'payment-unconfirmed', severity:'critical' });
  if (snapshot.status === 'escrow_secured' && !snapshot.deliveryEvidence) out.push({ id:'delivery-missing', severity:'high' });
  return out.sort((a,b) => rank[b.severity] - rank[a.severity]);
}
const findings = build({ dealId:'CC-1', status:'open', kycVerified:false, documents:['LOI','BCL'], locked:false, paymentStatus:'pending', deliveryEvidence:false, remotePayConfigured:true, pocketBaseConfigured:true });
assert.equal(findings[0].id, 'payment-unconfirmed');
assert.ok(findings.some(f => f.id === 'evidence-gap'));
assert.ok(findings.some(f => f.id === 'kyc-pending'));
assert.ok(findings.some(f => f.id === 'commission-unlocked'));
const complete = build({ dealId:'CC-2', status:'closed', kycVerified:true, documents:['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'], locked:true, paymentStatus:'paid', deliveryEvidence:true, remotePayConfigured:true, pocketBaseConfigured:true });
assert.equal(complete.length, 0);
console.log('FIRE core decision tests: 5 passed');