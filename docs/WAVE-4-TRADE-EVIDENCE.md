# COMMODITY-CONNECT — Wave 4 Trade / Evidence

**Status:** Wave 4 executed
**Date:** 2026-10-01

## Objective

Turn the Wave 1 reconciliation decisions into explicit trade-term and evidence sequencing rules.

## Document workflow contract

The application workflow is now:

`LOI → BCL → FCO → SCO → POP → SGS → BL → NCNDA → IMFPA`

This is a product workflow contract only. It does not assert that these documents have a universal legal meaning, authenticity, or enforceability.

Uploads are sequential: a document cannot be uploaded until every earlier workflow document is present. Upload still does **not** mean verified.

## Commodity terms

The deal builder now uses a commodity-specific unit model instead of hard-coding MT. Supported configured units are:

- MT — metric tonne
- KG — kilogram
- Oz — ounce
- L — litre
- Carat — diamond-specific quantity option

The mapping is an application configuration preset. It is deliberately not represented as a universal market-standard claim; production can refine allowed units/grades per commodity as commercial requirements are verified.

Every configured commodity requires a non-empty grade/specification field. Unit and quantity must pass domain validation before a deal is persisted.

## Evidence boundary

- Present/uploaded is distinct from verified.
- FIRE remains the operational reader of supplied state.
- RemotePay remains the payment truth boundary.
- BL is the delivery-evidence document in the current product workflow.
- NCNDA/IMFPA remain required chain evidence before commission locking.
- No UI control can create payment confirmation, custody, legal enforceability, document authenticity, or fund release.

## Commodity catalogue reconciliation

The repository currently contains **22** commodity entries in `src/types.ts` / `src/data.ts`, despite earlier Wave 1 documentation saying 21. Wave 4 does not silently remove a commodity. The catalogue count discrepancy is recorded for reconciliation rather than inventing a missing/duplicate entry.

## Migration note

These domain rules currently protect the client workflow. PocketBase/server-side migration remains a later production gate; Wave 6 must carry the same sequence/unit invariants into the C6-owned persistence/runtime boundary.

## Exit criteria

- [x] Approved document sequence is explicit in the domain.
- [x] SCO is restored to the workflow and UI.
- [x] Sequential upload gate uses one domain source of truth.
- [x] Commodity-specific unit selection replaces hard-coded MT.
- [x] Grade and trade-term validation are explicit.
- [x] Tests cover sequence and unit/grade rules.
- [x] Evidence boundaries remain unchanged.

## Next wave

**Wave 5 — Revenue:** implement the approved revenue streams as explicit, evidence-backed pricing/ledger capabilities without fabricating payment, custody, settlement, or payout outcomes.
