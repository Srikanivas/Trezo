-- Phase 3 & 4 Migration: Payments table
-- Run after migration_smart_invoice.sql

CREATE TABLE IF NOT EXISTS payments (
  id               SERIAL PRIMARY KEY,
  company_id       INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receiver_address TEXT    NOT NULL,
  amount           NUMERIC(20, 6) NOT NULL,
  asset_type       TEXT    NOT NULL DEFAULT 'ALGO',
  asset_id         INTEGER,
  description      TEXT,
  transaction_hash TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(company_id, status);
