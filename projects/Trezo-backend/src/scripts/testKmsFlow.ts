/**
 * Integration test: KMS encrypt → DB store → DB fetch → KMS decrypt
 * Run with: npx ts-node src/scripts/testKmsFlow.ts
 */

import dotenv from "dotenv";
dotenv.config();

import algosdk from "algosdk";
import { KMSService } from "../services/kmsService";
import { WalletKeyRepository } from "../repositories/walletKeyRepository";
import { pool } from "../config/database";

const TEST_COMPANY_ID = 999999;

function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
}
function fail(msg: string) {
  console.error(`  ❌ ${msg}`);
  process.exit(1);
}
function step(msg: string) {
  console.log(`\n[${msg}]`);
}

async function cleanup() {
  await pool.query("DELETE FROM company_wallet_keys WHERE company_id = $1", [TEST_COMPANY_ID]);
  await pool.query("DELETE FROM companies WHERE id = $1", [TEST_COMPANY_ID]);
}

async function seedTestCompany() {
  await pool.query(
    `INSERT INTO companies (id, company_name, email, password_hash, wallet_address)
     VALUES ($1, '__test__', '__test__@kms.test', '__hash__', '__addr__')
     ON CONFLICT (id) DO NOTHING`,
    [TEST_COMPANY_ID],
  );
}

async function run() {
  console.log("=== Trezo KMS Flow Integration Test ===\n");

  step("1. Generate Algorand wallet");
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  const privateKeyBase64 = Buffer.from(account.sk).toString("base64");
  console.log(`  Address  : ${account.addr}`);
  console.log(`  Mnemonic : ${mnemonic.slice(0, 30)}...`);
  pass("Wallet generated");

  step("2. Encrypt private key via AWS KMS");
  let encryptedPrivateKey: string;
  try {
    encryptedPrivateKey = await KMSService.encrypt(privateKeyBase64);
    console.log(`  Encrypted (first 60 chars): ${encryptedPrivateKey.slice(0, 60)}...`);
    pass("KMS encryption succeeded");
  } catch (e: any) {
    fail(`KMS encryption failed: ${e.message}`);
    return;
  }
  if (encryptedPrivateKey === privateKeyBase64) {
    fail("Encrypted value identical to plaintext");
    return;
  }
  pass("Encrypted value differs from plaintext");

  step("3. Store encrypted key in DB (company_wallet_keys)");
  await cleanup();
  await seedTestCompany();
  try {
    const stored = await WalletKeyRepository.create(TEST_COMPANY_ID, encryptedPrivateKey);
    console.log(`  DB row id : ${stored.id}, company_id: ${stored.company_id}`);
    pass("Encrypted key stored in DB");
  } catch (e: any) {
    fail(`DB store failed: ${e.message}`);
    return;
  }

  step("4. Fetch encrypted key from DB");
  let fetched: string;
  try {
    const row = await WalletKeyRepository.findByCompanyId(TEST_COMPANY_ID);
    if (!row) {
      fail("No row found in DB");
      return;
    }
    fetched = row.encrypted_private_key;
    console.log(`  Fetched (first 60 chars): ${fetched.slice(0, 60)}...`);
    pass("Encrypted key fetched from DB");
  } catch (e: any) {
    fail(`DB fetch failed: ${e.message}`);
    return;
  }
  if (fetched !== encryptedPrivateKey) {
    fail("Fetched value does not match stored value");
    return;
  }
  pass("Fetched value matches stored value");

  step("5. Decrypt private key via AWS KMS");
  let decryptedBase64: string;
  try {
    decryptedBase64 = await KMSService.decrypt(fetched);
    pass("KMS decryption succeeded");
  } catch (e: any) {
    fail(`KMS decryption failed: ${e.message}`);
    return;
  }

  step("6. Verify round-trip integrity");
  if (decryptedBase64 !== privateKeyBase64) {
    fail("Decrypted key does NOT match original");
    return;
  }
  pass("Decrypted private key matches original");

  step("7. Reconstruct Algorand account from decrypted key");
  const secretKey = new Uint8Array(Buffer.from(decryptedBase64, "base64"));
  const recoveredAccount = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(secretKey));
  console.log(`  Recovered address: ${recoveredAccount.addr}`);
  if (recoveredAccount.addr.toString() !== account.addr.toString()) {
    fail("Recovered address does NOT match original");
    return;
  }
  pass("Recovered address matches original wallet address");

  await cleanup();
  console.log("\n========================================");
  console.log("✅ ALL STEPS PASSED — KMS flow is working");
  console.log("========================================\n");
  await pool.end();
}

run().catch(async (err) => {
  console.error("\nUnhandled error:", err);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
