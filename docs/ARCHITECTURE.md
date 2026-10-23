# Commodity Connect Architecture

## Product boundary

Commodity Connect is independent of DieselConnect. It does not reuse DieselConnect's product schema or payment code.

## Frontend

React + Vite + TypeScript. The interface is evidence-first: actions that imply financial or legal state must be gated by persisted evidence rather than optimistic UI state.

The browser calls the C6 SaaS Core product API. It must not connect directly to Supabase/PostgreSQL or use a Supabase service-role key. C6 control-plane and database credentials remain server-side.

## C6 platform persistence

The target application data layer is C6-operated self-hosted Supabase/PostgreSQL, accessed only through the server-side C6 SaaS Core adapter. C6 SaaS Core is the controlled product API and authorization boundary; Supabase/PostgreSQL is the shared persistence technology underneath that boundary.

Commodity Connect uses tenant-scoped product tables defined by the C6 SaaS Core Commodity Connect migration. The shared core owns cross-product governance stores such as audit events and evidence records. Commodity Connect owns its product domain rules and presentation.

PocketBase is retired as an application runtime. Historical migration records may mention the former design, but new code, configuration and deployment must not depend on PocketBase. The shared Supabase/PostgreSQL backing and end-to-end C6 adapter remain targets until deployment and runtime tests provide evidence that they work.

## Payment boundary

Commodity Connect does not hold payment credentials or pretend to be a bank. It requests hosted payment checkout from RemotePay and stores the resulting reference against the deal. RemotePay/provider status remains the payment source of truth.

## Deal state

The canonical deal state is open -> escrow_secured -> closed. The C6 PostgreSQL migration is intended to carry server-side database guards for commission locking and lifecycle evidence. open -> escrow_secured requires confirmed RemotePay/provider evidence; escrow_secured -> closed requires released provider evidence and verified BL/delivery evidence.

## Commission protection

Commission percentages are calculated from deal value and persisted as participant records. After verified NCNDA and IMFPA evidence exists, the server-side lock invariant freezes the chain. The lock is an application control; legal enforceability depends on the signed agreements and applicable law.

## Escrow reconciliation boundary

The cc_escrows table is an evidence record, not a money ledger. Provider status, payment evidence, release reference and release evidence are stored for reconciliation. Database guards must prevent a local record from manufacturing confirmed or released financial state.

## Credential boundary

The browser may know public configuration such as the C6 SaaS Core base URL and an appropriately scoped browser-safe product capability. C6 control-plane keys, database credentials, Supabase service-role keys, RemotePay secrets and webhook secrets remain server/runtime-only.
