# Commodity Connect

C6 Group / REMOTEPAY FINTECH SERVICES — protected commodity deal-chain infrastructure.

## Product boundary

Commodity Connect is being re-homed onto the C6-owned self-hosted platform. The shared C6 SaaS Core is the target persistence/control plane, backed by PostgreSQL. The current repository still contains PocketBase-era application data paths as migration/dev compatibility; these are not the final production runtime.

## Current architecture status

- Payment truth: RemotePay.
- Platform target: C6 SaaS Core / shared C6 PostgreSQL.
- Legacy runtime: PocketBase-era paths remain only for migration/dev compatibility.
- Claim gate: UI/code presence is not proof of a live trade, payment, escrow, payout, registration, or external-provider outcome.

## Current foundation

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

## Production principles

- UI state is not payment evidence.
- RemotePay/provider ledger evidence is the source of payment truth.
- NCNDA/IMFPA locking is an application control, not a claim of automatic legal enforceability.
- Sensitive KYC and payout data must never be exposed in logs.
- Crypto settlement is disabled until a real supported rail is verified.
- C6 control-plane credentials never enter browser bundles.