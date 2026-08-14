# E-commerce Checkout Service — Design Plan

`next-node-ecom` — extends the existing MVC structure (the same pattern `auth.md` used) to cover cart validation, order creation, Cashfree payment, and order lifecycle.

Current state confirmed from the repo: cart lives client-side only (`redux/cartSlice.js`, localStorage), the checkout page (`app/(products)/checkout/page.jsx`) currently just gates on login and renders a static form, and the backend has no `Order`, `Cart`, or `Payment` model yet — no payment gateway SDK installed either. This plan designs the missing backend piece, using **Cashfree** as the payment gateway.

---

## 0. Where This Fits in the Existing Codebase

Following the folder convention already used for auth/product/address:

| Folder | New files |
|---|---|
| `models/` | `order.model.js`, `paymentTransaction.model.js`, `coupon.model.js` (optional, see §4) |
| `services/` | `checkout.service.js`, `pricing.service.js`, `stock.service.js`, `payment.service.js` (wraps Cashfree SDK) |
| `controllers/` | `checkout.controller.js`, `order.controller.js`, `payment.controller.js` (Cashfree order create + webhook) |
| `routes/` | `checkout.route.js`, `order.route.js`, `payment.route.js` — registered in `routes/index.js` |
| `validators/` | `checkout.validator.js` |
| `middlewares/` | reuse `auth.js`, `requireRole.js`, `rateLimiters.js` as-is; the webhook route needs a raw-body middleware exception (see §3.4) |
| `utils/` | reuse `ApiError`, `ApiResponse`, `asyncHandler`; extend `emailTemplates.js` with order emails |
| `config/` | `config/payment.js` — Cashfree `x-client-id`/`x-client-secret`/API version/environment, alongside existing `mailer.js`, `redis.js`, `token.js` |

> 🔴 **Critical:** `services/` currently only holds `cache.service.js` and `product-search.service.js` — checkout logic should follow that exact pattern (pure business logic, no `req`/`res`), not live inside controllers.

---

## 1. Data Models

| Model | Key Fields |
|---|---|
| **Order** | `user` ref, `orderNumber` (human-readable, not raw ObjectId), `items[]` (see below), `addressSnapshot`, `pricing` (subtotal, discount, shipping, tax, total), `status`, `paymentStatus`, `paymentMethod`, `paymentTransaction` ref, `couponCode`, `idempotencyKey`, timestamps |
| **Order.items[]** (embedded) | `product` ref, **snapshotted** `title`/`image`/`price`/`selectedOptions`, `quantity` |
| **PaymentTransaction** | `gateway` (`"cashfree"`), `cfOrderId`, `paymentSessionId`, `cfPaymentId`, `amount`, `currency`, `status`, `rawWebhookPayload`, `idempotencyKey` |

> 🔴 **Critical:** Snapshot product title/image/price and the shipping address **into the Order** at checkout time — never just store references to live `Product`/`Address` docs. If a product's price changes or an address is edited/deleted later, past orders must stay historically accurate.

---

## 2. Checkout Flow — Step by Step

### Step 1 — Server-side cart validation
Re-fetch every item by ID from the DB (`isActive`, `isDeleted`, `stock`), recompute price server-side from the `Product` document.

> 🔴 **Critical:** Never trust price or stock sent from the frontend cart. `cartSlice.js` is a localStorage-based intent list — the client can send anything. The backend recalculates everything from the current `Product` record.

### Step 2 — Address selection
Reuse `address.model.js` as-is. Verify the selected address actually belongs to `req.user` before using it.

### Step 3 — Pricing calculation
`subtotal` (from validated items) → apply coupon if any → `+ shipping` → `+ tax` → `total`.

> 🔴 **Critical:** Do all money math in the smallest currency unit (paise, since `Product.currency` defaults to `INR`) as integers internally — floating-point rupee math will eventually produce totals that don't reconcile with Cashfree's amount. Convert to rupees only at the boundary when calling Cashfree's API (see §3.2).

### Step 4 — Stock decrement
> 🔴 **Critical — race condition:** two customers checking out the last unit at once is a classic bug. Never do "read stock → check in app code → write stock" (time-of-check/time-of-use gap). Use an atomic conditional update — `Product.updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` — and check `matchedCount`, or wrap the whole order-creation step in a Mongoose transaction.

### Step 5 — Create the Order
Status starts as `pending_payment` (or `placed` directly for COD).

### Step 6 — Payment initiation (Cashfree)
Create a Cashfree order and get back a `payment_session_id` to hand to the frontend. Full detail in **§3**.

### Step 7 — Payment verification
Handled via Cashfree's webhook — full detail in **§3.4**.

### Step 8 — Order confirmation
Three things happen here, in this order, all triggered by the **verified webhook** (§3.4) — not by the frontend redirect:

1. **Save the full, final order state to DB.** The `Order` document already exists (created in Step 5); this step updates it — `status: "confirmed"`, attaches the `PaymentTransaction` result (`cfPaymentId`, amount paid, payment method used), and locks in the snapshot data (items/address/pricing) as the permanent record of what was actually purchased and paid for.
2. **Send the confirmation email.** Fire it async right after the DB update (don't block the webhook response on SMTP) — order number, items, total, delivery address, estimated timeline. Extend `utils/emailTemplates.js` with an `orderConfirmed` template, same pattern as the auth emails.
3. **Clear the cart.** This is a client-side action — trigger it once the frontend sees the order is genuinely `confirmed` (see below), not on the redirect itself.

> 🔴 **Critical — reconciling with §3.3:** the Cashfree `return_url` redirect happens on the user's browser and can arrive *before* your webhook does. Don't show "Order Completed" purely because the redirect landed. Instead, have the redirect page call `GET /orders/:orderId` and either:
> - show the completed-order page immediately if `status` is already `confirmed` (webhook beat the redirect — common, since webhooks are usually fast), or
> - show a short "confirming your payment…" state and poll that same endpoint every couple of seconds for a few tries, falling back to "we'll email you the confirmation" if it's still `pending_payment` after that window (webhook delayed, not failed).
>
> This way the page the user lands on always reflects the real, DB-persisted order state — never a guess based on the redirect alone.

### Step 9 — Post-order lifecycle
Status state machine: `pending_payment → confirmed → processing → shipped → delivered`, with `cancelled` and `refunded` as side branches.

> 🔴 **Critical:** Define allowed transitions explicitly in code (a small state map), not just by convention — block invalid jumps like `delivered → pending_payment` at the service layer, not by trusting whoever calls the update function.

---

## 3. Payment Gateway Integration — Cashfree

Cashfree Payment Gateway (PG) fits naturally here — an Indian gateway, and `Product.currency` already defaults to `"INR"`.

### 3.1 Setup
- **Package:** the official Node SDK is `cashfree-pg` (npm) — the payment-gateway-specific SDK. Don't reach for the older `cashfree-sdk` / `cashfree-payments` packages; those cover Payouts/Marketplace, not order-based checkout.
- **Credentials:** `x-client-id` / `x-client-secret`, generated separately for Sandbox and Production from the Cashfree dashboard — store in `config/payment.js`, read from env vars, same pattern as `config/mailer.js`.
- **API version:** Cashfree requires a versioned `x-api-version` header and has shipped breaking response-schema changes between versions. Pin one specific version in config at build time rather than always tracking "latest" — check Cashfree's current docs for the version to pin, since this moves independently of your release cycle.
- **Environment switch:** `Cashfree.SANDBOX` vs `Cashfree.PRODUCTION` — drive this off an explicit env var, never hardcode.

### 3.2 Order creation (detail on Step 6)
1. After the `Order` is created in your DB with status `pending_payment`, call Cashfree's **Order Create** API — pass `order_amount` (your server-computed `grandTotal`), `order_currency`, `customer_details` (id/email/phone from `req.user`), and `order_meta.return_url` with a `{order_id}` placeholder that Cashfree fills in on redirect.
2. Cashfree responds with a `payment_session_id` — store it on the `PaymentTransaction` record alongside Cashfree's own order ID.
3. Return the `payment_session_id` to the frontend.

> 🔴 **Critical:** `order_amount` sent to Cashfree must come from `pricing.service.js`, never from the client request body. Same trust boundary as Step 3, applied again at the payment-gateway edge — a manipulated request could otherwise tell Cashfree to charge less than the real order total.

### 3.3 Frontend checkout
- Load the Cashfree JS SDK (the sandbox vs production script URL differs, matching the env flag from §3.1).
- Initialize it with the `payment_session_id` from your backend and trigger the drop-in checkout/redirect.
- On completion, Cashfree redirects to your `return_url` with the order ID.

> 🔴 **Critical:** Treat that redirect as **UI feedback only** ("payment being processed") — never as proof of payment. A user can close the tab or the browser can lose the redirect; confirmation must come from the webhook (§3.4), not the redirect landing page.

### 3.4 Webhook handling
1. Register a webhook URL in the Cashfree dashboard, pointing at the `payment.route.js` webhook endpoint.
2. Cashfree POSTs the payment event with `x-webhook-signature` and `x-webhook-timestamp` headers.
3. Verify using Cashfree's SDK signature-verification helper — this requires the **raw, unparsed request body**, not the JSON-parsed one.

> 🔴 **Critical:** This is the single most common integration bug. The webhook route must use raw-body middleware (e.g. `express.raw()`) applied **before** any global `express.json()` touches that route, or signature verification will silently always fail. Mount the webhook route separately, ahead of wherever `app.js` applies the global JSON body parser.

4. On a verified, not-already-processed event: update `PaymentTransaction.status`, mark the `Order` `confirmed` or `payment_failed`, and on failure roll back the reserved stock from Step 4.

> 🔴 **Critical — idempotency:** Cashfree retries webhooks that don't get a timely 2xx response. Check whether this event/payment ID was already processed before applying its effects again, or a retried webhook could double-confirm an order or double-trigger a confirmation email.

### 3.5 Refunds
- Cashfree's Refunds API operates against your Cashfree order ID for full or partial refunds — wire this into `payment.service.js`, invoked from the order-cancellation flow (§9's cancellation-window logic).
- Refund status also arrives via webhook, not the refund-request response. Apply the same signature-verification and idempotency rules as §3.4 — don't treat "refund API call succeeded" as "money returned."

### 3.6 Testing
- Cashfree's Sandbox environment provides test card/UPI credentials for exercising the full loop — order create → checkout → webhook → confirmation — without moving real money. Run this end-to-end in Sandbox before flipping the environment flag to Production.

---

## 4. Coupons / Discounts

Keep this **out of scope for v1** unless there's a concrete current need — matches the "don't build it until a second real use case shows up" rule. If added later: a single `Coupon` model (`code`, `type: flat|percent`, `value`, `minOrderValue`, `expiresAt`, `usageLimit`) is enough; don't build a generic rules engine for one promotion type.

---

## 5. Emails Needed

Order confirmed, payment failed, order cancelled, refund initiated (order shipped/delivered can come later). Extend `utils/emailTemplates.js` the same way the verification/reset templates were added — same file, same pattern, not a parallel templating system.

---

## 6. Idempotency & Concurrency

- **Checkout idempotency key:** client generates a UUID per checkout attempt; if the same key arrives twice (double-click, retried request after a timeout), return the existing order instead of creating a duplicate.
- **Webhook idempotency:** dedupe by Cashfree's payment/event ID before applying effects (§3.4).
- **Stock atomicity:** covered in Step 4 — no exceptions.

> 🔴 **Critical:** These three are the most commonly skipped pieces in checkout builds, and the ones that cause real financial/inventory bugs in production. Don't defer them to "later."

---

## 7. Rate Limiting & Abuse

Rate-limit the checkout endpoint per user (reuse `middlewares/rateLimiters.js`). Auto-expire orders stuck in `pending_payment` after ~15 minutes (cron or TTL index) and release their reserved stock — otherwise abandoned checkouts slowly lock up inventory.

---

## 8. Authorization

Checkout and "my orders" endpoints: authenticated user, scoped to their own orders. Admin order management (view all, update status, refund): reuse `middlewares/requireRole.js` exactly as the admin routes already do.

---

## 9. Guest Checkout — Decide Now

Worth deciding before building, not after: does this app support guest checkout? `address.model.js` currently requires a `user` ref, so guest orders would need `Order.user` to become optional plus `guestEmail`/`guestAddress` fields, and a token-based "track my order" lookup instead of an authenticated one. Retrofitting this after the fact touches the address model, order model, and auth middleware all at once — cheaper to decide up front.

---

## 10. Commonly Forgotten Pieces

- ⚠️ Snapshotting product + address data into the Order (not referencing live docs — see §1)
- ⚠️ Releasing reserved stock on payment failure or pending-order expiry
- ⚠️ Human-readable `orderNumber` generation (for support/emails — customers won't quote a Mongo ObjectId)
- ⚠️ GST/tax rules for India given `Product.currency` defaults to `INR`
- ⚠️ Item going out of stock between "add to cart" and "checkout" — surface this clearly at Step 1, don't silently drop it
- ⚠️ Raw body for Cashfree's webhook signature verification (§3.4) — the single most common integration bug across all gateways, not just Cashfree
- ⚠️ Audit trail / log of every order and payment status change (who/what/when) — invaluable the first time a customer disputes an order

---

## 11. Implementation Rules

*Same guardrails as the auth build, applied to checkout and payments.*

- **DRY** — pricing/total calculation lives in **one** function in `pricing.service.js`, reused by order creation and any future "review cart" preview endpoint. All Cashfree calls go through `payment.service.js` — no direct SDK calls from controllers.
- **Single responsibility** — `checkout.controller.js` only orchestrates request/response; `pricing.service.js` computes money; `stock.service.js` touches inventory; `payment.service.js` wraps the Cashfree SDK. Mirrors how `product-search.service.js` is already separated from `product.controller.js`.
- **Human-readable over clever** — explicit named variables (`subtotal`, `discountAmount`, `shippingFee`, `taxAmount`, `grandTotal`), no chained one-liners for money math.
- **No over-engineering** — don't build a generic discount/shipping "rules engine" for one promotion type, and don't build an abstraction layer over "multiple payment gateways" until there's an actual second gateway to support. Design for Cashfree; don't speculatively generalize.
- **Prefer what's already available** — Mongoose transactions (built-in) for stock/order atomicity, `joi`/`express-validator` (already installed) for `checkout.validator.js`, the existing `config/mailer.js` + `nodemailer` setup for emails. Don't introduce a second library for something already covered.
- **One justified new dependency** — `cashfree-pg` is unavoidable; nothing in the current stack covers payment processing, and hand-rolling signature verification is a security risk best left to the maintained SDK. This is the one exception to "no new dependencies."
- **Match repo conventions exactly** — same file-naming pattern (`*.model.js`, `*.controller.js`, `*.route.js`, `*.validator.js`) and the same `ApiError` / `ApiResponse` / `asyncHandler` wrapper already used in every existing controller. Checkout and payment controllers should be indistinguishable in shape from `auth.controller.js` or `product.controller.js`.
- **One feature complete before the next** — cart validation + pricing before Cashfree integration; Cashfree order creation + webhook before refunds/cancellation; refunds/cancellation before coupons or guest checkout.

---

## Suggested Build Order

1. `Order` + `PaymentTransaction` models, order-number generator
2. `pricing.service.js` — server-side cart re-validation and total calculation
3. Address integration (reuse existing model, no changes needed)
4. Order creation endpoint (`pending_payment`), atomic stock decrement
5. Cashfree setup — `config/payment.js`, Sandbox credentials, `payment.service.js` wrapping order creation
6. Frontend Cashfree checkout integration, tested fully in Sandbox
7. Webhook endpoint with raw-body middleware + signature verification + idempotency
8. Order confirmation + email
9. Order status state machine + admin management endpoints
10. Cancellation flow + Cashfree refund integration + stock rollback
11. Pending-order expiry job (cron/TTL) to release reserved stock
12. Switch Cashfree environment flag to Production after full Sandbox testing
13. Optional, later: coupons, guest checkout, shipment tracking