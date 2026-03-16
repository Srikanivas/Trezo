import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { logger } from "./utils/logger";
import { corsOptions, securityHeaders, requestLogger, errorHandler, notFoundHandler } from "./middleware/security";
import { pool } from "./config/database";
import { testAlgorandConnection } from "./config/algorand";
import { KMSService } from "./services/kmsService";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || "v1";

// Initialize connections
async function initializeConnections() {
  try {
    // Test database connection
    const client = await pool.connect();
    client.release();
    logger.info("Database connection established");

    // Test Algorand connection
    await testAlgorandConnection();

    // Test KMS connection
    const kmsTest = await KMSService.testConnection();
    if (kmsTest) {
      logger.info("AWS KMS connection established");
    } else {
      logger.warn("AWS KMS connection test failed");
    }
  } catch (error) {
    logger.error("Failed to initialize connections:", error);
    process.exit(1);
  }
}

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// API routes
app.use(`/api/${API_VERSION}`, routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Trezo Treasury Backend API",
    version: API_VERSION,
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      company: {
        register: `/api/${API_VERSION}/company/register`,
        login: `/api/${API_VERSION}/company/login`,
        profile: `/api/${API_VERSION}/company/profile`,
      },
      treasury: {
        balance: `/api/${API_VERSION}/treasury/balance/:companyId`,
        transactions: `/api/${API_VERSION}/treasury/transactions/:companyId`,
        send: `/api/${API_VERSION}/treasury/send`,
        audit: `/api/${API_VERSION}/treasury/audit/:companyId`,
      },
      wallet: {
        create: `/api/${API_VERSION}/wallet/create`,
        recover: `/api/${API_VERSION}/wallet/recover`,
        validate: `/api/${API_VERSION}/wallet/validate`,
        account: `/api/${API_VERSION}/wallet/account/:address`,
      },
    },
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initializeConnections();

    app.listen(PORT, () => {
      logger.info(`🚀 Trezo Treasury Backend server running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
      logger.info(`🏢 Company API: http://localhost:${PORT}/api/${API_VERSION}/company`);
      logger.info(`💰 Treasury API: http://localhost:${PORT}/api/${API_VERSION}/treasury`);
      logger.info(`💼 Wallet API: http://localhost:${PORT}/api/${API_VERSION}/wallet`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

export default app;
