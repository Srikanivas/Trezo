# Implementation Plan: Smart Invoice & Payment System

## Overview

Incremental implementation of the Smart Invoice & Payment system on top of the existing Trezo backend and frontend. Each task builds on the previous, starting with the database foundation and ending with frontend integration and property-based tests. The existing `invoices` table and related files are fully replaced.

## Tasks

- [ ] 1. Database migration — SQL schema and migration runner
  - [ ] 1.1 Create `src/database/migration_smart_invoice.sql`
    - Drop old `invoices` table with CASCADE
    - Create `receipt_images` table (id, company_id, filename, mime_type, size_bytes, data TEXT base64, created_at)
    - Create new `invoices` table with all columns, CHECK constraints (`chk_different_companies`, `chk_positive_amount`), and FK references
    - Create `budgets` table (id, company_id, name, currency, asset_id, limit_amount, period, consumed_amount, period_start, is_active)
    - Create `notifications` table (id, company_id, type, title, body, invoice_id, is_read, created_at)
    - Add all indexes (sender, receiver, status, created_at DESC, budgets company, notifications company, partial index on unread)
    - _Requirements: 1.1, 3.4, 4.2, 8.1, 10.5_
  - [ ] 1.2 Create `src/scripts/migrateSmartInvoice.ts`
    - Read and execute the SQL file against the Neon PostgreSQL connection
    - Log success/failure and exit with appropriate code
    - _Requirements: 11.1_

- [ ] 2. Install new dependencies
  - Add `multer` and `@types/multer` to backend (`npm install multer @types/multer`)
  - Add `fast-check` as a dev dependency to backend (`npm install --save-dev fast-check`)
  - _Requirements: 3.1, 12.5_

- [ ] 3. New repositories — budget and notification
  - [ ] 3.1 Create `src/repositories/budgetRepository.ts`
    - `create(data)` — insert budget row, return Budget
    - `findByCompany(companyId)` — list all budgets for company
    - `findById(id, companyId)` — get single budget (scoped to company)
    - `update(id, companyId, data)` — update budget fields
    - `delete(id, companyId)` — delete budget
    - `findActiveForCurrency(companyId, currency, assetId)` — find active budget matching currency/asset for budget check
    - `updateConsumed(id, newConsumed, newPeriodStart?)` — update consumed_amount and optionally period_start (lazy reset)
    - _Requirements: 8.1, 8.4_
  - [ ] 3.2 Create `src/repositories/notificationRepository.ts`
    - `create(data)` — insert notification row
    - `findByCompany(companyId, limit)` — last N notifications ordered by created_at DESC
    - `markRead(id, companyId)` — set is_read=true for single notification
    - `markAllRead(companyId)` — set is_read=true for all company notifications
    - `countUnread(companyId)` — return unread count
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 4. Replace `invoiceRepository.ts` (full replacement for new schema)
  - Rewrite `src/repositories/invoiceRepository.ts` against the new schema
  - `create(data)` — insert invoice, return InvoiceWithParties (JOIN companies for names)
  - `findById(id)` — get invoice with sender/receiver company names
  - `findInbox(companyId, filters)` — unified inbox query (sender OR receiver), support status/direction/currency filters, paginated, sorted by created_at DESC
  - `updateStatus(id, status, extra?)` — update status + optional fields (rejection_reason, transaction_id)
  - `markPaid(id, txId)` — set status=paid, transaction_id
  - `setAutopayFailed(id, reason)` — set autopay_failed=true
  - `getSummary(companyId)` — aggregate query for total_payables, total_receivables, paid_this_month, pending_approval_count
  - _Requirements: 1.1, 5.1, 5.7, 6.3, 9.1, 9.2, 11.1, 11.4_

- [ ] 5. OCR service — IOCRService interface and MockOCRService
  - Create `src/services/ocrService.ts`
  - Define `IOCRService` interface with `extractBillData(buffer: Buffer, mimeType: string, filename: string): Promise<BillSummary>`
  - Define `BillSummary` interface (vendorName, lineItems, subtotal, tax, total, extractedAt)
  - Implement `MockOCRService` with regex-based extraction from filename patterns (e.g. `vendor-acme`, `total-150.50`, `tax-12.50`)
  - Always return a complete BillSummary object; use null for unextractable fields
  - Export singleton `ocrService: IOCRService = new MockOCRService()`
  - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [ ] 6. NotificationService
  - Create `src/services/notificationService.ts`
  - Implement `deliver(companyId, type, payload)` — build title/body from type+payload, insert via notificationRepository
  - Support all notification types: `INVOICE_RECEIVED`, `INVOICE_APPROVED`, `INVOICE_REJECTED`, `INVOICE_PAID`, `AUTOPAY_SUCCESS`, `AUTOPAY_FAILED`, `BUDGET_80_PERCENT`
  - _Requirements: 5.1, 5.3, 5.4, 6.3, 7.3, 7.4, 8.5, 10.1, 10.2_

- [ ] 7. BudgetService
  - Create `src/services/budgetService.ts`
  - `createBudget(companyId, data)` — validate and create via budgetRepository
  - `listBudgets(companyId)` — list with current utilisation
  - `getBudget(id, companyId)` — get single budget
  - `updateBudget(id, companyId, data)` — update
  - `deleteBudget(id, companyId)` — delete
  - `checkBudget(companyId, amount, currency, assetId?)` — find active budget, compute if payment would exceed limit, return `BudgetCheckResult { budgetId, exceeded, currentConsumed, limit, overage }`
  - `recordPayment(companyId, amount, currency, assetId?)` — update consumed_amount (with lazy period reset), check 80% threshold and notify via NotificationService
  - Implement `getPeriodStart(period)` helper for lazy reset logic
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 8. AutopayEngine
  - Create `src/services/autopayEngine.ts`
  - Implement `AutopayEngine.onInvoiceApproved(invoiceId)` as a static async method
  - Fetch invoice; return early if `autopay_enabled` is false
  - Call `TreasuryService.sendTransaction()` with sender companyId, receiver wallet address, amount, assetId, note=`TREZO_INVOICE_${invoiceId}`
  - On success: call `InvoiceRepository.markPaid()`, `BudgetService.recordPayment()`, deliver `AUTOPAY_SUCCESS` and `INVOICE_PAID` notifications
  - On failure: call `InvoiceRepository.setAutopayFailed()`, deliver `AUTOPAY_FAILED` notification; do not rethrow (approval must still succeed)
  - _Requirements: 7.2, 7.3, 7.4, 6.6, 6.7_

- [ ] 9. Replace `invoiceService.ts` (full replacement)
  - Rewrite `src/services/invoiceService.ts` using new repositories, OCR service, AutopayEngine, and NotificationService
  - `createInvoice(senderCompanyId, data, file?)`:
    - Validate required fields (400 if missing), amount > 0 (400), receiver exists (404), sender ≠ receiver (400)
    - If file: insert receipt_images row (base64), set receipt_image_id
    - Insert invoice with status `pending_approval`
    - If file: run OCR with 30s timeout via `Promise.race`; update bill_summary and verification_status
    - Deliver `INVOICE_RECEIVED` notification to receiver
    - Return InvoiceWithParties
  - `getInbox(companyId, filters)` — delegate to repository
  - `getInvoice(id, companyId)` — fetch and verify access (403 if neither sender nor receiver)
  - `approveInvoice(id, companyId)` — verify receiver role (403), update status to `approved`, notify sender, call `AutopayEngine.onInvoiceApproved()`
  - `rejectInvoice(id, companyId, reason)` — verify receiver role (403), validate reason length ≥ 10 (400), update status to `rejected`, notify sender
  - `cancelInvoice(id, companyId)` — verify sender role and status `pending_approval`, update to `cancelled`
  - `payInvoice(id, companyId, confirmed?)` — verify sender role (403), status `approved` (400); check budget; if exceeded and not confirmed return `{ requiresConfirmation: true, overage }`; call TreasuryService, mark paid, audit log, notify both parties, record payment in budget
  - `getSummary(companyId)` — delegate to repository
  - `getReceipt(id, companyId)` — verify access, return base64 data + mimeType from receipt_images
  - _Requirements: 1.1–1.6, 3.1–3.5, 4.1–4.7, 5.1–5.7, 6.1–6.7, 7.1–7.5, 8.2–8.4, 11.1–11.4, 12.1–12.5_

- [ ] 10. New controllers — budget and notification
  - [ ] 10.1 Create `src/controllers/budgetController.ts`
    - `createBudget` — POST /api/v1/budgets
    - `listBudgets` — GET /api/v1/budgets
    - `getBudget` — GET /api/v1/budgets/:id
    - `updateBudget` — PUT /api/v1/budgets/:id
    - `deleteBudget` — DELETE /api/v1/budgets/:id
    - All handlers extract `companyId` from `req.user`, delegate to BudgetService, return standard `{ success, data }` shape
    - _Requirements: 8.1, 8.6_
  - [ ] 10.2 Create `src/controllers/notificationController.ts`
    - `listNotifications` — GET /api/v1/notifications
    - `getUnreadCount` — GET /api/v1/notifications/unread-count
    - `markRead` — POST /api/v1/notifications/:id/read
    - `markAllRead` — POST /api/v1/notifications/read-all
    - All handlers extract `companyId` from `req.user`, delegate to notificationRepository
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 11. Replace `invoiceController.ts` (full replacement)
  - Rewrite `src/controllers/invoiceController.ts` with handlers for all invoice endpoints
  - `createInvoice` — POST /api/v1/invoices (receives `req.file` from multer)
  - `getInbox` — GET /api/v1/invoices/inbox (parse query filters)
  - `getSummary` — GET /api/v1/invoices/summary
  - `getInvoice` — GET /api/v1/invoices/:id
  - `getReceipt` — GET /api/v1/invoices/:id/receipt (set Content-Type header, send base64 decoded buffer)
  - `approveInvoice` — POST /api/v1/invoices/:id/approve
  - `rejectInvoice` — POST /api/v1/invoices/:id/reject
  - `cancelInvoice` — POST /api/v1/invoices/:id/cancel
  - `payInvoice` — POST /api/v1/invoices/:id/pay
  - All handlers extract `companyId` from `req.user`, delegate to InvoiceService, use consistent error handling
  - _Requirements: 5.2, 5.4, 6.1, 9.3, 9.4, 12.1–12.5_

- [ ] 12. Add company search to CompanyController and companyRoutes
  - Add `searchCompanies` handler to existing `src/controllers/companyController.ts`
    - Read `q` query param; return 400 if fewer than 2 characters
    - Query companies by name (case-insensitive ILIKE), exclude requesting company
    - Return `[{ id, company_name, wallet_address }]`
  - Register `GET /search` route in existing `src/routes/companyRoutes.ts`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 13. Upload middleware and rate-limit middleware
  - [ ] 13.1 Create `src/middleware/upload.ts`
    - Configure multer with `memoryStorage`, 10 MB `fileSize` limit, and `fileFilter` for JPEG/PNG/PDF
    - Export `uploadReceipt` middleware (single file field `receipt`)
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 13.2 Create `src/middleware/invoiceRateLimit.ts`
    - In-memory sliding window counter keyed by `companyId`
    - Allow 20 requests per 60-second window
    - Return 429 with `"Rate limit exceeded: 20 invoices per minute"` when exceeded
    - _Requirements: 12.5_

- [ ] 14. Replace `invoiceRoutes.ts` (full replacement)
  - Rewrite `src/routes/invoiceRoutes.ts` wiring all invoice controller handlers
  - Apply `authenticateToken` to all routes
  - Apply `uploadReceipt` multer middleware only on `POST /`
  - Apply `invoiceRateLimit` middleware only on `POST /`
  - Register routes: POST `/`, GET `/inbox`, GET `/summary`, GET `/:id`, GET `/:id/receipt`, POST `/:id/approve`, POST `/:id/reject`, POST `/:id/cancel`, POST `/:id/pay`
  - Note: `/inbox` and `/summary` must be registered before `/:id` to avoid route shadowing
  - _Requirements: 1.1, 5.1, 6.1, 9.1, 12.1_

- [ ] 15. New route files — budget and notification routes
  - [ ] 15.1 Create `src/routes/budgetRoutes.ts`
    - Apply `authenticateToken`, wire all BudgetController handlers
    - _Requirements: 8.1, 8.6_
  - [ ] 15.2 Create `src/routes/notificationRoutes.ts`
    - Apply `authenticateToken`, wire all NotificationController handlers
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 16. Update `routes/index.ts` — register all new routes
  - Add `import` statements for budgetRoutes and notificationRoutes
  - Mount `/api/v1/budgets` → budgetRoutes
  - Mount `/api/v1/notifications` → notificationRoutes
  - Verify `/api/v1/companies` already mounted (add search route registration if needed)
  - _Requirements: 8.1, 10.1, 1.1_

- [ ] 17. Frontend — extend `src/services/api.ts`
  - Add TypeScript interfaces: `Invoice`, `InvoiceWithParties`, `Budget`, `Notification`, `BillSummary`, `InvoiceSummary`, `BudgetCheckResult`, `CompanySearchResult`
  - Add API functions:
    - `createInvoice(formData: FormData)` — POST multipart
    - `getInvoiceInbox(filters?)` — GET with query params
    - `getInvoiceSummary()` — GET summary cards
    - `getInvoice(id)` — GET single
    - `approveInvoice(id)`, `rejectInvoice(id, reason)`, `cancelInvoice(id)`, `payInvoice(id, confirmed?)`
    - `searchCompanies(q)` — GET company search
    - `createBudget(data)`, `listBudgets()`, `getBudget(id)`, `updateBudget(id, data)`, `deleteBudget(id)`
    - `listNotifications()`, `getUnreadCount()`, `markNotificationRead(id)`, `markAllNotificationsRead()`
  - Serialise amounts as strings in request bodies; accept strings in responses
  - _Requirements: 11.3, 9.5_

- [ ] 18. Frontend — invoice components
  - [ ] 18.1 Create `src/components/invoices/CompanySearchInput.tsx`
    - Debounced input (300ms), calls `searchCompanies(q)` when q ≥ 2 chars
    - Renders dropdown with results; calls `onSelect(company)` callback
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 18.2 Create `src/components/invoices/CurrencySelector.tsx`
    - Fetches wallet asset balances, always includes ALGO
    - Displays ASA name, unit name, asset ID, and balance
    - Shows opt-in warning when receiver has not opted into selected ASA
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 18.3 Create `src/components/invoices/ReceiptUpload.tsx`
    - Drag-and-drop zone accepting JPEG/PNG/PDF up to 10 MB
    - Shows file preview (image thumbnail or PDF icon) after selection
    - Displays client-side validation errors for type/size
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [ ] 18.4 Create `src/components/invoices/CreateInvoiceModal.tsx`
    - Multi-step form: (1) recipient search via CompanySearchInput, (2) amount + CurrencySelector + message + autopay toggle, (3) ReceiptUpload (optional)
    - Submits as `FormData` via `createInvoice()`
    - _Requirements: 1.1–1.6, 2.1–2.5, 3.1–3.3, 7.1_
  - [ ] 18.5 Create `src/components/invoices/BudgetWarningModal.tsx`
    - Displays overage warning message with period, currency, and overage amount
    - "Confirm" and "Cancel" buttons; calls `onConfirm()` / `onCancel()` callbacks
    - _Requirements: 8.3_
  - [ ] 18.6 Create `src/components/invoices/InvoiceCard.tsx`
    - Renders single invoice row: counterparty name, amount + currency, status badge (colour-coded), creation date, verification status indicator
    - Clickable to open InvoiceDetailModal
    - _Requirements: 9.3_
  - [ ] 18.7 Create `src/components/invoices/InvoiceDetailModal.tsx`
    - Full invoice view: all InvoiceCard fields plus message, receipt image inline preview, AI bill summary, verification status with mismatch warning
    - Action buttons conditional on role and status: Approve / Reject (receiver, pending_approval), Pay Now (sender, approved), Cancel (sender, pending_approval)
    - Reject action requires reason input (min 10 chars)
    - Pay Now triggers budget check; shows BudgetWarningModal if exceeded
    - _Requirements: 4.4, 5.2, 5.3, 5.4, 5.6, 6.1, 6.4, 6.5, 8.3_
  - [ ] 18.8 Create `src/components/invoices/BudgetPanel.tsx`
    - List budgets with utilisation progress bars (consumed / limit, highlight at 80%)
    - Create / edit / delete budget forms inline
    - _Requirements: 8.1, 8.6_
  - [ ] 18.9 Create `src/components/invoices/InvoiceInbox.tsx`
    - Filter bar: status, direction (sent/received), currency
    - Renders list of InvoiceCard components
    - Polls `getInvoiceInbox()` every 10 seconds via `setInterval`
    - _Requirements: 5.7, 9.1, 9.2, 9.5_
  - [ ] 18.10 Create `src/components/invoices/InvoicePage.tsx`
    - Top-level page with tab navigation: "Inbox" (InvoiceInbox) and "Budgets" (BudgetPanel)
    - "New Invoice" button opens CreateInvoiceModal
    - _Requirements: 9.1_

- [ ] 19. Frontend — NotificationBell component
  - Create `src/components/invoices/NotificationBell.tsx`
  - Polls `getUnreadCount()` every 10 seconds; shows badge with count when > 0
  - On click: fetches and displays last 50 notifications in a dropdown
  - Clicking a notification calls `markNotificationRead(id)` and decrements badge
  - "Mark all read" button calls `markAllNotificationsRead()`
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 20. Frontend — update TreasuryDashboard with invoice summary cards and navigation
  - Add invoice summary cards to `src/components/dashboard/TreasuryDashboard.tsx`:
    - Total outstanding payables, total outstanding receivables, total paid this month, invoices pending approval
    - Fetch from `getInvoiceSummary()` on mount
  - Add navigation link / button to InvoicePage from the dashboard
  - Mount `NotificationBell` in the navigation bar
  - _Requirements: 9.4_

- [ ] 21. Property-based tests with fast-check
  - Create `src/tests/invoiceProperties.test.ts`
  - [ ] 21.1 Property 1 — Company search excludes self
    - For any companyId, mock the repository to return companies including the requester; assert the requester is never in the result
    - **Property 1: Company search excludes self**
    - **Validates: Requirements 1.3**
  - [ ] 21.2 Property 2 — Invoice creation rejects non-positive amounts
    - Generate arbitrary amounts ≤ 0 (negative, zero, very small negatives); assert createInvoice throws 400 and no DB insert occurs
    - **Property 2: Invoice creation rejects non-positive amounts**
    - **Validates: Requirements 1.6**
  - [ ] 21.3 Property 3 — Invoice creation rejects missing required fields
    - Generate all subsets of `{receiver_company_id, amount, currency, message}` with at least one missing; assert 400 error
    - **Property 3: Invoice creation rejects missing required fields**
    - **Validates: Requirements 1.5**
  - [ ] 21.4 Property 4 — Currency options always include ALGO
    - Generate arbitrary wallet asset lists (including empty); assert ALGO always present in returned options and only assets with balance > 0 are included
    - **Property 4: Currency options always include ALGO and only positive-balance assets**
    - **Validates: Requirements 2.1, 2.2**
  - [ ] 21.5 Property 6 — File upload validation rejects invalid files
    - Generate files with invalid MIME types or sizes > 10 MB; assert multer fileFilter rejects them with 400 and no receipt_images row is created
    - **Property 6: File upload validation rejects invalid files**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ] 21.6 Property 8 — AI agent output schema completeness
    - Generate arbitrary buffers, MIME types, and filenames; assert MockOCRService always returns an object with all required BillSummary fields present (values may be null)
    - **Property 8: AI agent output schema completeness**
    - **Validates: Requirements 4.1**
  - [ ] 21.7 Property 9 — Verification status is deterministic
    - Generate arbitrary (declared, extracted) pairs; assert `computeVerificationStatus` returns `matched` within 1% tolerance, `mismatch` outside, `unverifiable` when extracted is null; same inputs always produce same output
    - **Property 9: Verification status is deterministic**
    - **Validates: Requirements 4.3**
  - [ ] 21.8 Property 11 — Invoice serialisation round-trip
    - Generate arbitrary valid Invoice objects; serialise to JSON and deserialise; assert all fields are equivalent and amounts remain as strings
    - **Property 11: Invoice serialisation round-trip**
    - **Validates: Requirements 11.2, 11.3**
  - [ ] 21.9 Property (Req 8) — Budget check returns correct overage
    - Generate arbitrary (consumed, limit, paymentAmount) triples; assert `checkBudget` returns `exceeded=true` iff `consumed + payment > limit`, and `overage` equals the correct difference
    - **Property: Budget check returns correct overage**
    - **Validates: Requirements 8.2, 8.3**
  - [ ] 21.10 Property (Req 10) — Notification delivery is idempotent per event
    - For any notification type and payload, calling `deliver()` multiple times with the same arguments should create distinct notification rows (delivery is not deduplicated), but `markAllRead` should set all to read regardless of count
    - **Property: Notification delivery idempotency**
    - **Validates: Requirements 10.1, 10.2**

- [ ] 22. Final checkpoint — ensure all tests pass
  - Run `npx jest --testPathPattern=invoiceProperties` (or equivalent) to confirm all property tests pass
  - Ensure all TypeScript files compile without errors (`tsc --noEmit`)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (none in this plan — all property tests are required per spec)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` and validate universal correctness properties
- The existing `TreasuryService.sendTransaction()` is reused as-is for all on-chain payments
- Run the migration script (`ts-node src/scripts/migrateSmartInvoice.ts`) before starting backend tasks
