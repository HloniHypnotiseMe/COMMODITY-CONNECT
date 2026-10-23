# Commodity Connect — Production Gates

This file records the intended architecture and the evidence still required. A source-code contract is not proof of a deployed runtime.

## Source-level foundation

- React/Vite application shell and CI/build scripts. GitHub Pages deployment is retired; production targets the C6 self-hosted stack.
- 21-commodity catalogue and deal-value calculator.
- Deterministic commission calculation rounded to cents.
- C6 SaaS Core product API client/configuration boundary.
- RemotePay payment-link client boundary with idempotency key and provider-status refresh.
- UI distinguishes payment-link creation from actual payment confirmation.
- Demo lifecycle advancement is disabled unless `VITE_DEMO_MODE=true`.
- Evidence-first deal lifecycle and escrow reconciliation contracts.

These bullets describe repository code, not a successful live deployment or real financial event. Verify against source and CI before release certification.

## Architecture decision: API and persistence

Commodity Connect frontend -> C6 SaaS Core API -> server-side adapter -> C6-operated self-hosted Supabase/PostgreSQL.

C6 SaaS Core owns authentication/authorization, tenant scoping, product operations, audit and the server-side credential boundary. Supabase/PostgreSQL is the intended shared persistence layer behind the API. Product browsers must not connect directly to Supabase/PostgreSQL or contain service-role, database or C6 control-plane credentials.

PocketBase is retired as an application runtime. Do not deploy a PocketBase service, add PocketBase dependencies, require `VITE_POCKETBASE_URL`, or treat old PocketBase hooks/collections as the current production path. Historical documents may preserve context but should be labelled historical.

## Deployment and runtime proof

The production target is the C6 self-hosted stack: C6-Os -> c6-deploy -> Contabo Node 01 -> Docker/Compose -> Caddy/Cloudflare.

Before claiming WORKS/VERIFIED/LIVE, capture evidence for:
- C6 SaaS Core API deployed and authenticated from the Commodity Connect frontend.
- Supabase/PostgreSQL backing configured server-side and migrations applied successfully.
- Tenant authorization, data-access policy and server-side validation tested.
- Deal/document/commission lifecycle gates exercised against the deployed API and database.
- Audit/evidence records persisted and correctly scoped.
- External HTTPS smoke test and production-domain response.
- A real RemotePay/provider test with verified provider evidence and webhook reconciliation.

A frontend build alone is not sufficient.

## RemotePay integration security

Commodity Connect must use the shared C6/RemotePay server-side boundary. The frontend must not call the payment provider directly or contain merchant/provider credentials. Caller authorization, idempotency and webhook verification must be exercised before production use.

## Verification authority

NCNDA/IMFPA and other deal documents must be verified by an authorized operator before chain lock. Upload alone cannot satisfy this gate.

## Financial release

No financial release is claimed until RemotePay/provider evidence and required delivery/document evidence are available. Commodity Connect does not create a fake local custody state.

## Crypto settlement

USDT/BTC payout destinations can be modelled, but crypto settlement remains disabled until a real supported settlement rail is connected and verified.

## Status vocabulary

- EXISTS: schema/contract/source is committed.
- WORKS: migration/API executes successfully in a real C6 runtime.
- VERIFIED: integration tests and runtime evidence have been recorded.
- LIVE: deployment and external smoke tests have passed.
