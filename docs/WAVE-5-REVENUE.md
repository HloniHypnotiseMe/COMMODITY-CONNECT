# COMMODITY-CONNECT — Wave 5 Revenue

**Status:** Wave 5 executed  
**Date:** 2026-10-01

## Approved seven-stream revenue model

1. Escrow/transaction service: 0.75%–1.5% of applicable deal value.
2. Commission-protection fee: 0.25% or flat R5,000.
3. Subscriptions: Free; Mandate Pro R1,500/month; Facilitator Pro R2,500/month; Enterprise R10,000/month.
4. Document verification: BCL R2,500; SGS R3,500; POP R1,500; KYC R7,500.
5. NCNDA/IMFPA generation: R1,500 per populated pack.
6. Premium listings: R2,000/7 days or R5,000/30 days.
7. Data/intelligence: reports, market-price API and lead generation; 1% finder fee on applicable lead/deal basis.

## Safety boundary

This wave implements deterministic pricing/quote capabilities. A payable quote is not evidence that a customer paid.

The revenue layer does not mark payments paid, create escrow custody, release funds, create commission entitlement, assert legal outcomes, or claim provider success. RemotePay remains the payment-truth boundary.

## Production boundary

The repository still uses PocketBase-era persistence. Wave 6 must move the revenue invariants into the C6-owned server/persistence/runtime boundary and establish the authoritative revenue ledger/event interfaces.

## Exit criteria

- [x] All seven approved streams represented.
- [x] Approved prices/ranges encoded.
- [x] Deterministic quote functions implemented.
- [x] Tests cover all seven streams.
- [x] No quote is payment evidence.
- [x] RemotePay remains payment truth.
- [x] Server-side billing/ledger remains a Wave 6 production gate.
