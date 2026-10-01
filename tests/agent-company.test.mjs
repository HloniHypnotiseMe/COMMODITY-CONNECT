import assert from 'node:assert/strict';
function route(f) { const approval = f.department === 'Risk & Compliance' ? 'Risk & Compliance' : f.department === 'Finance' ? 'Finance' : f.department === 'Payments' ? 'Payments' : f.department === 'Verification' ? 'Verification' : undefined; const needs = ['Risk & Compliance','Finance','Payments','Verification'].includes(f.department) || f.severity === 'critical'; return {to:f.department==='CEO'?'Trade Operations':f.department,status:needs?'approval_required':'ready',requiredApproval:needs?approval:undefined}; }
const criticalPayment=route({id:'x',severity:'critical',department:'Payments',nextAction:'Reconcile provider status'});
assert.equal(criticalPayment.status,'approval_required'); assert.equal(criticalPayment.requiredApproval,'Payments');
const trade=route({id:'y',severity:'high',department:'Trade Operations',nextAction:'Obtain evidence'});
assert.equal(trade.status,'ready');
const risk=route({id:'z',severity:'high',department:'Risk & Compliance',nextAction:'Review KYC'});
assert.equal(risk.status,'approval_required');
console.log('Agent Company routing tests: 4 passed');