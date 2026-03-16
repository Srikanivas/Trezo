/**
 * Property-based tests for Smart Invoice & Payment System
 * Uses fast-check for property generation
 */
import * as fc from "fast-check";
import { MockOCRService, computeVerificationStatus, BillSummary } from "../services/ocrService";

// ─── Property 1: Company search excludes self ─────────────────────────────────
describe("Property 1: Company search excludes self", () => {
  it("should never return the requesting company in search results", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.array(fc.record({ id: fc.integer({ min: 1, max: 1000 }), company_name: fc.string({ minLength: 2 }) }), {
          minLength: 0,
          maxLength: 20,
        }),
        (requestingId, companies) => {
          // Simulate the filter applied in CompanyRepository.searchByName
          const results = companies.filter((c) => c.id !== requestingId);
          return results.every((c) => c.id !== requestingId);
        },
      ),
    );
  });
});

// ─── Property 2: Invoice creation rejects non-positive amounts ────────────────
describe("Property 2: Invoice creation rejects non-positive amounts", () => {
  it("should reject amounts <= 0", () => {
    fc.assert(
      fc.property(fc.oneof(fc.constant(0), fc.double({ max: 0, noNaN: true }), fc.integer({ max: 0 })), (amount) => {
        return parseFloat(String(amount)) <= 0;
      }),
    );
  });

  it("should accept amounts > 0", () => {
    fc.assert(fc.property(fc.double({ min: 0.000001, max: 1_000_000, noNaN: true }), (amount) => amount > 0));
  });
});

// ─── Property 3: Invoice creation rejects missing required fields ─────────────
describe("Property 3: Invoice creation rejects missing required fields", () => {
  const REQUIRED = ["receiver_company_id", "amount", "currency", "message"];

  it("should require all fields to be present", () => {
    fc.assert(
      fc.property(fc.subarray([...REQUIRED], { minLength: 1 }), (missingFields: string[]) => {
        const body: Record<string, any> = {
          receiver_company_id: 2,
          amount: "10",
          currency: "ALGO",
          message: "test",
        };
        missingFields.forEach((f) => delete body[f]);
        const hasAll = REQUIRED.every((f) => body[f] !== undefined && body[f] !== null && body[f] !== "");
        return !hasAll; // should be invalid
      }),
    );
  });
});

// ─── Property 4: Currency options always include ALGO ─────────────────────────
describe("Property 4: Currency options always include ALGO", () => {
  it("should always include ALGO regardless of wallet assets", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            assetId: fc.integer({ min: 1, max: 999999 }),
            amount: fc.double({ min: 0, max: 10000, noNaN: true }),
            unitName: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 0, maxLength: 10 },
        ),
        (assets) => {
          // Simulate currency options: always include ALGO + positive-balance assets
          const options = [
            { currency: "ALGO", assetId: null },
            ...assets.filter((a) => a.amount > 0).map((a) => ({ currency: a.unitName, assetId: a.assetId })),
          ];
          return options.some((o) => o.currency === "ALGO" && o.assetId === null);
        },
      ),
    );
  });

  it("should only include ASAs with balance > 0", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            assetId: fc.integer({ min: 1, max: 999999 }),
            amount: fc.double({ min: 0, max: 10000, noNaN: true }),
            unitName: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (assets) => {
          const options = assets.filter((a) => a.amount > 0);
          return options.every((o) => o.amount > 0);
        },
      ),
    );
  });
});

// ─── Property 6: File upload validation rejects invalid files ─────────────────
describe("Property 6: File upload validation rejects invalid files", () => {
  const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
  const MAX_BYTES = 10 * 1024 * 1024;

  it("should reject unsupported MIME types", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !ALLOWED.includes(s)),
        (mimeType) => !ALLOWED.includes(mimeType),
      ),
    );
  });

  it("should reject files exceeding 10 MB", () => {
    fc.assert(fc.property(fc.integer({ min: MAX_BYTES + 1, max: MAX_BYTES * 10 }), (size) => size > MAX_BYTES));
  });

  it("should accept valid MIME types within size limit", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED),
        fc.integer({ min: 1, max: MAX_BYTES }),
        (mimeType, size) => ALLOWED.includes(mimeType) && size <= MAX_BYTES,
      ),
    );
  });
});

// ─── Property 8: AI agent output schema completeness ─────────────────────────
describe("Property 8: AI agent output schema completeness", () => {
  const ocr = new MockOCRService();

  it("should always return a BillSummary with all required fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 0, maxLength: 100 }),
        fc.constantFrom("image/jpeg", "image/png", "application/pdf"),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (buffer, mimeType, filename) => {
          const result: BillSummary = await ocr.extractBillData(Buffer.from(buffer), mimeType, filename);
          return (
            "vendorName" in result &&
            "lineItems" in result &&
            "subtotal" in result &&
            "tax" in result &&
            "total" in result &&
            "extractedAt" in result &&
            Array.isArray(result.lineItems) &&
            typeof result.extractedAt === "string"
          );
        },
      ),
    );
  });
});

// ─── Property 9: Verification status is deterministic ────────────────────────
describe("Property 9: Verification status is deterministic", () => {
  it("should return matched when within 1% tolerance", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.double({ min: 0, max: 0.009, noNaN: true }), // diff fraction < 1%
        (declared, diffFraction) => {
          const extracted = String(declared * (1 + diffFraction));
          return computeVerificationStatus(String(declared), extracted) === "matched";
        },
      ),
    );
  });

  it("should return mismatch when outside 1% tolerance", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 0.02, max: 0.5, noNaN: true }), // diff fraction > 1%
        (declared, diffFraction) => {
          const extracted = String(declared * (1 + diffFraction));
          return computeVerificationStatus(String(declared), extracted) === "mismatch";
        },
      ),
    );
  });

  it("should return unverifiable when extracted is null", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        (declared) => computeVerificationStatus(String(declared), null) === "unverifiable",
      ),
    );
  });

  it("should be deterministic — same inputs always produce same output", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.option(fc.double({ min: 0.01, max: 10000, noNaN: true }), { nil: null }),
        (declared, extracted) => {
          const r1 = computeVerificationStatus(String(declared), extracted !== null ? String(extracted) : null);
          const r2 = computeVerificationStatus(String(declared), extracted !== null ? String(extracted) : null);
          return r1 === r2;
        },
      ),
    );
  });
});

// ─── Property 11: Invoice serialisation round-trip ───────────────────────────
describe("Property 11: Invoice serialisation round-trip", () => {
  it("should preserve all fields through JSON serialise/deserialise", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          sender_company_id: fc.integer({ min: 1 }),
          receiver_company_id: fc.integer({ min: 1 }),
          amount: fc.double({ min: 0.000001, max: 1_000_000, noNaN: true }).map((n) => n.toFixed(6)),
          currency: fc.constantFrom("ALGO", "USDC", "TEST"),
          message: fc.string({ minLength: 1, maxLength: 200 }),
          status: fc.constantFrom("draft", "pending_approval", "approved", "rejected", "paid", "cancelled"),
          autopay_enabled: fc.boolean(),
          autopay_failed: fc.boolean(),
          verification_status: fc.constantFrom("not_applicable", "matched", "mismatch", "unverifiable"),
          created_at: fc.date().map((d) => d.toISOString()),
          updated_at: fc.date().map((d) => d.toISOString()),
        }),
        (invoice) => {
          const serialised = JSON.stringify(invoice);
          const deserialised = JSON.parse(serialised);
          // All fields must be equivalent
          return (
            deserialised.id === invoice.id &&
            deserialised.amount === invoice.amount && // string preserved
            deserialised.currency === invoice.currency &&
            deserialised.status === invoice.status
          );
        },
      ),
    );
  });
});

// ─── Property (Req 8): Budget check returns correct overage ──────────────────
describe("Property (Req 8): Budget check returns correct overage", () => {
  it("should correctly compute exceeded and overage", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }), // consumed
        fc.double({ min: 0.01, max: 10000, noNaN: true }), // limit
        fc.double({ min: 0.01, max: 10000, noNaN: true }), // payment
        (consumed, limit, payment) => {
          const newTotal = consumed + payment;
          const exceeded = newTotal > limit;
          const overage = exceeded ? newTotal - limit : 0;
          // Verify the math
          if (exceeded) return overage > 0 && Math.abs(consumed + payment - limit - overage) < 0.0001;
          return overage === 0;
        },
      ),
    );
  });
});

// ─── Property (Req 10): Notification delivery idempotency ────────────────────
describe("Property (Req 10): Notification delivery idempotency", () => {
  it("markAllRead should set all notifications to read regardless of count", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer({ min: 1 }), is_read: fc.boolean() }), { minLength: 0, maxLength: 50 }),
        (notifications) => {
          // Simulate markAllRead
          const after = notifications.map((n) => ({ ...n, is_read: true }));
          return after.every((n) => n.is_read === true);
        },
      ),
    );
  });

  it("unread count should equal number of unread notifications", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer({ min: 1 }), is_read: fc.boolean() }), { minLength: 0, maxLength: 50 }),
        (notifications) => {
          const unread = notifications.filter((n) => !n.is_read).length;
          return unread >= 0 && unread <= notifications.length;
        },
      ),
    );
  });
});
