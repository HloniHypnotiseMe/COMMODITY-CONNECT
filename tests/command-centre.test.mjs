import assert from 'node:assert/strict';
import { buildCommandCentre } from '../src/command-centre.ts';

const empty = buildCommandCentre({dealId:'',status:'open',kycVerified:false,documents:[],locked:false,paymentStatus:'not_created',deliveryEvidence:false,remotePayConfigured:false,c6SaasCoreConfigured:false});
assert.equal(empty.metrics.find(m=>m.label==='Deal')?.state,'blocked');
assert.ok(empty.actions.some(a=>a.id==='create-deal'));
assert.ok(empty.actions.some(a=>a.id==='payment'));
assert.ok(!empty.actions.some(a=>a.id==='migration'));

const configured = buildCommandCentre({dealId:'deal-0',status:'open',kycVerified:true,documents:[],locked:false,paymentStatus:'not_created',deliveryEvidence:false,remotePayConfigured:true,c6SaasCoreConfigured:true});
assert.ok(configured.actions.some(a=>a.id==='migration'));

const ready = buildCommandCentre({dealId:'deal-1',status:'closed',kycVerified:true,documents:['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'],locked:true,paymentStatus:'paid',deliveryEvidence:true,remotePayConfigured:true,c6SaasCoreConfigured:false});
assert.equal(ready.metrics.find(m=>m.label==='Documents')?.state,'ready');
assert.equal(ready.metrics.find(m=>m.label==='Payment')?.state,'ready');
assert.equal(ready.lifecycle.at(-1)?.state,'complete');
assert.ok(ready.actions.some(a=>a.id==='evidence-complete'));

console.log('Command centre tests: 5 passed');
