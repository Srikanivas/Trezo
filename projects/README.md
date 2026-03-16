# Trezo Treasury Wallet System

A secure custodial treasury wallet system for companies using Algorand TestNet, AWS KMS, and a web dashboard.

## Architecture Overview

### Backend (Node.js + Express)

- **Database**: PostgreSQL for storing company data and encrypted private keys
- **Security**: AWS KMS for private key encryption/decryption
- **Blockchain**: Algorand TestNet integration using algosdk
- **Authentication**: JWT-based authentication system

### Frontend (React + TypeScript)

- **Dashboard**: Company treasury management interface
- **Authentication**: Login/registration forms
- **Wallet Operations**: Balance viewing, transaction sending, history tracking

### Security Features

- Private keys are **NEVER** stored in plain text
- All private keys encrypted using AWS KMS before database storage
- JWT authentication for API access
- Comprehensive audit logging for all operations
- TestNet environment for safe testing

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **AWS Account** with KMS access
4. **Git**

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend setup
cd projects/Trezo-backend
npm install

# Frontend setup
cd ../Trezo-frontend
npm install
```

### 2. Database Setup

Create a PostgreSQL database and update the connection details in the backend `.env` file:

```bash
# Create database
createdb trezo_treasury

# Initialize schema
cd projects/Trezo-backend
npm run init-db
```

### 3. AWS KMS Setup

1. Create an AWS KMS key for encryption
2. Note the key ID or alias
3. Create IAM user with KMS permissions:
   - `kms:Encrypt`
   - `kms:Decrypt`
   - `kms:GenerateDataKey`

### 4. Environment Configuration

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/trezo_treasury
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trezo_treasury
DB_USER=username
DB_PASSWORD=password

# Security
JWT_SECRET=your-super-secret-jwt-key-here

# AWS KMS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
KMS_KEY_ID=alias/your-kms-key-alias

# Algorand TestNet (already configured)
ALGOD_SERVER=https://testnet-api.algonode.cloud
INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

#### Frontend (.env)

```env
# Backend API
VITE_BACKEND_URL=http://localhost:3001/api/v1

# Algorand TestNet (already configured)
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

### 5. Start the Applications

```bash
# Start backend (Terminal 1)
cd projects/Trezo-backend
npm run dev

# Start frontend (Terminal 2)
cd projects/Trezo-frontend
npm run dev
```

The applications will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## API Endpoints

### Company Management

- `POST /api/v1/company/register` - Register new company with treasury wallet
- `POST /api/v1/company/login` - Company login
- `GET /api/v1/company/profile` - Get company profile

### Treasury Operations

- `GET /api/v1/treasury/balance/:companyId` - Get wallet balance and assets
- `GET /api/v1/treasury/transactions/:companyId` - Get transaction history
- `POST /api/v1/treasury/send` - Send payment from treasury
- `GET /api/v1/treasury/audit/:companyId` - Get audit log

## Features

### Company Registration

- Automatic Algorand TestNet wallet creation
- Private key encryption using AWS KMS
- Secure password hashing
- Automatic TestNet funding (when available)

### Treasury Dashboard

- Real-time ALGO balance display
- Algorand Standard Asset (ASA) holdings
- Transaction history with explorer links
- Send payments (ALGO and ASAs)
- Comprehensive audit logging

### Security Features

- AWS KMS encryption for all private keys
- JWT authentication
- Input validation and sanitization
- Rate limiting
- Comprehensive error handling
- Audit trail for all operations

## Database Schema

### Companies Table

```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(58) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Encrypted Keys Table

```sql
CREATE TABLE company_wallet_keys (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);
```

### Audit Log Table

```sql
CREATE TABLE wallet_audit_log (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(58) NOT NULL,
    transaction_id VARCHAR(255),
    amount BIGINT,
    asset_id BIGINT DEFAULT 0,
    recipient_address VARCHAR(58),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Backend Testing

```bash
cd projects/Trezo-backend
npm test
```

### Frontend Testing

```bash
cd projects/Trezo-frontend
npm test
```

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Use production database
3. Configure proper AWS IAM roles
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to CDN or static hosting
3. Update `VITE_BACKEND_URL` to production API

## Security Considerations

1. **Private Key Security**: Never store private keys in plain text
2. **AWS KMS**: Use IAM roles with minimal required permissions
3. **Database**: Use connection pooling and prepared statements
4. **API**: Implement rate limiting and input validation
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit sensitive data to version control

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check connection string in `.env`
   - Ensure database exists

2. **AWS KMS Error**
   - Verify AWS credentials
   - Check KMS key permissions
   - Ensure correct region

3. **Algorand Connection Error**
   - TestNet endpoints should work without tokens
   - Check network connectivity

### Logs

- Backend logs: `projects/Trezo-backend/logs/`
- Check console for frontend errors

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs
3. Verify environment configuration
4. Test with minimal setup

## License

MIT License - see LICENSE file for details.
