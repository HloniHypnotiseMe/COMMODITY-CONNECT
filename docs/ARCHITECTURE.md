# Commodity Connect Architecture

## Product boundary

Commodity Connect is independent of DieselConnect. It does not reuse DieselConnect's Supabase schema or payment code.

## Frontend

React + Vite + TypeScript. The interface is evidence-first: actions that would imply financial or legal state are gated by persisted evidence rather than optimistic UI state.

## Application data

PocketBase is the intended application data layer. Migrations create:

- `kyc_profiles`
- `deals`
- `deal_participants`
- `documents`
- `wallets`
- `escrows`
- `audit_events`

PocketBase API rules enforce authentication, ownership and locked-chain restrictions. `pb_hooks/commodity.pb.js` adds server-side invariants that cannot safely live only in the browser.

## Payment boundary

Commodity Connect does not hold payment credentials or pretend to be a bank. It requests hosted payment checkout from RemotePay and stores the resulting reference against the deal. RemotePay/provider status remains the payment source of truth.

## Deal state

`open` is the initial application state. Transition to `escrow_secured` and `closed` is not a frontend-only action. It requires the appropriate provider/payment and delivery evidence and is advanced through the server-side reconciliation path.

## Commission protection

Commission percentages are calculated from the deal value and persisted as participant records. After verified NCNDA and IMFPA evidence exists, the server-side lock invariant freezes the chain. The lock is an application control; legal enforceability depends on the signed agreements and applicable law.

## Escrow reconciliation boundary

The `escrows` collection is an evidence record, not a money ledger. `pending`, `confirmed`, `release_requested`, `released`, and `disputed` are server-controlled reconciliation states. `confirmed` requires payment evidence; `release_requested` requires a locked deal, `escrow_secured` lifecycle state and verified BL evidence; `released` requires a provider release reference and release evidence. This prevents a frontend button from creating financial truth.