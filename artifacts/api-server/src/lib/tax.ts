/**
 * VAT / Tax Calculation Service
 *
 * Looks up the applicable tax rate for a country from the tax_configurations table.
 * Falls back to 0% if the country is not configured.
 *
 * Saudi rates seeded on first call:
 *   SA=15%, AE=5%, EG=14%, BH=10%, OM=5%, KW=0%, QA=0%
 */

import { db } from "@workspace/db";
import { taxConfigurationsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "./logger.js";

export interface TaxResult {
  taxName: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  totalWithTax: number;
}

const SEED_RATES: Array<{ countryCode: string; taxName: string; taxRate: string }> = [
  { countryCode: "SA", taxName: "VAT", taxRate: "0.1500" },
  { countryCode: "AE", taxName: "VAT", taxRate: "0.0500" },
  { countryCode: "EG", taxName: "VAT", taxRate: "0.1400" },
  { countryCode: "KW", taxName: "VAT", taxRate: "0.0000" },
  { countryCode: "QA", taxName: "VAT", taxRate: "0.0000" },
  { countryCode: "BH", taxName: "VAT", taxRate: "0.1000" },
  { countryCode: "OM", taxName: "VAT", taxRate: "0.0500" },
];

let seeded = false;

async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  try {
    for (const row of SEED_RATES) {
      await db
        .insert(taxConfigurationsTable)
        .values({ countryCode: row.countryCode, taxName: row.taxName, taxRate: row.taxRate })
        .onConflictDoNothing();
    }
    seeded = true;
  } catch (err) {
    logger.warn({ err }, "Tax seed failed (non-critical)");
  }
}

/**
 * Per-item tax descriptor — reserved for future item-level tax exemption logic.
 * Currently all items are treated as fully taxable; this parameter is accepted
 * but not yet used so callers can start passing it without code changes later.
 */
export interface TaxableItem {
  taxable?: boolean;  // false = exempt from tax (e.g. medicines, children's clothing)
  price?: number;
  qty?: number;
}

export async function calculateTax(
  countryCode: string,
  subtotal: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _items?: TaxableItem[],  // reserved — per-item exemptions not yet implemented
): Promise<TaxResult> {
  await ensureSeeded();

  try {
    const [config] = await db
      .select()
      .from(taxConfigurationsTable)
      .where(
        and(
          eq(taxConfigurationsTable.countryCode, countryCode.toUpperCase()),
          eq(taxConfigurationsTable.isActive, true),
        ),
      )
      .limit(1);

    const rate = config ? parseFloat(String(config.taxRate)) : 0;
    const taxName = config?.taxName ?? "VAT";
    const taxAmount = Math.round(subtotal * rate * 100) / 100;
    const totalWithTax = Math.round((subtotal + taxAmount) * 100) / 100;

    return { taxName, rate, taxableAmount: subtotal, taxAmount, totalWithTax };
  } catch (err) {
    logger.warn({ err }, "calculateTax failed, returning zero (non-critical)");
    return { taxName: "VAT", rate: 0, taxableAmount: subtotal, taxAmount: 0, totalWithTax: subtotal };
  }
}
