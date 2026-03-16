-- Trezo Treasury Wallet System — PostgreSQL schema

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(58) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_wallet_keys (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_audit_log (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(58) NOT NULL,
    transaction_id VARCHAR(255),
    amount BIGINT,
    asset_id BIGINT DEFAULT 0,
    recipient_address VARCHAR(58),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_wallet_address ON companies(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_keys_company_id ON company_wallet_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON wallet_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON wallet_audit_log(created_at);
