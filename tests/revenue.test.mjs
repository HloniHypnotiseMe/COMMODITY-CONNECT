import assert from 'node:assert/strict';
const r=await import('../src/revenue.ts');

assert.equal(r.quoteTransaction(100000,0.75).amount,750);
assert.equal(r.quoteTransaction(100000,1.5).amount,1500);
assert.throws(()=>r.quoteTransaction(0),/greater than zero/);
assert.throws(()=>r.quoteTransaction(-1),/greater than zero/);
assert.throws(()=>r.quoteTransaction(Number.NaN),/greater than zero/);
assert.throws(()=>r.quoteTransaction(100000,2),/between 0.75% and 1.5%/);
assert.throws(()=>r.quoteTransaction(100000,0),/between 0.75% and 1.5%/);
assert.throws(()=>r.quoteTransaction(100000,0.75,''),/currency is required/);

assert.equal(r.quoteCommissionProtection(100000,'percentage').amount,250);
assert.equal(r.quoteCommissionProtection(100000,'flat').amount,5000);
assert.throws(()=>r.quoteCommissionProtection(-1),/greater than zero/);
assert.throws(()=>r.quoteCommissionProtection(100000,'invalid'),/mode is invalid/);

assert.equal(r.quoteSubscription('mandate_pro').amount,1500);
assert.equal(r.quoteSubscription('facilitator_pro').amount,2500);
assert.equal(r.quoteSubscription('enterprise').amount,10000);
assert.equal(r.quoteSubscription('free').payable,false);
assert.throws(()=>r.quoteSubscription('bogus'),/not supported/);

assert.equal(r.quoteVerification('BCL').amount,2500);
assert.equal(r.quoteVerification('SGS').amount,3500);
assert.equal(r.quoteVerification('POP').amount,1500);
assert.equal(r.quoteVerification('KYC').amount,7500);
assert.throws(()=>r.quoteVerification('bogus'),/not supported/);

assert.equal(r.quoteDocumentPack().amount,1500);
assert.equal(r.quotePremiumListing('7d').amount,2000);
assert.equal(r.quotePremiumListing('30d').amount,5000);
assert.throws(()=>r.quotePremiumListing('90d'),/not supported/);

assert.equal(r.quoteIntelligence(100000).amount,1000);
assert.throws(()=>r.quoteIntelligence(0),/greater than zero/);
assert.throws(()=>r.quoteIntelligence(-1),/greater than zero/);
assert.throws(()=>r.quoteIntelligence(100000,''),/currency is required/);

assert.throws(()=>r.percentageFee(-1,1),/non-negative/);
assert.throws(()=>r.percentageFee(100,Number.NaN),/non-negative/);

const q=r.quoteAllApprovedStreams({dealValue:100000,protectedCommissionBasis:100000,subscription:'mandate_pro',verification:'KYC',listing:'30d',intelligenceBasis:50000});
assert.equal(q.length,7);

console.log('Commodity Connect financial boundary tests: 31 passed');
