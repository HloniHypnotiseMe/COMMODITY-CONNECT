# Commodity Connect

C6 Group / Vat Production — protected commodity deal-chain infrastructure.

## Product boundary

Commodity Connect is a separate product from DieselConnect. It uses PocketBase as its intended application data layer and RemotePay as the canonical shared payment infrastructure. It must not copy DieselConnect's Supabase schema or payment implementation.

## Current foundation

- React + Vite + TypeScript
- Tailwind-compatible UI architecture (CSS foundation included)
- Commodity catalogue (21 commodities)
- Deal-value and commission calculator
- Commission-chain protection UI
- Deal lifecycle foundation
- Evidence-first payment/escrow messaging

## Production principles

- UI state is not payment evidence.
- RemotePay/provider ledger evidence is the source of payment truth.
- NCNDA/IMFPA locking is an application control, not a claim of automatic legal enforceability.
- Sensitive KYC and payout data must never be exposed in logs.
- Crypto settlement is disabled until a real supported rail is verified.

## Remaining integration work

1. PocketBase authentication, collections, rules and migrations.
2. KYC/onboarding and role authorization.
3. Deal/document APIs and immutable commission snapshots.
4. NCNDA/IMFPA evidence workflow.
5. RemotePay server-side payment-link and reconciliation integration.
6. Escrow/release state machine tied to verified payment and delivery evidence.
7. Admin verification and audit trail.
8. End-to-end tests and production deployment.

The GitHub repository `HloniHypnotiseMe/COMMODITY-CONNECT` did not exist at the start of this build. The local repository is therefore the current build artifact until the GitHub repository is created.