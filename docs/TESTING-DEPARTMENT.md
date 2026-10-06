# Commodity Connect — Testing Department

**Status:** Active cross-cutting QA function  
**Owner:** C6 Testing Department  
**Product:** Commodity Connect

## Mission

Prove that implemented Commodity Connect behaviour matches the evidence-backed product contract before a change can be treated as a win.

The Testing Department is independent of feature delivery. It does not create product claims; it verifies claims against executable code, tests, CI results and deployment evidence.

## Gate stack

1. **Domain gate** — trade terms, commodity units, document sequence, commission bounds and lifecycle evidence rules.
2. **Platform boundary gate** — privileged payment/control-plane credentials stay outside browser code and RemotePay remains behind the C6 platform boundary.
3. **Evidence gate** — payment, verification, delivery and release states are not manufactured by UI state.
4. **Contract/document gate** — the reconciled document sequence and V1/V2 safety invariants remain intact.
5. **Build gate** — TypeScript check and production build must pass.
6. **Regression gate** — the full `npm test` suite must pass.
7. **Production gate** — real C6 platform, RemotePay provider, verification authority and deployment evidence are required before a production/live claim.

## CI command

The authoritative CI entry point is:

`npm test` → `npm run check` → `npm run build`

The Testing Department contract suite is included in `npm test` and therefore runs on pull requests and pushes to `main`.

## Claim discipline

A green CI result proves repository-level contracts only. It does **not** prove that a deployed service is live, that RemotePay has processed a real transaction, that documents have been legally verified, or that financial release has occurred.

Those require external production evidence recorded in `docs/PRODUCTION-GATES.md`.

## Current boundary

Commodity Connect's current repository is a frontend/domain/platform-boundary implementation. The documented legacy PocketBase runtime and production C6 platform migration remain separate deployment gates. The Testing Department verifies the current executable surface without inventing backend/runtime evidence.
