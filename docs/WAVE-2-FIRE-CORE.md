# Wave 2 — FIRE Core

**Status:** Implemented on `wave-2/fire-core`.

## Purpose

FIRE is the operational intelligence layer over Commodity Connect state. In Wave 2 it is deliberately deterministic rather than a chatbot: it reads the state supplied by the application and turns it into findings with:
- what is happening;
- what is blocked;
- why it is blocked;
- owning department;
- legitimate next action;
- evidence supporting the conclusion.

## Decision rules

FIRE recognizes:
- persisted vs unsaved deal state;
- KYC verification state;
- the approved nine-document evidence set;
- commission-chain lock state;
- RemotePay/provider payment state;
- delivery evidence;
- legacy PocketBase runtime configuration;
- a closed state whose lifecycle gates are satisfied.

Findings are ordered by severity: `critical`, `high`, `medium`, `info`.

## Safety contract

FIRE cannot:
- mark a payment paid;
- manufacture escrow custody;
- verify a document;
- verify KYC;
- lock a commission chain;
- release funds;
- assert legal enforceability.

It can only report the state it receives and route the next legitimate action.

RemotePay/provider evidence remains the payment truth boundary. Existing V2 server-side lifecycle and escrow gates remain authoritative.

## Wave 2 exit criteria

- [x] FIRE domain types and deterministic decision engine.
- [x] Blocker detection.
- [x] Evidence-gap detection.
- [x] Department ownership.
- [x] Legitimate next-action routing.
- [x] Evidence-backed finding payloads.
- [x] Payment truth remains provider-gated.
- [x] No financial/legal/verification state can be manufactured by FIRE.
- [x] FIRE surface wired into the live deal workspace.
- [x] Automated decision tests added.

## Next wave

**Wave 3 — Agent Company:** connect FIRE findings to the CEO/departments/agent operating model with explicit permissions, approvals, handoffs and evidence contracts.