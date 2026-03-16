export interface BillSummary {
  vendorName: string | null;
  lineItems: Array<{ description: string; amount: string }>;
  subtotal: string | null;
  tax: string | null;
  total: string | null;
  extractedAt: string;
}

export interface IOCRService {
  extractBillData(buffer: Buffer, mimeType: string, filename: string): Promise<BillSummary>;
}

export class MockOCRService implements IOCRService {
  async extractBillData(_buffer: Buffer, _mimeType: string, filename: string): Promise<BillSummary> {
    const name = filename.toLowerCase();

    // Extract vendor: vendor-<name> pattern
    const vendorMatch = name.match(/vendor[_-]([a-z0-9]+)/);
    const vendorName = vendorMatch ? vendorMatch[1] : null;

    // Extract total: total-<amount> pattern
    const totalMatch = name.match(/total[_-]([\d.]+)/);
    const total = totalMatch ? totalMatch[1] : null;

    // Extract tax: tax-<amount> pattern
    const taxMatch = name.match(/tax[_-]([\d.]+)/);
    const tax = taxMatch ? taxMatch[1] : null;

    // Extract subtotal: subtotal-<amount> or derive from total - tax
    const subtotalMatch = name.match(/subtotal[_-]([\d.]+)/);
    let subtotal: string | null = subtotalMatch ? subtotalMatch[1] : null;
    if (!subtotal && total && tax) {
      subtotal = (parseFloat(total) - parseFloat(tax)).toFixed(2);
    }

    // Extract line items: item-<desc>-<amount> patterns
    const lineItems: Array<{ description: string; amount: string }> = [];
    const itemRegex = /item[_-]([a-z0-9]+)[_-]([\d.]+)/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(name)) !== null) {
      lineItems.push({ description: match[1], amount: match[2] });
    }

    return {
      vendorName,
      lineItems,
      subtotal,
      tax,
      total,
      extractedAt: new Date().toISOString(),
    };
  }
}

export function computeVerificationStatus(declared: string, extracted: string | null): "matched" | "mismatch" | "unverifiable" {
  if (!extracted) return "unverifiable";
  const diff = Math.abs(parseFloat(declared) - parseFloat(extracted));
  const tolerance = parseFloat(declared) * 0.01;
  return diff <= tolerance ? "matched" : "mismatch";
}

export const ocrService: IOCRService = new MockOCRService();
