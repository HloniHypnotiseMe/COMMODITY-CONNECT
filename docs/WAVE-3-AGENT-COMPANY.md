# Wave 3 — Agent Company

## Purpose
Connect FIRE findings to explicit departmental agents without allowing an agent to manufacture source-of-truth state.

## Operating model
FIRE observes and explains. Department agents receive the finding. Operators perform permitted follow-up work. Approvers handle gated decisions. CEO remains the escalation/coordination layer rather than a bypass around evidence controls.

## Permissions
- Trade Operations: coordinate deals and delivery-evidence follow-up; cannot release funds or declare payment confirmed.
- Risk & Compliance: route/review KYC and risk escalations; cannot self-approve or release funds.
- Verification: route document review and evidence completeness; cannot declare authenticity without authorized verification.
- Finance: review commission-chain state; cannot invent entitlements or release funds.
- Payments: reconcile provider status; cannot mark provider payment paid or release funds.
- Technology: diagnose/migrate runtime and integrations; cannot alter financial truth.
- Commercial: coordinate buyer/seller workflow; cannot override risk gates.
- Data & Intelligence: report source-backed state; cannot change source-of-truth state.

## Handoff contract
Every FIRE finding becomes a typed handoff with source finding ID, destination department, status, action and approval requirement where applicable. Critical findings and approver-owned findings require authorized approval.

## Safety
Agents do not become an alternate source of truth. Existing server-side lifecycle gates and RemotePay/provider evidence remain authoritative.

## Exit criteria
- [x] Department agent registry.
- [x] Explicit capability/forbidden-action boundaries.
- [x] FIRE-to-agent routing.
- [x] Approval-required state for gated work.
- [x] Typed handoff records.
- [x] Automated routing tests.
- [x] No financial/provider/legal state mutation through the agent layer.

## Next
Wave 4 — Trade/Evidence: resolve the V1/V2 document sequence and implement commodity units/grades plus evidence-state enforcement end-to-end.