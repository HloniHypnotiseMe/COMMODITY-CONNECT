# Commodity Connect Architecture

## Product boundary

Commodity Connect is independent of DieselConnect. It does not reuse DieselConnect's product schema or payment code.

## Frontend

React + Vite + TypeScript. The interface is evidence-first: actions that would imply financial or legal state are gated by persisted evidence rather than optimistic UI state.

## C6 platform persistence

The target application data layer is the shared C6 SaaS Core PostgreSQL runtime. Commodity Connect uses tenant-scoped product tables defined by the C6 SaaS Core Commodity Connect migration.

The shared core owns cross-product governance stores such as audit events and evidence records. Commodity Connect owns its product domain rules and presentation.

PocketBase files remain in this repository only as migration/dev compatibility while the server-side C6 product adapter is admitted. They are not the final production persistence target.

## Payment boundary

Commodity Connect does not hold payment credentials or pretend to be a bank. It requests hosted payment checkout from RemotePay and stores the resulting reference against the deal. RemotePay/provider status remains the payment source of truth.

## Deal state

The canonical deal state is open -> escrow_secured -> closed. The C6 PostgreSQL migration carries server-side database guards for commission locking and lifecycle evidence. open -> escrow_secured requires confirmed RemotePay/provider evidence; escrow_secured -> closed requires released provider evidence and verified BL/delivery evidence.

## Commission protection

Commission percentages are calculated from deal value and persisted as participant records. After verified NCNDA and IMFPA evidence exists, the server-side lock invariant freezes the chain. The lock is an application control; legal enforceability depends on the signed agreements and applicable law.

## Escrow reconciliation boundary

The cc_escrows table is an evidence record, not a money ledger. Provider status, payment evidence, release reference and release evidence are stored for reconciliation. Database guards prevent a local record from manufacturing confirmed or released financial state.

## Credential boundary

The browser may know only public configuration such as the C6 SaaS Core base URL. C6 control-plane keys, database credentials, RemotePay secrets and webhook secrets remain server/runtime-only.