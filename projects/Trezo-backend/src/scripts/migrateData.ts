import dotenv from "dotenv";
dotenv.config();
import { pool } from "../config/database";

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration...");
    await client.query("BEGIN");

    // ── companies (disable/re-enable serial sequence after explicit IDs) ──
    await client.query(`
      INSERT INTO companies (id, company_name, email, password_hash, wallet_address, created_at, updated_at) VALUES
      (1, 'Rejolt Edtech', 'srikarnivasreddyyerra.24@gmail.com', '$2a$12$97beFQdQKZay5aD8BCfl2.JRJbP/wwjvtQxEbXtQoWRvqTNujjACS', 'ITGRZXS2EV2MX6JNWDRKJZUOV7742ZG4ZLW4AKCOBRELLM5G3223IATKJE', '2026-03-11 10:19:22', '2026-03-11 10:45:00'),
      (2, 'Test Company',  'test@example.com',                   '$2a$12$a1C8n8TA4oedmqSGlLGqK..HhF7iA6MzHgM3/U5ertZit8C12MVaC', 'FOTGGYZIDLIYYP3Q3ALZQSU3S46MAV24H3BL34EP63D3MRCLBGZ7K7SKHQ',  '2026-03-11 10:22:03', '2026-03-11 10:22:03'),
      (1000000, 'Ram sey', 'srikarnivas.24@gmail.com',           '$2a$12$VllJ473cFNzZcAf2mpKd0efoxOWljkyueZMnIP9uBSlFNZWDaZeZW',  'ECS56CMTUNQNAE64GU24XUTVGW5ZQUHH4TPXWLQCJIYZLRKY6QKDRK6P2I', '2026-03-15 04:00:38', '2026-03-15 04:00:38')
      ON CONFLICT (id) DO NOTHING
    `);
    // Sync the serial sequence so next INSERT gets a fresh ID
    await client.query(`SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies))`);
    console.log("✅ companies inserted");

    // ── company_wallet_keys ──
    await client.query(`
      INSERT INTO company_wallet_keys (id, company_id, encrypted_private_key, created_at) VALUES
      (1, 2,       'YjU1MzVkYjg1YjdiNzMwZDk2MTk4ZWE1Y2ZiMTY0YzY6NTRmZmEyZTYxMmMxMGRkNDA2MTk5ZTEwYzFlNDY3ZmJmZDlmMzdhYmFlYTcwMzZlMjdmMmFmZTg2MTM5Njc0NDdlZjM4ZGQyZTBjZmVhOWU4ZWZlNjJiNTFlOWQxMjY4M2Q4OWZhYzU3ZjJkYjg3NjJiNDdiNTZjMzY1OGMzNDAwNWVkMjhlNTY4NGYxMjE5YWE3MWQ2MTJkNGJlZTM2ZmMzMWMyYzE5ODUzZDMwM2QwZDkzZWUzYTM3NzM3MmNi', '2026-03-11 10:22:03'),
      (2, 1,       'YmNhYTE3ZmZhMTQ2YTNiNDljYTI3NmVlNjUwZjg5Yjg6YzBkMmQ0Nzk2ZGZlYzU3MmNkZjJmZDk5NDFjN2E3ZDQ5ZDVhMTlhYjMzY2Q5ZjM5NDM1MzJlOGIwOGZiNTgyOTI0ZmVhNzMyN2RlYzE1YzhhOTU2ZjcxNzIzMjNhZGI1OGEyN2QxZDc2MmNjMjQ0ZTEyNWUzM2MyOWI0Y2ZkOWQ5YjYyZDNjYTdmYjhiOWViNTg2Y2UxYTRkNjVjZjY1NmU2YzQ1MmI2MmNhZWIyMzA0ZmE3NmNjNWY4YTExZjhk', '2026-03-11 10:45:00'),
      (5, 1000000, 'AQICAHjba+5bLYVLxd9bVmVba+9nNq6xrByHEPcT/rtmCtStkQEr+9BCuJ8K9mjvqREuV4InAAAAujCBtwYJKoZIhvcNAQcGoIGpMIGmAgEAMIGgBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGbTSF2BSy6wSyunAwIBEIBzQGDk1d/cRDEKw4j7J00j9nGt1cEIhRbduM7HwgsWYG8cYcVnAaY3WxPqa8r6jwmVvIeaQE3HQz/AyQit6401Rf1SQlgQ1E6I0NhEOo5REF5mYAqjMDdRv26dA/81QQdjq3VR/dXmD2IL8YWYsmownLdiZQ==', '2026-03-15 04:00:39')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`SELECT setval('company_wallet_keys_id_seq', (SELECT MAX(id) FROM company_wallet_keys))`);
    console.log("✅ company_wallet_keys inserted");

    // ── wallet_audit_log ──
    await client.query(`
      INSERT INTO wallet_audit_log (id, company_id, operation_type, wallet_address, transaction_id, amount, asset_id, recipient_address, details, created_at) VALUES
      (1,2,'WALLET_CREATED','FOTGGYZIDLIYYP3Q3ALZQSU3S46MAV24H3BL34EP63D3MRCLBGZ7K7SKHQ',NULL,NULL,0,NULL,'{"timestamp":"2026-03-11T10:22:03.137Z","company_name":"Test Company"}','2026-03-11 10:22:03'),
      (24,1,'TRANSACTION_SENT','ITGRZXS2EV2MX6JNWDRKJZUOV7742ZG4ZLW4AKCOBRELLM5G3223IATKJE','B7Z7KUFAUSR7RBYYCC3P74NG3RXYX26X7S65MSLQBFCD724JF33A',1000000,0,'ABY5BXVERDXTZQEZJVUVP64DCMXTAXRCS45ZF657KEOXDEZDGWWUN5WJUA','{"timestamp":"2026-03-11T10:56:25.565Z"}','2026-03-11 10:56:25'),
      (56,1000000,'WALLET_CREATED','ECS56CMTUNQNAE64GU24XUTVGW5ZQUHH4TPXWLQCJIYZLRKY6QKDRK6P2I',NULL,NULL,0,NULL,'{"timestamp":"2026-03-15T04:00:39.141Z","company_name":"Ram sey"}','2026-03-15 04:00:39'),
      (67,1,'TRANSACTION_SENT','ITGRZXS2EV2MX6JNWDRKJZUOV7742ZG4ZLW4AKCOBRELLM5G3223IATKJE','HPEXO7RA4E2GR3NT6JEOURI3S2UOOCHAYQTBPNI62TJAYBKTPGRA',5000000,0,'ECS56CMTUNQNAE64GU24XUTVGW5ZQUHH4TPXWLQCJIYZLRKY6QKDRK6P2I','{"timestamp":"2026-03-15T04:11:33.574Z"}','2026-03-15 04:11:33'),
      (73,1000000,'TRANSACTION_SENT','ECS56CMTUNQNAE64GU24XUTVGW5ZQUHH4TPXWLQCJIYZLRKY6QKDRK6P2I','VGDRSIJENCSBQ54Z46OC5M46QPW6RZ2A274D3AW5VGAINTMHV3YQ',2500000,0,'ITGRZXS2EV2MX6JNWDRKJZUOV7742ZG4ZLW4AKCOBRELLM5G3223IATKJE','{"timestamp":"2026-03-15T04:12:41.031Z"}','2026-03-15 04:12:41')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`SELECT setval('wallet_audit_log_id_seq', (SELECT MAX(id) FROM wallet_audit_log))`);
    console.log("✅ wallet_audit_log inserted (key records only — balance checks skipped)");

    await client.query("COMMIT");
    console.log("\n✅ Migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
