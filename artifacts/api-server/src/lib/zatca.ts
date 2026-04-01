/**
 * ZATCA (Zakat, Tax and Customs Authority) Phase 1 QR Code Generator
 *
 * Generates the Base64-encoded TLV (Tag-Length-Value) string required for
 * the QR code on Saudi Arabian compliant invoices.
 *
 * Phase 1 TLV fields (all encoded as UTF-8):
 *   Tag 1 — Seller name
 *   Tag 2 — VAT registration number
 *   Tag 3 — Invoice timestamp (ISO 8601)
 *   Tag 4 — Invoice total (including VAT), as a decimal string
 *   Tag 5 — VAT amount, as a decimal string
 *
 * Reference: https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/default.aspx
 */

function tlvField(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, "utf8");
  const header = Buffer.from([tag, valueBytes.length]);
  return Buffer.concat([header, valueBytes]);
}

export interface ZatcaQrParams {
  sellerName:    string;
  vatRegNumber:  string;
  timestamp:     Date | string;
  totalAmount:   number | string;
  vatAmount:     number | string;
}

/**
 * Build the ZATCA Phase-1 TLV blob and return it as a Base64 string,
 * ready to be encoded into a QR code image by the frontend.
 */
export function generateZatcaQr(params: ZatcaQrParams): string {
  const ts =
    typeof params.timestamp === "string"
      ? params.timestamp
      : params.timestamp.toISOString();

  const total = Number(params.totalAmount).toFixed(2);
  const vat   = Number(params.vatAmount).toFixed(2);

  const tlv = Buffer.concat([
    tlvField(1, params.sellerName),
    tlvField(2, params.vatRegNumber),
    tlvField(3, ts),
    tlvField(4, total),
    tlvField(5, vat),
  ]);

  return tlv.toString("base64");
}

// Platform-level defaults used when restaurant-specific data is unavailable.
export const ZATCA_DEFAULTS = {
  SELLER_NAME:   "Tabaq Platform",
  VAT_REG_NUMBER: "300000000000003",  // placeholder — override per restaurant in production
} as const;
