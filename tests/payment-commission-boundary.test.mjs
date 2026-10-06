import assert from 'node:assert/strict';
import { isPaymentConfirmed, commissionSnapshot } from '../src/domain.ts';

assert.equal(isPaymentConfirmed('paid'), true);
assert.equal(isPaymentConfirmed('CONFIRMED'), true);
assert.equal(isPaymentConfirmed('pending'), false);
assert.throws(() => commissionSnapshot(100, [
  { role: 'facilitator', name: 'A', percentage: 60, amount: 0, walletReady: false },
  { role: 'seller_mandate', name: 'B', percentage: 41, amount: 0, walletReady: false },
]), /cannot exceed 100/);

console.log('Payment and aggregate commission boundary tests passed.');
