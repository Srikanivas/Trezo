const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up Trezo Treasury Backend...\n");

// Install dependencies
console.log("📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed successfully\n");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Check environment variables
console.log("🔧 Checking environment configuration...");
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "KMS_KEY_ID"];

const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found. Please create one based on the template.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const missingVars = requiredEnvVars.filter((varName) => {
  const regex = new RegExp(`^${varName}=.+`, "m");
  return !regex.test(envContent);
});

if (missingVars.length > 0) {
  console.warn("⚠️  Missing environment variables:");
  missingVars.forEach((varName) => console.warn(`   - ${varName}`));
  console.warn("   Please update your .env file\n");
} else {
  console.log("✅ Environment configuration looks good\n");
}

// Build the project
console.log("🔨 Building TypeScript project...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Project built successfully\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

console.log("🎉 Trezo Treasury Backend setup completed!\n");
console.log("Next steps:");
console.log("1. Set up your MySQL database");
console.log("2. Update the DATABASE_URL in your .env file");
console.log("3. Configure AWS KMS key and update KMS_KEY_ID");
console.log("4. Run: npm run dev (for development)");
console.log("5. Run: npm start (for production)\n");

console.log("📚 API Endpoints will be available at:");
console.log("   - Company Registration: POST /api/v1/company/register");
console.log("   - Company Login: POST /api/v1/company/login");
console.log("   - Treasury Balance: GET /api/v1/treasury/balance/:companyId");
console.log("   - Send Transaction: POST /api/v1/treasury/send");
console.log("   - Transaction History: GET /api/v1/treasury/transactions/:companyId");
console.log("   - Health Check: GET /api/v1/health\n");
