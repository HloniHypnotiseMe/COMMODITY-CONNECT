# Commodity Connect

C6 Group / REMOTEPAY FINTECH SERVICES — protected commodity deal-chain infrastructure.

## Product boundary

Commodity Connect is being re-homed onto the C6-owned self-hosted platform. C6 SaaS Core is the target persistence/control plane, backed by PostgreSQL.

The production payment path is:

```
Commodity Connect browser
  -> C6 SaaS Core
  -> C6 RemotePay adapter
  -> RemotePay/provider
  -> provider evidence
  -> C6 PostgreSQL
  -> downstream events/audit
```

The browser must never call RemotePay directly or receive RemotePay merchant/provider secrets.

PocketBase-era application data paths remain only as migration/dev compatibility and are not the final production runtime.

## Current architecture status

- Payment truth: RemotePay/provider evidence, reached through the C6 platform boundary.
- Platform target: C6 SaaS Core / shared C6 PostgreSQL.
- Legacy runtime: PocketBase-era paths remain only for migration/dev compatibility.
- Claim gate: UI/code presence is not proof of a live trade, payment, escrow, payout, registration, or external-provider outcome.
- The C6 payment-link route contract is defined in `src/platform-client.ts`; the corresponding C6 SaaS Core runtime endpoint is now implemented on the C6 core Wave 8 branch, but the cross-service runtime path still requires deployment/exercise before this integration can be called WORKS/VERIFIED/LIVE.

## Foundation

- React + Vite + TypeScript
- Commodity catalogue
- Deal-value and commission calculator
- Commodity-specific units and grade validation
- Canonical document sequence
- FIRE operational intelligence
- Permissioned Agent Company routing
- Seven-stream revenue quote model
- C6 platform persistence contract
- Evidence-first payment/escrow messaging
- C6 platform payment boundary client

## Production principles

- UI state is not payment evidence.
- RemotePay/provider ledger evidence is the source of payment truth.
- NCNDA/IMFPA locking is an application control, not a claim of automatic legal enforceability.
- Sensitive KYC and payout data must never be exposed in logs.
- Commodity Connect uses only a browser-safe, product-scoped capability token; RemotePay/provider credentials remain server-side.
- Crypto settlement is disabled until a real supported rail is verified.
- C6 control-plane credentials never enter browser bundles.
- No product may create a second direct RemotePay integration when the shared C6 adapter is the authoritative payment boundary.


## C6-native deployment

Production deployment is owned by the C6 deployment stack: C6-Os -> c6-deploy -> Contabo Node 01 -> Docker/Compose -> Caddy/Cloudflare.

The frontend is built with a root URL base so it can be served directly from its assigned C6 domain by the Caddy hosting edge.

Deployment-time browser configuration uses VITE_C6_SAAS_CORE_URL and VITE_C6_PRODUCT_KEY. These are bounded browser configuration values; C6 control-plane and payment-provider secrets remain server-side.

A successful frontend build is not a LIVE claim. LIVE requires external HTTPS verification and the authenticated identity, evidence, deal lifecycle and payment/provider verification gates defined by C6 SaaS Core.
