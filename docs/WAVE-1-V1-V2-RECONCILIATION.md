# COMMODITY-CONNECT — Wave 1 V1/V2 Reconciliation

**Status:** Wave 1 executed  
**Branch:** `wave-1/v1-v2-reconciliation`  
**Date:** 2026-10-01

## Purpose

Establish the authoritative merge contract before feature implementation.

V1 is represented here by:
- the approved COMMODITY-CONNECT product/revenue specification supplied for this consolidation;
- the recoverable V1-era product intent and terminology available to the project;
- current repository history where evidence exists.

The original V1 source tree is **not currently preserved as a Git branch in this repository**. GitHub currently exposes only `main`. Therefore this document does not invent a V1/V2 code diff.

## Current V2 evidence

The current repository contains:
- React + Vite + TypeScript frontend.
- 21-commodity catalogue.
- Deal value and deterministic commission calculations.
- Buyer, seller, buyer-mandate, seller-mandate, facilitator and intermediary roles.
- KYC profile flow.
- Deal, participant, document, wallet, escrow and audit data models.
- Document sequence enforcement.
- Verified NCNDA/IMFPA requirement before commission-chain lock.
- Server-side deal lifecycle invariants.
- Escrow reconciliation state machine.
- RemotePay payment-link boundary and provider-status refresh.
- Evidence-first UI messaging.
- Company operating model with CEO and eight operating departments.
- GitHub Pages CI/deployment workflows.

## V2 constraints to preserve

These are not optional UX details; they are safety/integrity controls:

1. UI state is not payment evidence.
2. RemotePay/provider evidence is the payment truth boundary.
3. Local escrow records are reconciliation references, not custody claims.
4. NCNDA/IMFPA locking is an application control, not automatic legal enforceability.
5. Verified documents require an authorized verification workflow.
6. Locked commission-chain deal fields become immutable.
7. Lifecycle transitions require server-side evidence.
8. Financial release requires provider/release evidence plus required delivery evidence.
9. Crypto settlement remains disabled until a real supported rail is connected and verified.
10. Sensitive KYC/payout information must not be exposed in logs.
11. Commodity Connect remains independent of DieselConnect.

## V1 capability reconciliation

| Capability | Current V2 evidence | Wave 1 decision |
|---|---|---|
| 21 commodities | Present in `src/data.ts` / `src/types.ts` | KEEP |
| Commodity-specific grade/volume/unit | Present, but unit is currently hard-coded to MT in the UI save path | UPGRADE |
| Buyer role | Present | KEEP |
| Seller role | Present | KEEP |
| Buyer Mandate role | Present | KEEP |
| Seller Mandate role | Present | KEEP |
| Facilitator role | Present | KEEP |
| Intermediary role | Present | KEEP / clarify semantics |
| Deal builder | Present | KEEP |
| Deal lifecycle | Present: open → escrow_secured → closed | KEEP / expand only with evidence |
| LOI | Present | KEEP |
| BCL | Present | KEEP |
| FCO | Present | KEEP |
| SCO | Modelled in product specification but current upload UI sequence omits SCO | RESTORE |
| POP | Present | KEEP |
| SGS | Present | KEEP |
| BL | Present | KEEP |
| NCNDA | Present | KEEP |
| IMFPA | Present | KEEP |
| Commission calculator | Present | KEEP |
| Variable commission chain | Present in current implementation | KEEP / harden |
| Commission lock | Present | KEEP / harden |
| Wallet destination model | Present in PocketBase-era schema | MIGRATE / re-verify |
| KYC | Present | KEEP / migrate |
| Document vault | Present | KEEP / migrate |
| Document verification | Present | KEEP / strengthen evidence provenance |
| Escrow workflow | Present as reconciliation state machine | KEEP / re-platform |
| RemotePay integration | Payment-link boundary present | KEEP / move behind production server boundary |
| Provider payment status | Present | KEEP |
| Payment confirmation | Intentionally not manufactured by UI | KEEP |
| Release gating | Server-side invariant present | KEEP |
| Audit events | Present | KEEP / migrate |
| Role dashboards | Current UI is primarily a shared operating surface | UPGRADE |
| FIRE intelligence | Governance model exists; operational FIRE surface is not yet complete | BUILD |
| CEO/departments | Governance model exists | KEEP / connect to runtime |
| Subscriptions | Not implemented as a revenue engine | BUILD in Wave 5 |
| Verification pricing | Not implemented | BUILD in Wave 5 |
| NCNDA/IMFPA paid generation | Not implemented | BUILD in Wave 5 |
| Transaction-service pricing | Not implemented | BUILD in Wave 5 |
| Sponsored listings | Not implemented | DEFER |
| Intelligence/data products | Not implemented | DEFER / strategic |
| PocketBase production architecture | Present as legacy runtime | REMOVE AS PRODUCTION TARGET |
| C6 self-hosted platform | Documented as target | MIGRATE in Wave 6 |

## Important discovered gaps

### 1. Document sequence mismatch

The current client upload sequence is:

`LOI → FCO → BCL → POP → SGS → NCNDA → IMFPA → BL`

The approved product specification includes:

`LOI → BCL → FCO → SCO → POP → SGS → BL → NCNDA → IMFPA`

These must be reconciled in the domain model before Wave 4. We must not silently choose one ordering.

### 2. Unit model is too narrow

The current UI saves `unit: 'MT'` regardless of commodity. The approved model explicitly requires commodity-specific units such as MT, KG, Oz and L.

This becomes a domain capability, not a display-only change.

### 3. PocketBase remains in executable application paths

The repository correctly documents PocketBase as migration work, but `src/services.ts`, `src/config.ts`, migrations and hooks still make it the current persistence/runtime dependency.

That is a migration gap, not a reason to discard the existing invariants.

### 4. RemotePay browser boundary needs production hardening

The current frontend calls the RemotePay API boundary directly. The production architecture must move privileged/payment operations behind the C6-owned server-side integration boundary and preserve provider evidence.

### 5. Revenue engine is not yet implemented

The seven revenue streams are currently a business specification, not an executable financial system. Wave 5 will turn them into explicit pricing, ledger and unit-economics capabilities without claiming unsupported custody or settlement.

### 6. FIRE is not yet an operational intelligence layer

The company operating model exists, but the repository does not yet provide the full FIRE command/decision layer described by the approved end state.

## Merge rule

**V1 supplies product soul and commercial intent.  
V2 supplies engineering discipline and evidence gates.  
C6 supplies platform infrastructure.  
FIRE supplies operational intelligence.  
RemotePay supplies payment truth.**

No later wave may remove an existing V2 safety invariant merely to reproduce V1 UI behaviour.

No V1 capability may be declared recovered solely because a similarly named UI element exists.

Anything not evidenced is marked **UNVERIFIED**, **PLANNED**, or **MIGRATION GAP** rather than invented.

## Wave 1 exit criteria

- [x] Repository and current branch/history inspected.
- [x] Current application architecture inspected.
- [x] Current domain model inspected.
- [x] Current persistence/migration model inspected.
- [x] Current server-side invariants inspected.
- [x] Current tests and production gates inspected.
- [x] Governance operating model inspected.
- [x] V1/V2 capability matrix established.
- [x] Known contradictions/gaps recorded.
- [x] Production target distinguished from legacy PocketBase implementation.
- [ ] Original V1 source tree recovered — **not currently available in GitHub; do not fabricate**.

## Next wave

**Wave 2 — FIRE Core:** turn the approved FIRE concept into an operational intelligence layer over real Commodity Connect state, while retaining the V2 evidence gates.
