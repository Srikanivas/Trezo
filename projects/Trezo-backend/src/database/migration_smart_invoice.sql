-- Smart Invoice & Payment System Migration
-- Drops old invoices table and creates new schema

-- Drop old invoices table
DROP TABLE IF EXISTS invoices CASCADE;

-- Receipt images stored separately (base64 in DB for TestNet simplicity)
CREATE TABLE IF NOT EXISTS receipt_images (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    size_bytes INT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_receipt_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- New invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    sender_company_id INT NOT NULL,
    receiver_company_id INT NOT NULL,
    amount NUMERIC(30, 6) NOT NULL,
    currency VARCHAR(20) NOT NULL DEFAULT 'ALGO',
    asset_id BIGINT,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','pending_approval','approved','rejected','paid','cancelled')),
    autopay_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    autopay_failed BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason TEXT,
    transaction_id VARCHAR(255),
    receipt_image_id INT,
    bill_summary JSONB,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'not_applicable'
        CHECK (verification_status IN ('not_applicable','matched','mismatch','unverifiable','timeout','pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_sender FOREIGN KEY (sender_company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_receiver FOREIGN KEY (receiver_company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt FOREIGN KEY (receipt_image_id) REFERENCES receipt_images(id) ON DELETE SET NULL,
    CONSTRAINT chk_different_companies CHECK (sender_company_id <> receiver_company_id),
    CONSTRAINT chk_positive_amount CHECK (amount > 0)
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(20) NOT NULL,
    asset_id BIGINT,
    limit_amount NUMERIC(30, 6) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly')),
    consumed_amount NUMERIC(30, 6) NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_budget_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    invoice_id INT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_notif_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_sender ON invoices(sender_company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_receiver ON invoices(receiver_company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(company_id, is_read) WHERE is_read = FALSE;
