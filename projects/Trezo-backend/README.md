# Trezo Backend

Backend services for the Trezo Algorand dApp, providing wallet management, blockchain interactions, and API services.

## 🚀 Features

- **Wallet Management**: Create and recover Algorand wallets
- **Mnemonic Validation**: Validate 25-word mnemonic phrases
- **Account Information**: Retrieve account details from blockchain
- **Security**: CORS, Helmet, input validation, and rate limiting
- **Logging**: Comprehensive logging with Winston
- **TypeScript**: Full type safety and modern development experience

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0
- Algorand node access (LocalNet, TestNet, or MainNet)

## 🛠 Installation

1. **Clone and navigate to backend directory**:

   ```bash
   cd projects/Trezo-backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up MySQL database**:

   Create a MySQL database for the application:

   ```sql
   CREATE DATABASE trezo_treasury;
   ```

5. **Initialize database schema**:

   ```bash
   npm run init-db
   ```

6. **Build the project**:
   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Base URL

```
http://localhost:3001/api/v1
```

### Wallet Endpoints

#### Create New Wallet

```http
POST /wallet/create
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "ALGORAND_ADDRESS_HERE",
    "mnemonic": "25-word mnemonic phrase here"
  }
}
```

#### Recover Wallet

```http
POST /wallet/recover
Content-Type: application/json

{
  "mnemonic": "your 25-word mnemonic phrase here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "ALGORAND_ADDRESS_HERE",
    "isValid": true
  }
}
```

#### Validate Mnemonic

```http
POST /wallet/validate
Content-Type: application/json

{
  "mnemonic": "mnemonic phrase to validate"
}
```

#### Get Account Info

```http
GET /wallet/account/{address}
```

### Health Check

```http
GET /health
```

## 🔧 Configuration

### Environment Variables

| Variable       | Description           | Default                 |
| -------------- | --------------------- | ----------------------- |
| `PORT`         | Server port           | `3001`                  |
| `NODE_ENV`     | Environment           | `development`           |
| `API_VERSION`  | API version           | `v1`                    |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `DATABASE_URL` | MySQL connection URL  | Required                |
| `DB_HOST`      | MySQL host            | `localhost`             |
| `DB_PORT`      | MySQL port            | `3306`                  |
| `DB_NAME`      | Database name         | `trezo_treasury`        |
| `DB_USER`      | Database user         | Required                |
| `DB_PASSWORD`  | Database password     | Required                |
| `ALGOD_TOKEN`  | Algorand node token   | Required                |
| `ALGOD_SERVER` | Algorand node server  | Required                |
| `ALGOD_PORT`   | Algorand node port    | Required                |
| `LOG_LEVEL`    | Logging level         | `info`                  |

## 🏗 Project Structure

```
src/
├── config/         # Database and service configurations
├── controllers/    # Request handlers
├── database/       # Database schema and migrations
├── middleware/     # Express middleware
├── repositories/   # Data access layer
├── routes/         # API route definitions
├── scripts/        # Database initialization scripts
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── server.ts       # Application entry point
```

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts

- `npm run init-db` - Initialize database schema
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 🔒 Security Features

- **CORS**: Configured for frontend integration
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Rate Limiting**: Request rate limiting
- **Logging**: Comprehensive request/error logging

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the Trezo frontend. Update your frontend to call these API endpoints instead of using local wallet creation.

Example frontend integration:

```typescript
// Replace local wallet creation with API call
const response = await fetch("http://localhost:3001/api/v1/wallet/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});
const walletData = await response.json();
```

## 📊 Monitoring

Logs are stored in the `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only

## 🚀 Deployment

1. Set production environment variables
2. Build the project: `npm run build`
3. Start the server: `npm start`

## 📄 License

MIT License - see LICENSE file for details
