# Commodity Connect

C6 Group / REMOTEPAY FINTECH SERVICES — protected commodity deal-chain infrastructure.

## Product boundary

Commodity Connect uses PocketBase as its intended application data layer and RemotePay as the canonical shared payment infrastructure. 

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



