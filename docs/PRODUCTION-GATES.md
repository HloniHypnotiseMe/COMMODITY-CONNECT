# Commodity Connect — Production Gates

## Current production architecture

Commodity Connect is being moved onto the C6-owned self-hosted platform. The target production path is:

```
Commodity Connect browser
  -> authenticated C6 SaaS Core
  -> server-side C6 RemotePay adapter
  -> RemotePay / payment provider
  -> verified provider and transaction evidence
  -> C6 PostgreSQL + evidence storage
  -> audit events and downstream workflows
```

The browser must not call RemotePay directly or receive RemotePay merchant/provider credentials. C6 control-plane secrets and provider credentials remain server-side.

**Runtime status:** the C6 SaaS Core/PostgreSQL architecture is the target, but code presence and a passing frontend build do not prove the cross-service path is deployed or live. PocketBase-era migrations, hooks, and data paths are legacy migration/dev compatibility; they are not the final production runtime.

## Implemented in source (not automatically production-verified)

- React/Vite/TypeScript application shell, commodity catalogue and deal-value calculator.
- Commodity-specific units/grade validation and deterministic commission calculations.
- Deal, participant, document-sequence, KYC, commission-lock, and audit-event concepts.
- Document upload sequence and source-level authorization/invariant checks in the legacy PocketBase implementation.
- RemotePay payment-link client boundary with idempotency key and provider-status refresh.
- UI distinction between payment-link creation and actual payment confirmation.
- Demo lifecycle advancement disabled unless `VITE_DEMO_MODE=true`.
- Source-level lifecycle and escrow reconciliation rules that require evidence before protected transitions.
- C6 SaaS Core product-client contract.

These bullets mean the implementation exists in source. Each consequential path still needs tests and runtime evidence before it can be labelled WORKS, VERIFIED, or LIVE.

## Production acceptance gates

### 1. Shared C6 runtime

- [ ] Provision and secure the approved self-hosted C6 deployment target.
- [ ] Deploy C6 SaaS Core, private PostgreSQL, and approved evidence storage through the C6 deployment stack.
- [ ] Configure DNS/TLS and runtime-only secrets without exposing them in browser bundles.
- [ ] Apply reviewed migrations explicitly and verify health/readiness.
- [ ] Prove database and evidence-store write/read round trips, backup, and restore.

### 2. Identity, tenant isolation, and authorization

- [ ] Verify sign-in, tenant/product scoping, participant roles, and server-side authorization against the deployed C6 Core.
- [ ] Prove one tenant/user cannot read or mutate another tenant's deals, KYC records, documents, commission data, or evidence.
- [ ] Ensure document download and mutation operations are authorized on the server, not merely hidden by UI state.
- [ ] Verify the browser receives only the product-scoped capability/configuration it needs; control-plane and provider credentials stay server-side.

### 3. RemotePay integration and payment truth

- [ ] Route payment-link creation through the authenticated C6 Core/server-side RemotePay boundary; never expose a general RemotePay secret to the browser.
- [ ] Confirm caller authorization on the deployed boundary. The current repository's source-level client contract alone is not proof of authorized production access.
- [ ] Verify a real provider test payment and its authenticated callback/reconciliation against RemotePay's canonical ledger.
- [ ] Prove duplicate/replayed callbacks are idempotent and invalid callbacks cannot mutate payment or deal state.
- [ ] Keep payment-link creation distinct from payment confirmation. No UI or local record may manufacture a paid/confirmed state.

### 4. Deal documents and commission-chain lock

- [ ] Require an authorized operator to verify NCNDA/IMFPA and other required deal documents before chain lock.
- [ ] Prove that upload alone cannot satisfy verification.
- [ ] Verify participant snapshots and locked terms cannot be changed after the lock without an authorized, audited workflow.
- [ ] Treat document and commission controls as application controls; do not claim automatic legal enforceability.

### 5. Deal lifecycle, escrow, delivery, and release

- [ ] Run a complete test deal through creation, participant onboarding, required documents, authorized lock, payment-link creation, provider confirmation, dispatch/delivery evidence, dispute handling, and final release/close.
- [ ] Verify every protected transition server-side and record the authenticated actor plus evidence references in the audit trail.
- [ ] Require verified provider/payment evidence before marking escrow secured.
- [ ] Require released escrow plus verified bill-of-lading (BL) evidence before closing a deal.
- [ ] Treat a local escrow record only as a reference to the RemotePay transaction; it does not represent custody of funds.
- [ ] Confirm no payout/release is triggered from UI state alone.

### 6. Crypto and other unsupported settlement rails

- [ ] Keep BTC/USDT and any other unverified settlement rail disabled until an actual provider/settlement integration, controls, reconciliation, and test evidence exist.

### 7. CI, build, and deployed verification

- [ ] Confirm the current GitHub Actions workflow actually executes; a runner failure before steps start is not an application test result.
- [ ] Run unit tests, type check, and production build.
- [ ] Verify the deployed domain over HTTPS and test authenticated identity, evidence upload/read, deal lifecycle, and RemotePay integration against the deployed runtime.
- [ ] Record the commit, environment, test results, timestamps, and evidence references in the C6 completion register.

## Legacy PocketBase material

PocketBase migrations/hooks and their tests remain useful as legacy implementation and migration evidence. They do **not** establish that PocketBase must be provisioned as the final production runtime. Before removing legacy code or data, document any required data migration, verify the C6 Core replacement, and preserve the source data and recovery path.

## Deployment target

Production deployment is owned by the C6 deployment stack:

`C6-Os -> c6-deploy -> Contabo Node 01 -> Docker/Compose -> Caddy/Cloudflare`.

Provisioning and production verification remain separate gates. Do not mark Commodity Connect LIVE until the deployed domain, authenticated identity, evidence store, deal lifecycle, and RemotePay/provider verification gates pass.

## Claim standard

- **EXISTS:** implementation is present in source.
- **WORKS:** the implementation executes successfully in a reproducible test.
- **VERIFIED:** test/runtime evidence has been captured and reviewed.
- **LIVE:** the production deployment has passed external HTTPS and end-to-end acceptance checks.

Never promote a status based only on UI presence, a local build, a mocked test, a payment link, or a workflow that failed before its steps executed.
