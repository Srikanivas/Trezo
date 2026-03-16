# Requirements Document

## Introduction

The Smart Invoice & Payment system is a complete redesign of the existing basic invoice CRUD in the Trezo Web3 Corporate Treasury Management Platform. It transforms invoice management into a high-fidelity, GPay/PhonePe-style B2B payment workflow built on Algorand TestNet. Companies can create invoices addressed to other registered Trezo companies, attach receipt images, have an AI agent verify the bill details, require receiver approval before payment, execute on-chain ALGO/ASA payments directly from the dashboard, and optionally configure autopay rules per invoice. The system replaces the existing `invoices` table and related services entirely.

---

## Glossary

- **Invoice_System**: The complete smart invoice and payment feature described in this document
- **Sender**: The registered Trezo company that creates and issues an invoice payment request
- **Receiver**: The registered Trezo company that receives the invoice request and must approve or reject it
- **Invoice**: A structured payment request containing amount, currency, message, optional receipt image, and AI-extracted bill summary
- **Receipt_Image**: An image file (JPEG, PNG, PDF) uploaded by the Sender as evidence of a bill or purchase
- **AI_Agent**: The backend service that processes Receipt_Images using OCR/LLM to extract line items, totals, vendor names, and dates
- **Bill_Summary**: The structured JSON output produced by the AI_Agent containing extracted fields from the Receipt_Image
- **Amount_Verification**: The process by which the AI_Agent compares the Sender-declared amount against the amount extracted from the Receipt_Image
- **Autopay_Rule**: A per-invoice configuration that authorises the Invoice_System to automatically execute an Algorand transaction when an Invoice is approved
- **Treasury_Wallet**: The Algorand wallet associated with a registered company, with its private key encrypted via AWS KMS in PostgreSQL
- **ASA**: Algorand Standard Asset — a fungible token on the Algorand network
- **On-chain_Payment**: An Algorand transaction (ALGO or ASA transfer) submitted to TestNet via algosdk
- **Invoice_Status**: The lifecycle state of an Invoice — one of: `draft`, `pending_approval`, `approved`, `rejected`, `paid`, `cancelled`
- **Budget**: A company-defined spending limit for a given time period or category used to gate invoice payments
- **Notification**: An in-app alert delivered to the Receiver or Sender when an Invoice changes state

---

## Requirements

### Requirement 1: Invoice Creation with Company Search

**User Story:** As a Sender, I want to create an invoice addressed to another registered Trezo company by searching for them by name, so that I can issue structured payment requests within the platform ecosystem.

#### Acceptance Criteria

1. WHEN a Sender opens the invoice creation form, THE Invoice_System SHALL query the companies database and return matching company names as the Sender types at least 2 characters into the recipient search input.
2. WHEN the Sender selects a recipient company from the search results, THE Invoice_System SHALL populate the recipient field with that company's registered name and internal company ID.
3. THE Invoice_System SHALL prevent a Sender from selecting their own company as the invoice recipient.
4. WHEN the Sender submits an invoice with a recipient company ID that does not exist in the database, THE Invoice_System SHALL return a 404 error with the message "Recipient company not found".
5. THE Invoice_System SHALL require the following fields to be present before an invoice can be submitted: recipient company, amount, currency, and message.
6. WHEN the Sender submits an invoice with an amount less than or equal to zero, THE Invoice_System SHALL return a validation error with the message "Amount must be greater than zero".

---

### Requirement 2: Currency Selection (ALGO and ASA)

**User Story:** As a Sender, I want to select ALGO or any ASA held by my Treasury_Wallet as the invoice currency, so that I can issue invoices in the assets my company actually holds.

#### Acceptance Criteria

1. WHEN the invoice creation form loads, THE Invoice_System SHALL fetch the asset balances of the Sender's Treasury_Wallet from Algorand TestNet and display only assets with a balance greater than zero as selectable currency options.
2. THE Invoice_System SHALL always include ALGO as a selectable currency option regardless of balance.
3. WHEN the Sender selects an ASA as currency, THE Invoice_System SHALL display the ASA name, unit name, and asset ID alongside the balance.
4. WHEN the Sender selects an ASA as currency and the Receiver's Treasury_Wallet has not opted into that ASA, THE Invoice_System SHALL display a warning: "Recipient has not opted into this asset. Payment may fail."
5. WHEN the Sender submits an invoice with an ASA currency and the declared amount exceeds the Sender's current ASA balance, THE Invoice_System SHALL return a validation error with the message "Insufficient asset balance".

---

### Requirement 3: Receipt Image Upload and Storage

**User Story:** As a Sender, I want to attach a receipt or bill image to an invoice, so that the Receiver can verify the legitimacy of the payment request.

#### Acceptance Criteria

1. WHEN the Sender attaches a file to an invoice, THE Invoice_System SHALL accept files of type JPEG, PNG, and PDF with a maximum size of 10 MB.
2. IF the Sender attaches a file exceeding 10 MB, THEN THE Invoice_System SHALL reject the upload and display the error "File size must not exceed 10 MB".
3. IF the Sender attaches a file of an unsupported type, THEN THE Invoice_System SHALL reject the upload and display the error "Only JPEG, PNG, and PDF files are accepted".
4. WHEN a valid Receipt_Image is uploaded, THE Invoice_System SHALL store the file in object storage and persist a reference URL in the invoice record.
5. WHEN the Receiver views an invoice, THE Invoice_System SHALL display the Receipt_Image inline with a full-screen preview option.

---

### Requirement 4: AI Agent Bill Verification

**User Story:** As a platform operator, I want an AI agent to scan uploaded receipt images and verify the declared amount, so that false or inflated invoice quotes are detected before the Receiver approves payment.

#### Acceptance Criteria

1. WHEN an invoice with a Receipt_Image is submitted, THE AI_Agent SHALL process the image using OCR and extract: vendor name, line items with individual amounts, subtotal, tax, and total amount.
2. WHEN the AI_Agent completes extraction, THE Invoice_System SHALL store the Bill_Summary as a structured JSON field on the invoice record.
3. WHEN the AI_Agent extracts a total amount, THE Invoice_System SHALL compare it against the Sender-declared amount and record a `verification_status` of `matched`, `mismatch`, or `unverifiable`.
4. WHEN the `verification_status` is `mismatch`, THE Invoice_System SHALL display a warning to the Receiver: "AI verification detected a discrepancy between the declared amount and the scanned bill."
5. WHEN the AI_Agent cannot extract a total amount from the Receipt_Image, THE Invoice_System SHALL set `verification_status` to `unverifiable` and SHALL NOT block invoice submission.
6. WHEN no Receipt_Image is attached, THE Invoice_System SHALL set `verification_status` to `not_applicable` and SHALL NOT invoke the AI_Agent.
7. THE AI_Agent SHALL complete image processing within 30 seconds of invoice submission; IF processing exceeds 30 seconds, THEN THE Invoice_System SHALL set `verification_status` to `timeout` and proceed with invoice delivery.

---

### Requirement 5: Invoice Request Delivery and Receiver Approval Workflow

**User Story:** As a Receiver, I want to review an invoice request — including the amount, message, receipt image, and AI verification result — before approving or rejecting it, so that I can prevent fraudulent or incorrect payment requests.

#### Acceptance Criteria

1. WHEN an invoice is submitted by the Sender, THE Invoice_System SHALL set the invoice status to `pending_approval` and deliver a Notification to the Receiver's dashboard.
2. WHEN the Receiver views a `pending_approval` invoice, THE Invoice_System SHALL display: Sender company name, amount, currency, message, Receipt_Image (if present), Bill_Summary (if present), and `verification_status`.
3. WHEN the Receiver approves an invoice, THE Invoice_System SHALL set the invoice status to `approved` and deliver a Notification to the Sender.
4. WHEN the Receiver rejects an invoice, THE Invoice_System SHALL require the Receiver to provide a rejection reason of at least 10 characters, set the invoice status to `rejected`, and deliver a Notification to the Sender including the rejection reason.
5. WHEN an invoice has status `rejected`, THE Invoice_System SHALL prevent any further status transitions except `cancelled`.
6. WHILE an invoice has status `pending_approval`, THE Invoice_System SHALL allow the Sender to cancel it, setting the status to `cancelled`.
7. THE Invoice_System SHALL display all invoices — both sent and received — in a unified inbox view, filterable by status.

---

### Requirement 6: On-Chain Payment Execution

**User Story:** As a Sender, I want to pay an approved invoice directly from the dashboard via an Algorand transaction, so that payment is settled on-chain without leaving the platform.

#### Acceptance Criteria

1. WHEN an invoice has status `approved`, THE Invoice_System SHALL display a "Pay Now" action to the Sender.
2. WHEN the Sender initiates payment, THE Invoice_System SHALL construct and submit an Algorand transaction from the Sender's Treasury_Wallet to the Receiver's Treasury_Wallet for the invoice amount and currency.
3. WHEN the Algorand transaction is confirmed on TestNet, THE Invoice_System SHALL set the invoice status to `paid`, store the transaction ID, and deliver a Notification to both Sender and Receiver.
4. IF the Algorand transaction fails due to insufficient funds, THEN THE Invoice_System SHALL return the error "Insufficient balance to complete payment" and retain the invoice status as `approved`.
5. IF the Algorand transaction is rejected by the network, THEN THE Invoice_System SHALL log the error, retain the invoice status as `approved`, and display the Algorand error message to the Sender.
6. WHEN an invoice is paid, THE Invoice_System SHALL record the payment in the `wallet_audit_log` table with operation type `INVOICE_PAID`.
7. WHEN the Sender initiates payment, THE Invoice_System SHALL include the invoice ID as a note field in the Algorand transaction for traceability.

---

### Requirement 7: Autopay Configuration

**User Story:** As a Sender, I want to configure autopay on an invoice so that payment is executed automatically when the invoice is approved, without requiring manual action.

#### Acceptance Criteria

1. WHEN creating or editing an invoice, THE Invoice_System SHALL present an optional "Enable Autopay" toggle to the Sender.
2. WHEN autopay is enabled on an invoice and the invoice status transitions to `approved`, THE Invoice_System SHALL automatically execute the on-chain payment without requiring Sender interaction.
3. WHEN an autopay payment succeeds, THE Invoice_System SHALL set the invoice status to `paid` and deliver a Notification to the Sender confirming the automatic payment.
4. IF an autopay payment fails, THEN THE Invoice_System SHALL set a flag `autopay_failed` on the invoice, deliver a Notification to the Sender with the failure reason, and retain the invoice status as `approved` so the Sender can retry manually.
5. WHEN the Sender disables autopay on an invoice that has not yet been approved, THE Invoice_System SHALL update the autopay configuration and SHALL NOT trigger automatic payment on subsequent approval.

---

### Requirement 8: Budget Management

**User Story:** As a company treasurer, I want to define spending budgets by time period so that invoice payments are gated against budget limits and overspending is prevented.

#### Acceptance Criteria

1. THE Invoice_System SHALL allow a company to create a Budget with: name, currency, limit amount, and period (monthly or quarterly).
2. WHEN a Sender initiates payment on an invoice, THE Invoice_System SHALL check whether the payment amount would exceed the active Budget limit for the invoice currency in the current period.
3. WHEN a payment would exceed the active Budget limit, THE Invoice_System SHALL display a warning: "This payment will exceed your [period] budget for [currency] by [overage amount]" and require explicit confirmation before proceeding.
4. WHEN a payment is completed, THE Invoice_System SHALL update the Budget's consumed amount for the current period.
5. WHEN a Budget's consumed amount reaches 80% of the limit, THE Invoice_System SHALL deliver a Notification to the company: "You have used 80% of your [period] [currency] budget."
6. THE Invoice_System SHALL display a budget utilisation summary on the treasury dashboard showing limit, consumed, and remaining amounts per active Budget.

---

### Requirement 9: Invoice Inbox and Dashboard

**User Story:** As a company user, I want a unified invoice inbox and dashboard that shows all sent and received invoices with real-time status, so that I have full visibility of my company's payment obligations and receivables.

#### Acceptance Criteria

1. THE Invoice_System SHALL display a unified invoice inbox showing both sent invoices (as Sender) and received invoices (as Receiver) in a single list, sorted by creation date descending.
2. THE Invoice_System SHALL allow filtering the inbox by: status (`pending_approval`, `approved`, `paid`, `rejected`, `cancelled`), direction (sent / received), and currency.
3. WHEN the inbox loads, THE Invoice_System SHALL display for each invoice: counterparty company name, amount, currency, status badge, creation date, and verification status indicator.
4. THE Invoice_System SHALL display summary cards on the dashboard showing: total outstanding payables, total outstanding receivables, total paid this month, and number of invoices pending approval.
5. WHEN an invoice status changes, THE Invoice_System SHALL update the inbox view within 5 seconds without requiring a full page reload.

---

### Requirement 10: Notification System

**User Story:** As a company user, I want to receive in-app notifications when invoice states change, so that I can act promptly on approvals, rejections, and payment confirmations.

#### Acceptance Criteria

1. THE Invoice_System SHALL deliver an in-app Notification to the Receiver when a new invoice is addressed to their company.
2. THE Invoice_System SHALL deliver an in-app Notification to the Sender when their invoice is approved, rejected, or paid.
3. WHEN a Notification is delivered, THE Invoice_System SHALL display an unread count badge on the notifications icon in the navigation bar.
4. WHEN a user reads a Notification, THE Invoice_System SHALL mark it as read and decrement the unread count.
5. THE Invoice_System SHALL persist Notifications in the database and display the last 50 Notifications per company, ordered by creation date descending.

---

### Requirement 11: Invoice Data Integrity and Round-Trip Serialisation

**User Story:** As a platform operator, I want invoice data to be consistently serialised and deserialised between the API and database, so that no data is lost or corrupted across the invoice lifecycle.

#### Acceptance Criteria

1. THE Invoice_System SHALL serialise all invoice records to JSON for API responses and deserialise incoming JSON request bodies into validated invoice objects.
2. FOR ALL valid Invoice objects, serialising then deserialising SHALL produce an equivalent Invoice object (round-trip property).
3. THE Invoice_System SHALL serialise numeric amounts as strings in API responses to preserve precision for large ALGO microAlgo values.
4. WHEN an invoice record is retrieved from the database, THE Invoice_System SHALL validate that all required fields are present; IF any required field is missing, THEN THE Invoice_System SHALL log the anomaly and return a 500 error.

---

### Requirement 12: Security and Access Control

**User Story:** As a platform operator, I want all invoice operations to be scoped to the authenticated company, so that companies cannot view or act on invoices belonging to other companies.

#### Acceptance Criteria

1. WHEN any invoice API endpoint is called, THE Invoice_System SHALL verify the JWT token and extract the authenticated company ID before processing the request.
2. WHEN a company requests an invoice by ID, THE Invoice_System SHALL verify that the requesting company is either the Sender or the Receiver of that invoice; IF neither, THEN THE Invoice_System SHALL return a 403 error.
3. WHEN a Sender attempts to approve or reject an invoice they created, THE Invoice_System SHALL return a 403 error with the message "Only the recipient can approve or reject an invoice".
4. WHEN a Receiver attempts to initiate payment on an invoice, THE Invoice_System SHALL return a 403 error with the message "Only the sender can pay an invoice".
5. THE Invoice_System SHALL rate-limit invoice creation to 20 invoices per company per minute; IF the limit is exceeded, THEN THE Invoice_System SHALL return a 429 error.
