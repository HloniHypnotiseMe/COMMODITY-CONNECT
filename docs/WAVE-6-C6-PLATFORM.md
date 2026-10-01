# WAVE 6 — C6 PLATFORM PERSISTENCE

## Goal

Move Commodity Connect's authoritative product persistence contract from the PocketBase-era model to the shared C6 SaaS Core PostgreSQL runtime.

## What is now encoded

- c6-saas-core migration 006 defines tenant-scoped Commodity Connect tables for KYC profiles, deals, participants, documents, escrow evidence and revenue quotes.
- PostgreSQL constraints and triggers carry forward document sequencing, verified NCNDA + IMFPA before commission lock, commercial-field immutability after lock, no unlock, RemotePay/provider evidence before escrow_secured, and verified BL + released provider evidence before close.
- C6 SaaS Core remains the shared persistence/control plane; Commodity Connect remains the product.
- Core audit_events and evidence_records remain the canonical cross-product governance/evidence stores.
- src/platform.ts defines the browser-safe product contract and deliberately excludes C6 control-plane credentials.

## Migration posture

PocketBase is legacy/migration-only. The current browser implementation still contains PocketBase calls because the C6 SaaS Core product CRUD API and server-side product adapter are not yet deployed to the Contabo runtime.

The next integration step is server-side adapter wiring, not another frontend-only database swap. A browser must never receive CONTROL_PLANE_KEY, database credentials, or provider secrets.

## Evidence boundary

Creating a platform record or quote is not proof of payment, custody, release, KYC verification or legal enforceability. RemotePay/provider evidence remains the payment truth boundary.

## Status vocabulary

- EXISTS: schema and contract are committed.
- WORKS: migration/API executes successfully in a real C6 PostgreSQL runtime.
- VERIFIED: integration tests and runtime evidence have been recorded.
- LIVE: Contabo deployment and external smoke tests have passed.

Wave 6 reaches EXISTS for the shared persistence contract. It does not claim WORKS/VERIFIED/LIVE because the Contabo runtime is not provisioned yet.