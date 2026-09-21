# Commodity Connect — Production Gates

## Implemented in the current build

- React/Vite application shell and GitHub Pages workflow.
- 21-commodity catalogue and deal-value calculator.
- Deterministic commission calculation rounded to cents.
- PocketBase collections/migrations for KYC, deals, participants, documents, wallets, escrows and audit events.
- Authenticated user onboarding into a pending KYC profile.
- Document upload with enforced document sequence in the client and server-side collection ownership rules.
- Server-side invariant requiring verified NCNDA and IMFPA evidence before commission-chain lock.
- Commission participant snapshot structure and lock state.
- RemotePay payment-link client boundary with idempotency key and provider-status refresh.
- UI explicitly distinguishes payment-link creation from actual payment confirmation.
- Demo lifecycle advancement disabled unless `VITE_DEMO_MODE=true`.
- Server-side escrow reconciliation state machine and lifecycle evidence gates.
- Audit events for deal creation, document activity, commission locking, lifecycle advancement and escrow reconciliation.

## External gates

### 1. GitHub repository

The repository `HloniHypnotiseMe/COMMODITY-CONNECT` now exists and the foundation is being published to it. GitHub Actions is the authoritative CI/build verification once the uploaded files are on `main`.

### 2. PocketBase runtime

A deployed PocketBase instance and `VITE_POCKETBASE_URL` are required for real authentication, persistence, uploads and server-side hooks. The migrations still require execution against the actual PocketBase version selected for deployment.

### 3. RemotePay production integration

Commodity Connect uses the existing RemotePay payment-link boundary. RemotePay's current canonical implementation creates a SimplyBLU hosted checkout, persists it to its transaction ledger and enforces idempotency. Production payment verification still requires a real provider/account test and webhook reconciliation.

### 4. RemotePay API protection

The currently inspected RemotePay `POST /api/v1/payment-links` endpoint does not show a user authentication requirement. Commodity Connect therefore treats live payment integration as an external security/configuration gate until the shared RemotePay boundary has appropriate caller authorization or an equivalent protected server-side integration path.

### 5. Verification authority

NCNDA/IMFPA and other deal documents must be verified by an authorized operator before chain lock. Upload alone cannot satisfy this gate.

### 6. Financial release

No financial release is claimed until RemotePay/provider evidence and the required delivery/document evidence are available. Commodity Connect does not create a fake local custody state.

### 7. Crypto settlement

USDT/BTC payout destinations can be modelled, but crypto settlement remains disabled until a real supported settlement rail is connected and verified.

## Lifecycle hardening completed

- The hardened migration keeps deal lifecycle updates available through the API while moving sensitive field immutability into the server hook after commission lock.
- `pb_hooks/commodity.pb.js` rejects invalid lifecycle transitions, requires confirmed escrow/provider state before `open → escrow_secured`, and requires released escrow plus verified BL evidence before `escrow_secured → closed`.
- Escrow status transitions are operator-reconciled and require payment/release evidence; the client cannot manufacture `confirmed` or `released` financial states.
- Deal/document/escrow actions produce audit events where the runtime can establish an authenticated actor.
- Commodity Connect creates a local escrow record only as a reference to the RemotePay payment; it does not represent custody of funds.