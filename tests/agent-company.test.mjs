import assert from 'node:assert/strict';

const { routeFireFinding } = await import('../src/agent-company.ts');

const criticalPayment = routeFireFinding({
  id:'x', severity:'critical', department:'Payments', title:'Payment unconfirmed',
  reason:'Provider evidence is unresolved.', nextAction:'Reconcile provider status.', evidence:[]
});
assert.equal(criticalPayment.status, 'approval_required');
assert.equal(criticalPayment.requiredApproval, 'Payments');

const trade = routeFireFinding({
  id:'y', severity:'high', department:'Trade Operations', title:'Evidence follow-up',
  reason:'Delivery evidence is missing.', nextAction:'Obtain evidence.', evidence:[]
});
assert.equal(trade.status, 'ready');
assert.equal(trade.requiredApproval, undefined);

const criticalTrade = routeFireFinding({
  id:'critical-trade', severity:'critical', department:'Trade Operations', title:'Critical trade finding',
  reason:'A critical trade operation requires escalation.', nextAction:'Escalate.', evidence:[]
});
assert.equal(criticalTrade.status, 'approval_required');
assert.equal(criticalTrade.requiredApproval, 'CEO');

const risk = routeFireFinding({
  id:'z', severity:'high', department:'Risk & Compliance', title:'KYC review',
  reason:'KYC is unresolved.', nextAction:'Review KYC.', evidence:[]
});
assert.equal(risk.status, 'approval_required');
assert.equal(risk.requiredApproval, 'Risk & Compliance');

console.log('Agent Company routing tests: 4 passed');
