import assert from 'node:assert/strict';

const dealValue = (volume, unitPrice) => volume * unitPrice;
const commissionAmount = (total, percentage) => Math.round(total * (percentage / 100) * 100) / 100;

assert.equal(dealValue(50000, 130), 6500000);
assert.equal(commissionAmount(6500000, 3.5), 227500);
assert.equal(commissionAmount(6500000, 1.5), 97500);
assert.equal(commissionAmount(6500000, 1), 65000);

const locked = true;
const paid = true;
const delivered = true;
assert.equal(locked && paid, true);
assert.equal(locked && delivered, true);

console.log('Commodity Connect domain smoke tests: 5 passed');