# Trezo — Treasury Wallet System

Trezo is a **secure custodial treasury wallet system** for companies on **Algorand**. It combines:

- a **backend API** for authentication, treasury operations, audit logging, and secure key handling
- a **web dashboard** for treasury visibility and actions
- an optional **smart contracts** workspace (AlgoKit) for on-chain app logic and generated clients

This repository is organized as a **monorepo** under `projects/`.

## What’s in this repo

- **`projects/Trezo-backend/`**: Node.js + TypeScript + Express API (Algorand + KMS + DB)
- **`projects/Trezo-frontend/`**: React + TypeScript dashboard (Vite, Tailwind, charts)
- **`projects/Trezo-contracts/`**: AlgoKit smart contracts workspace (Python/Poetry)
- **`projects/README.md`**: deeper system documentation (end-to-end setup & security notes)

## Architecture (high level)

### Backend (API + services)

- **Auth**: JWT-based authentication
- **Key security**: private keys are **encrypted with AWS KMS** before storage
- **Blockchain**: Algorand integration via `algosdk` (commonly TestNet during development)
- **Persistence**: database-backed company + treasury data (PostgreSQL client is used in code)
- **Auditability**: structured audit log of treasury operations

### Frontend (dashboard)

- **Treasury dashboard**: balances, assets, transactions, payments, invoices
- **Wallet integrations**: supports Algorand wallet connectors via `use-wallet` (where applicable)
- **API integration**: talks to backend via `VITE_BACKEND_URL`

### Smart contracts (optional)

If you are building/using on-chain apps, `projects/Trezo-contracts` provides the AlgoKit workflow
and the frontend can generate typed clients into `projects/Trezo-frontend/src/contracts`.

## Quickstart (local development)

### Prerequisites

- **Node.js**: 20.x recommended (repo uses modern Vite + TS)
- **npm**: 9+
- **PostgreSQL**: running locally (or a managed instance)
- **AWS credentials** with KMS access (for encryption/decryption)

### Install dependencies

From the repo root:

```bash
cd projects/Trezo-backend
npm install

cd ../Trezo-frontend
npm install
```

Or run the helper scripts from `projects/`:

- Windows: `projects/setup-trezo-treasury.bat`
- macOS/Linux: `projects/setup-trezo-treasury.sh`

### Configure environment variables

Create `.env` files based on your environment. Common variables:

#### Backend (`projects/Trezo-backend/.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Auth
JWT_SECRET=change-me

# Database (example)
DATABASE_URL=postgresql://username:password@localhost:5432/trezo_treasury

# AWS KMS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
KMS_KEY_ID=alias/your-kms-key-alias

# Algorand (example)
ALGOD_SERVER=https://testnet-api.algonode.cloud
INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

#### Frontend (`projects/Trezo-frontend/.env`)

```env
VITE_BACKEND_URL=http://localhost:3001/api/v1
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

### Initialize the database (backend)

```bash
cd projects/Trezo-backend
npm run init-db
```

### Run the apps

```bash
# Terminal 1
cd projects/Trezo-backend
npm run dev

# Terminal 2
cd projects/Trezo-frontend
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001/api/v1`

## API overview (backend)

Base URL:

```text
http://localhost:3001/api/v1
```

Common endpoint groups (high level):

### Company / Auth

- `POST /company/register` — register a company (and provision treasury wallet)
- `POST /company/login` — login, receive JWT
- `GET /company/profile` — get company profile (auth required)

### Treasury

- `GET /treasury/balance/:companyId` — current balance + assets
- `GET /treasury/transactions/:companyId` — transaction history
- `POST /treasury/send` — send ALGO / ASA payments
- `GET /treasury/audit/:companyId` — audit log

Health:

- `GET /health`

For request/response details and implementation specifics, see `projects/Trezo-backend/README.md`.

## Services (backend) — what they do

You’ll commonly see these backend responsibilities reflected as “services”:

- **KMS service**: encrypt/decrypt private key material using AWS KMS
- **Wallet service**: create/recover Algorand accounts, build/sign transactions
- **Treasury service**: business rules for sending payments, summarizing balances, assets
- **Audit/logging**: record operations (who/what/when), plus structured application logs

## Security model (important)

- **Private keys are never stored in plaintext**.
- Encryption keys stay in **AWS KMS**; the DB stores only encrypted blobs.
- Backend APIs should be protected with **JWT** and deployed behind **HTTPS** in production.

## Smart contracts workflow (optional)

If you are using contracts:

- Smart contracts live in `projects/Trezo-contracts/`
- The frontend can generate typed app clients via:

```bash
cd projects/Trezo-frontend
npm run dev
```

That dev script runs `algokit project link --all` before starting Vite, linking any generated artifacts.

## Repo documentation map

- **System-level**: `projects/README.md`
- **Backend**: `projects/Trezo-backend/README.md`
- **Frontend**: `projects/Trezo-frontend/README.md`
- **Frontend contracts integration**: `projects/Trezo-frontend/src/contracts/README.md`
- **Contracts**: `projects/Trezo-contracts/README.md`

## Common scripts

### Backend (`projects/Trezo-backend`)

- `npm run dev` — run API with hot reload
- `npm run build` — TypeScript build
- `npm start` — run built server
- `npm run init-db` — initialize schema
- `npm run lint` / `npm test` — quality gates

### Frontend (`projects/Trezo-frontend`)

- `npm run dev` — generate/link clients + start Vite dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview build locally

## Troubleshooting

- **DB connection errors**: ensure DB is running and `DATABASE_URL` is correct.
- **KMS errors**: check AWS credentials, region, and `KMS_KEY_ID` permissions.
- **Algorand RPC errors**: verify network endpoints and outbound connectivity.

## License

MIT (see the project license file, if present).
