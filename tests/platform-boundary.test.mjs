import assert from 'node:assert/strict';
import { createPlatformPaymentLink, getPlatformPaymentLink, requireC6PlatformUrl } from '../src/platform-client.ts';

assert.equal(typeof createPlatformPaymentLink, 'function');
assert.equal(typeof getPlatformPaymentLink, 'function');
assert.equal(typeof requireC6PlatformUrl, 'function');

const source = await import('node:fs/promises');
const services = await source.readFile(new URL('../src/services.ts', import.meta.url), 'utf8');
assert.match(services, /from ['"]\.\/platform-client['"]/);
assert.doesNotMatch(services, /payment-links/);
assert.doesNotMatch(services, /REMOTEPAY_API_URL/);

const config = await source.readFile(new URL('../src/config.ts', import.meta.url), 'utf8');
assert.doesNotMatch(config, /VITE_REMOTEPAY_API_URL|VITE_REMOTEPAY_MERCHANT_ID|VITE_REMOTEPAY_BRAND_ID/);

console.log('C6 payment boundary tests passed.');
