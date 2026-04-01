import { Router } from "express";
import { db } from "@workspace/db";
import {
  contractsTable, transactionsTable, invoicesTable, adminMessagesTable,
  restaurantsTable, usersTable, offersTable,
  customerInvoicesTable, ordersTable,
} from "@workspace/db/schema";
import { calculateTax } from "../lib/tax.js";
import { eq, desc, and, gte, lte, sql, count, sum, isNull } from "drizzle-orm";
import { generateRefCode } from "../lib/refcode.js";
import { requireAdmin } from "../middleware/requireAuth.js";

const router = Router();

// Protect all /admin/* routes
router.use(/^\/admin/, requireAdmin);

// ─── CONTRACTS ────────────────────────────────────────────────────────────────

// List all contracts
router.get("/admin/contracts", async (req, res) => {
  try {
    const contracts = await db
      .select({
        id: contractsTable.id,
        refCode: contractsTable.refCode,
        restaurantId: contractsTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        restaurantRefCode: restaurantsTable.refCode,
        status: contractsTable.status,
        paymentModel: contractsTable.paymentModel,
        commissionPercent: contractsTable.commissionPercent,
        partialCollectionPercent: contractsTable.partialCollectionPercent,
        settlementDays: contractsTable.settlementDays,
        validFrom: contractsTable.validFrom,
        validUntil: contractsTable.validUntil,
        notes: contractsTable.notes,
        approvedAt: contractsTable.approvedAt,
        createdAt: contractsTable.createdAt,
        updatedAt: contractsTable.updatedAt,
      })
      .from(contractsTable)
      .leftJoin(restaurantsTable, eq(contractsTable.restaurantId, restaurantsTable.id))
      .orderBy(desc(contractsTable.createdAt));

    res.json({ contracts, total: contracts.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch contracts" });
  }
});

// Get a single contract
router.get("/admin/contracts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [contract] = await db
      .select()
      .from(contractsTable)
      .leftJoin(restaurantsTable, eq(contractsTable.restaurantId, restaurantsTable.id))
      .where(eq(contractsTable.id, id));

    if (!contract) { res.status(404).json({ error: "not_found", message: "Contract not found" }); return; }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch contract" });
  }
});

// Create a contract for a restaurant
router.post("/admin/contracts", async (req, res) => {
  try {
    const {
      restaurantId, paymentModel, commissionPercent, partialCollectionPercent,
      settlementDays, validFrom, validUntil, notes, internalNotes
    } = req.body;

    if (!restaurantId || commissionPercent === undefined) {
      res.status(400).json({ error: "bad_request", message: "restaurantId and commissionPercent are required" });
      return;
    }

    const [contract] = await db.insert(contractsTable).values({
      refCode: "PENDING", // temporary, updated below
      restaurantId,
      status: "draft",
      paymentModel: paymentModel ?? "full_collection",
      commissionPercent: String(commissionPercent),
      partialCollectionPercent: partialCollectionPercent ? String(partialCollectionPercent) : null,
      settlementDays: settlementDays ?? 7,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes ?? null,
      internalNotes: internalNotes ?? null,
    }).returning();

    // Now update with proper refCode
    const refCode = generateRefCode("CTR", contract.id);
    const [updated] = await db
      .update(contractsTable)
      .set({ refCode })
      .where(eq(contractsTable.id, contract.id))
      .returning();

    res.status(201).json({ contract: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create contract" });
  }
});

// Update a contract
router.put("/admin/contracts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      paymentModel, commissionPercent, partialCollectionPercent,
      settlementDays, validFrom, validUntil, notes, internalNotes, status
    } = req.body;

    const [updated] = await db
      .update(contractsTable)
      .set({
        ...(paymentModel && { paymentModel }),
        ...(commissionPercent !== undefined && { commissionPercent: String(commissionPercent) }),
        ...(partialCollectionPercent !== undefined && { partialCollectionPercent: partialCollectionPercent ? String(partialCollectionPercent) : null }),
        ...(settlementDays !== undefined && { settlementDays }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(notes !== undefined && { notes }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(eq(contractsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Contract not found" }); return; }
    res.json({ contract: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to update contract" });
  }
});

// Approve (activate) a contract
router.patch("/admin/contracts/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(contractsTable)
      .set({ status: "active", approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(contractsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Contract not found" }); return; }
    res.json({ contract: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to approve contract" });
  }
});

// Suspend / terminate a contract
router.patch("/admin/contracts/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status: "suspended" | "terminated" | "active" | "draft" };
    if (!status) { res.status(400).json({ error: "bad_request", message: "status is required" }); return; }

    const [updated] = await db
      .update(contractsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(contractsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Contract not found" }); return; }
    res.json({ contract: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to update contract status" });
  }
});

// Get contract for a specific restaurant (admin or owner view)
router.get("/restaurants/:restaurantId/contract", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const [contract] = await db
      .select()
      .from(contractsTable)
      .where(and(eq(contractsTable.restaurantId, restaurantId), eq(contractsTable.status, "active")))
      .orderBy(desc(contractsTable.createdAt))
      .limit(1);

    if (!contract) { res.status(404).json({ error: "not_found", message: "No active contract found" }); return; }
    res.json({ contract });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch contract" });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// List transactions (financial ledger)
router.get("/admin/transactions", async (req, res) => {
  try {
    const {
      restaurantId, type, status, from, to,
      limit = "50", offset = "0"
    } = req.query;

    const conditions = [];
    if (restaurantId) conditions.push(eq(transactionsTable.restaurantId, parseInt(restaurantId as string)));
    if (type) conditions.push(eq(transactionsTable.type, type as any));
    if (status) conditions.push(eq(transactionsTable.status, status as any));
    if (from) conditions.push(gte(transactionsTable.createdAt, new Date(from as string)));
    if (to) conditions.push(lte(transactionsTable.createdAt, new Date(to as string)));

    const transactions = await db
      .select({
        id: transactionsTable.id,
        refCode: transactionsTable.refCode,
        type: transactionsTable.type,
        status: transactionsTable.status,
        grossAmount: transactionsTable.grossAmount,
        commissionPercent: transactionsTable.commissionPercent,
        commissionAmount: transactionsTable.commissionAmount,
        netAmount: transactionsTable.netAmount,
        currency: transactionsTable.currency,
        paymentModel: transactionsTable.paymentModel,
        restaurantId: transactionsTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        settlementDueDate: transactionsTable.settlementDueDate,
        settledAt: transactionsTable.settledAt,
        notes: transactionsTable.notes,
        createdAt: transactionsTable.createdAt,
      })
      .from(transactionsTable)
      .leftJoin(restaurantsTable, eq(transactionsTable.restaurantId, restaurantsTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Aggregate totals
    const [totals] = await db
      .select({
        totalGross: sum(transactionsTable.grossAmount),
        totalCommission: sum(transactionsTable.commissionAmount),
        totalNet: sum(transactionsTable.netAmount),
        txCount: count(),
      })
      .from(transactionsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    res.json({
      transactions,
      totals: {
        grossAmount: totals?.totalGross ?? "0",
        commissionAmount: totals?.totalCommission ?? "0",
        netAmount: totals?.totalNet ?? "0",
        count: totals?.txCount ?? 0,
      },
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch transactions" });
  }
});

// Create a transaction (internal use — called when vouchers are redeemed/purchased)
router.post("/admin/transactions", async (req, res) => {
  try {
    const {
      type, restaurantId, userId, grossAmount, commissionPercent,
      currency, paymentModel, contractId, voucherId, offerId, notes, settlementDays
    } = req.body;

    if (!type || !grossAmount) {
      res.status(400).json({ error: "bad_request", message: "type and grossAmount are required" });
      return;
    }

    const gross = parseFloat(grossAmount);
    const commPct = commissionPercent != null ? parseFloat(commissionPercent) : 0;
    const commAmt = (gross * commPct) / 100;
    const netAmt = gross - commAmt;

    const settlementDue = settlementDays
      ? new Date(Date.now() + parseInt(settlementDays) * 24 * 60 * 60 * 1000)
      : null;

    const [tx] = await db.insert(transactionsTable).values({
      refCode: "PENDING",
      type,
      status: "pending",
      grossAmount: String(gross),
      commissionPercent: commPct > 0 ? String(commPct) : null,
      commissionAmount: commAmt > 0 ? String(commAmt.toFixed(2)) : null,
      netAmount: String(netAmt.toFixed(2)),
      currency: currency ?? "SAR",
      restaurantId: restaurantId ?? null,
      userId: userId ?? null,
      contractId: contractId ?? null,
      voucherId: voucherId ?? null,
      offerId: offerId ?? null,
      paymentModel: paymentModel ?? null,
      settlementDueDate: settlementDue,
      notes: notes ?? null,
    }).returning();

    const refCode = generateRefCode("TXN", tx.id);
    const [updated] = await db.update(transactionsTable)
      .set({ refCode })
      .where(eq(transactionsTable.id, tx.id))
      .returning();

    res.status(201).json({ transaction: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create transaction" });
  }
});

// Mark a transaction as settled
router.patch("/admin/transactions/:id/settle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(transactionsTable)
      .set({ status: "completed", settledAt: new Date() })
      .where(eq(transactionsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Transaction not found" }); return; }
    res.json({ transaction: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to settle transaction" });
  }
});

// ─── INVOICES ─────────────────────────────────────────────────────────────────

// List invoices
router.get("/admin/invoices", async (req, res) => {
  try {
    const { restaurantId, status } = req.query;

    const conditions = [];
    if (restaurantId) conditions.push(eq(invoicesTable.restaurantId, parseInt(restaurantId as string)));
    if (status) conditions.push(eq(invoicesTable.status, status as any));

    const invoices = await db
      .select({
        id: invoicesTable.id,
        refCode: invoicesTable.refCode,
        restaurantId: invoicesTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        status: invoicesTable.status,
        periodStart: invoicesTable.periodStart,
        periodEnd: invoicesTable.periodEnd,
        totalGrossAmount: invoicesTable.totalGrossAmount,
        totalCommissionAmount: invoicesTable.totalCommissionAmount,
        totalNetAmount: invoicesTable.totalNetAmount,
        currency: invoicesTable.currency,
        totalTransactions: invoicesTable.totalTransactions,
        dueDate: invoicesTable.dueDate,
        paidAt: invoicesTable.paidAt,
        notes: invoicesTable.notes,
        createdAt: invoicesTable.createdAt,
      })
      .from(invoicesTable)
      .leftJoin(restaurantsTable, eq(invoicesTable.restaurantId, restaurantsTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(invoicesTable.createdAt));

    res.json({ invoices, total: invoices.length });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch invoices" });
  }
});

// Generate an invoice for a restaurant (for a given period)
router.post("/admin/invoices/generate", async (req, res) => {
  try {
    const { restaurantId, periodStart, periodEnd, contractId, dueDate, notes } = req.body;

    if (!restaurantId || !periodStart || !periodEnd) {
      res.status(400).json({ error: "bad_request", message: "restaurantId, periodStart, and periodEnd are required" });
      return;
    }

    // Aggregate completed transactions in the period
    const [agg] = await db
      .select({
        totalGross: sum(transactionsTable.grossAmount),
        totalCommission: sum(transactionsTable.commissionAmount),
        totalNet: sum(transactionsTable.netAmount),
        txCount: count(),
      })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.restaurantId, restaurantId),
        eq(transactionsTable.status, "completed"),
        gte(transactionsTable.createdAt, new Date(periodStart)),
        lte(transactionsTable.createdAt, new Date(periodEnd)),
      ));

    const [invoice] = await db.insert(invoicesTable).values({
      refCode: "PENDING",
      restaurantId,
      contractId: contractId ?? null,
      status: "draft",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalGrossAmount: agg?.totalGross ?? "0",
      totalCommissionAmount: agg?.totalCommission ?? "0",
      totalNetAmount: agg?.totalNet ?? "0",
      currency: "SAR",
      totalTransactions: agg?.txCount ?? 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
    }).returning();

    const refCode = generateRefCode("INV", invoice.id);
    const [updated] = await db.update(invoicesTable)
      .set({ refCode })
      .where(eq(invoicesTable.id, invoice.id))
      .returning();

    res.status(201).json({ invoice: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to generate invoice" });
  }
});

// Update invoice status
router.patch("/admin/invoices/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    if (!status) { res.status(400).json({ error: "bad_request", message: "status is required" }); return; }

    const [updated] = await db
      .update(invoicesTable)
      .set({
        status,
        ...(status === "paid" && { paidAt: new Date() }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(invoicesTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Invoice not found" }); return; }
    res.json({ invoice: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to update invoice status" });
  }
});

// ─── ADMIN MESSAGES ───────────────────────────────────────────────────────────

// List messages (admin outbox or per-restaurant inbox)
router.get("/admin/messages", async (req, res) => {
  try {
    const { restaurantId, type } = req.query;

    const conditions = [];
    if (restaurantId) conditions.push(eq(adminMessagesTable.restaurantId, parseInt(restaurantId as string)));
    if (type) conditions.push(eq(adminMessagesTable.type, type as string));

    const messages = await db
      .select({
        id: adminMessagesTable.id,
        refCode: adminMessagesTable.refCode,
        restaurantId: adminMessagesTable.restaurantId,
        restaurantNameEn: restaurantsTable.nameEn,
        restaurantNameAr: restaurantsTable.nameAr,
        subject: adminMessagesTable.subject,
        body: adminMessagesTable.body,
        type: adminMessagesTable.type,
        relatedOfferId: adminMessagesTable.relatedOfferId,
        isRead: adminMessagesTable.isRead,
        readAt: adminMessagesTable.readAt,
        createdAt: adminMessagesTable.createdAt,
      })
      .from(adminMessagesTable)
      .leftJoin(restaurantsTable, eq(adminMessagesTable.restaurantId, restaurantsTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(adminMessagesTable.createdAt));

    res.json({ messages, total: messages.length });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch messages" });
  }
});

// Send a message to a restaurant
router.post("/admin/messages", async (req, res) => {
  try {
    const { restaurantId, subject, body, type, relatedOfferId, relatedContractId, relatedInvoiceId } = req.body;

    if (!restaurantId || !subject || !body) {
      res.status(400).json({ error: "bad_request", message: "restaurantId, subject, and body are required" });
      return;
    }

    const [msg] = await db.insert(adminMessagesTable).values({
      refCode: "PENDING",
      restaurantId,
      subject,
      body,
      type: type ?? "general",
      relatedOfferId: relatedOfferId ?? null,
      relatedContractId: relatedContractId ?? null,
      relatedInvoiceId: relatedInvoiceId ?? null,
    }).returning();

    const refCode = generateRefCode("MSG", msg.id);
    const [updated] = await db.update(adminMessagesTable)
      .set({ refCode })
      .where(eq(adminMessagesTable.id, msg.id))
      .returning();

    res.status(201).json({ message: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to send message" });
  }
});

// Restaurant marks a message as read
router.patch("/admin/messages/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(adminMessagesTable)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(adminMessagesTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "not_found", message: "Message not found" }); return; }
    res.json({ message: updated });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to mark message as read" });
  }
});

// ─── TAX BACKFILL ─────────────────────────────────────────────────────────────

/**
 * POST /admin/invoices/backfill-tax
 *
 * Idempotent one-shot job: finds customer invoices that were created before the
 * tax layer was implemented (tax_amount = 0 / null while source = 'order'),
 * recalculates the applicable VAT from the order's country_code, and fills in
 * the tax breakdown fields (taxRate, taxName, taxAmount).
 *
 * NOTE: The charged `total` is intentionally NOT changed — customers were billed
 * that amount and the record must remain accurate for audit.  The backfill only
 * populates the informational tax-breakdown columns.
 *
 * Returns a summary: { processed, skipped, errors }.
 */
router.post("/admin/invoices/backfill-tax", async (_req, res) => {
  try {
    // Find order invoices with no tax breakdown (taxAmount is null or '0')
    const untaxed = await db
      .select({
        invoiceId:  customerInvoicesTable.id,
        orderId:    customerInvoicesTable.orderId,
        subtotal:   customerInvoicesTable.subtotal,
        taxAmount:  customerInvoicesTable.taxAmount,
      })
      .from(customerInvoicesTable)
      .where(
        and(
          eq(customerInvoicesTable.source, "order"),
          sql`COALESCE(${customerInvoicesTable.taxAmount}::numeric, 0) = 0`,
        ),
      );

    let processed = 0;
    let skipped   = 0;
    const errors: Array<{ invoiceId: number; error: string }> = [];

    for (const inv of untaxed) {
      try {
        // Resolve the order's country — fall back to "SA" if unrecorded
        const countryCode = inv.orderId
          ? (await db
              .select({ countryCode: ordersTable.countryCode })
              .from(ordersTable)
              .where(eq(ordersTable.id, inv.orderId))
              .limit(1)
              .then(rows => rows[0]?.countryCode ?? "SA"))
          : "SA";

        const subtotal = Number(inv.subtotal ?? 0);
        if (subtotal <= 0) { skipped++; continue; }

        const { taxRate, taxAmount, taxName } = await calculateTax(countryCode, subtotal);

        await db
          .update(customerInvoicesTable)
          .set({
            taxRate:   String(taxRate),
            taxName,
            taxAmount: String(taxAmount),
          })
          .where(eq(customerInvoicesTable.id, inv.invoiceId));

        processed++;
      } catch (err: any) {
        errors.push({ invoiceId: inv.invoiceId, error: err?.message ?? "unknown" });
      }
    }

    res.json({ processed, skipped, errors, total: untaxed.length });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Tax backfill failed" });
  }
});

export default router;
