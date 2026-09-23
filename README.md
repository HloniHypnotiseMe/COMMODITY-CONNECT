# Commodity Connect

C6 Group / REMOTEPAY FINTECH SERVICES — protected commodity deal-chain infrastructure.

## Product boundary

Commodity Connect is being re-homed onto the C6-owned self-hosted platform. The current repository still contains PocketBase-era application data paths; these are migration work, not a production claim. RemotePay remains the canonical shared payment infrastructure. 

## Current architecture status

- **Payment truth:** RemotePay.
- **Platform target:** C6 self-hosted platform / C6-owned Supabase component.
- **Legacy runtime:** PocketBase-era paths remain in this repository and are tracked as a migration gap; they must not be treated as the target production architecture.
- **Claim gate:** UI/code presence is not proof of a live trade, payment, escrow, payout, registration, or external-provider outcome.

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



