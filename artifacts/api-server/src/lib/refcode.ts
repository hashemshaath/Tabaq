/**
 * Sequential Reference Code Generator
 *
 * Generates human-readable, traceable reference codes used across all platform modules.
 * Format: TBQ-{TYPE}-{YEAR}-{ZERO_PADDED_ID}
 *
 * Examples:
 *   TBQ-USR-2026-000001   (User)
 *   TBQ-RST-2026-000042   (Restaurant)
 *   TBQ-OFR-2026-000003   (Offer)
 *   TBQ-VCH-2026-000128   (Voucher)
 *   TBQ-CTR-2026-000001   (Contract)
 *   TBQ-TXN-2026-000099   (Transaction)
 *   TBQ-INV-2026-000007   (Invoice)
 *   TBQ-MSG-2026-000015   (Admin Message)
 *   TBQ-BKG-2026-000256   (Booking)
 */

export type RefCodeType =
  | "USR" // User
  | "RST" // Restaurant
  | "OFR" // Offer
  | "VCH" // Voucher
  | "CTR" // Contract
  | "TXN" // Transaction
  | "INV" // Invoice
  | "MSG" // Admin Message
  | "BKG"; // Booking

/**
 * Generate a reference code from a type prefix and a sequential database ID.
 * The year is derived from the current date when the code is generated.
 */
export function generateRefCode(type: RefCodeType, id: number): string {
  const year = new Date().getFullYear();
  const padded = id.toString().padStart(6, "0");
  return `TBQ-${type}-${year}-${padded}`;
}

/**
 * Parse a reference code back into its components.
 * Returns null if the code format is invalid.
 */
export function parseRefCode(code: string): { prefix: string; type: string; year: number; id: number } | null {
  const match = code.match(/^TBQ-([A-Z]{3})-(\d{4})-(\d{6})$/);
  if (!match) return null;
  return {
    prefix: "TBQ",
    type: match[1]!,
    year: parseInt(match[2]!),
    id: parseInt(match[3]!),
  };
}
