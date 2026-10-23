# WAVE 6 — C6 PLATFORM PERSISTENCE

## Goal

Place Commodity Connect's authoritative product persistence behind the shared C6 SaaS Core API, with C6-operated self-hosted Supabase/PostgreSQL as the intended persistence layer.

## What is encoded in the repository

- The documented C6 SaaS Core migration defines tenant-scoped Commodity Connect tables for KYC profiles, deals, participants, documents, escrow evidence and revenue quotes.
- The intended PostgreSQL schema/constraints carry lifecycle and evidence invariants, including verified NCNDA + IMFPA before commission lock, no unlock, RemotePay/provider evidence before `escrow_secured`, and verified BL + released provider evidence before close.
- C6 SaaS Core is the shared API/persistence control boundary; Commodity Connect remains the product.
- Core `audit_events` and `evidence_records` are intended as canonical cross-product governance/evidence stores.
- `src/platform.ts` defines the browser-safe product contract and excludes C6 control-plane credentials.
- The frontend uses C6 SaaS Core configuration; it must not connect directly to Supabase/PostgreSQL or use a Supabase service-role key.

## Migration posture

PocketBase is retired as an application runtime. The migration is not complete merely because a client contract or schema exists. The server-side C6 product adapter, Supabase/PostgreSQL backing, migrations, authentication, tenant isolation and end-to-end lifecycle must be deployed and exercised before the system can be described as WORKS/VERIFIED/LIVE.

The next integration step is server-side adapter and persistence verification, not a direct browser-side database swap. A browser must never receive control-plane keys, database credentials, or provider secrets.

## Evidence boundary

Creating a platform record or quote is not proof of payment, custody, release, KYC verification or legal enforceability. RemotePay/provider evidence remains the payment truth boundary.

## Status vocabulary

- EXISTS: schema and contract are committed.
- WORKS: migration/API executes successfully in a real C6 PostgreSQL runtime.
- VERIFIED: integration tests and runtime evidence have been recorded.
- LIVE: Contabo deployment and external smoke tests have passed.

The source contract can establish EXISTS only. Do not claim WORKS/VERIFIED/LIVE without runtime evidence.
