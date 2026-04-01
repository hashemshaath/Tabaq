/**
 * Centralized Invoice Service
 *
 * All financial transactions on the Tabaq platform must flow through this service.
 * Handles: customer invoices, financial transaction ledger, points awarding.
 *
 * Usage:
 *   import { invoiceService } from "../services/invoiceService.js";
 *   await invoiceService.processOrder({ order, userId, restaurantId });
 */

import { db } from "@workspace/db";
import {
  customerInvoicesTable,
  transactionsTable,
  contractsTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateRefCode } from "../lib/refcode.js";
import { awardPoints, POINTS, logPointsTransaction } from "../lib/points.js";
import { initiatePayment } from "../lib/paymentGateway.js";
import { notifyAsync } from "../lib/notify.js";

// Must stay in sync with POINTS_PER_SAR in routes/orders.ts
const POINTS_PER_SAR = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderInvoiceParams {
  orderId: number;
  userId: number | null;
  restaurantId: number | null;
  items: Array<{
    nameEn: string;
    nameAr: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount?: number;
  taxRate?: number;
  taxName?: string;
  total: number;
  currency: string;
  paymentMethod: string;
  promoCode?: string | null;
  // Points breakdown — populated when paymentMethod is 'points' or 'hybrid'
  pointsUsed?: number;
  pointsMonetaryValue?: number;
}

export interface BookingInvoiceParams {
  bookingId: number;
  userId: number;
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
  partySize: number;
  date: string;
  time: string;
  total: number;
  currency: string;
  paymentMethod?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class InvoiceService {
  /**
   * Process a placed order: create customer invoice, log financial transaction,
   * and award loyalty points. Call immediately after order insert.
   */
  async processOrder(params: OrderInvoiceParams): Promise<{ invoiceRef: string }> {
    const {
      orderId, userId, restaurantId, items,
      subtotal, discountAmount, deliveryFee,
      taxAmount = 0, taxRate = 0, taxName = "VAT",
      total, currency, paymentMethod, promoCode,
      pointsUsed = 0, pointsMonetaryValue = 0,
    } = params;

    const lineItems: Array<{
      description: string;
      descriptionAr: string;
      qty: number;
      unitPrice: number;
      total: number;
    }> = items.map(item => ({
      description: item.nameEn,
      descriptionAr: item.nameAr,
      qty: item.qty,
      unitPrice: item.price,
      total: item.qty * item.price,
    }));

    // Add a credit line for any points redeemed so the invoice breakdown is transparent
    if (pointsUsed > 0) {
      lineItems.push({
        description: `Points Redeemed (${pointsUsed} pts @ ${POINTS_PER_SAR} pts/SAR)`,
        descriptionAr: `نقاط مستردة (${pointsUsed} نقطة بمعدل ${POINTS_PER_SAR} نقطة/ريال)`,
        qty: 1,
        unitPrice: -pointsMonetaryValue,
        total: -pointsMonetaryValue,
      });
    }

    // 'hybrid' orders: points cover part of the total; the remainder is charged to the card.
    // 'points' orders: fully covered by points; no card charge.
    // For both cases, `total` already reflects only the amount to be charged to the card.
    const remainingAmountCharged = total;

    // 1. Create customer invoice (receipt)
    const [inv] = await db
      .insert(customerInvoicesTable)
      .values({
        refCode: "PENDING",
        userId: userId ?? undefined,
        restaurantId: restaurantId ?? undefined,
        source: "order",
        orderId,
        lineItems,
        subtotal: String(subtotal),
        discountAmount: String(discountAmount),
        deliveryFee: String(deliveryFee),
        taxAmount: String(taxAmount),
        taxRate: String(taxRate),
        taxName,
        total: String(total),
        currency,
        paymentMethod,
        promoCode: promoCode ?? null,
        // Points breakdown — non-zero only for 'points' and 'hybrid' payment methods
        pointsUsed,
        pointsMonetaryValue: String(pointsMonetaryValue),
        remainingAmountCharged: String(remainingAmountCharged),
        status: "paid",
      })
      .returning();

    const invoiceRef = generateRefCode("CINV", inv!.id);
    await db
      .update(customerInvoicesTable)
      .set({ refCode: invoiceRef })
      .where(eq(customerInvoicesTable.id, inv!.id));

    // 2. Initiate payment via the configured gateway and store the raw response.
    //    Only runs for card-based payment methods (not cash, points, free, etc.).
    //    Any gateway failure is non-critical — the invoice already exists.
    // 'hybrid' is included: the `total` passed in already has points subtracted,
    // so only the card-payable remainder is charged — no double-billing risk.
    const CARD_METHODS = new Set(["card", "credit_card", "debit_card", "online", "hyperpay", "stripe", "hybrid"]);
    if (CARD_METHODS.has(paymentMethod.toLowerCase())) {
      try {
        const gatewayResult = await initiatePayment({
          amount: total,
          currency,
          orderId: String(orderId),
          description: `Order #${orderId}`,
        });

        // Persist the raw gateway response verbatim — used for audit and dispute evidence.
        if (gatewayResult.rawResponse) {
          await db
            .update(customerInvoicesTable)
            .set({ gatewayResponse: gatewayResult.rawResponse })
            .where(eq(customerInvoicesTable.id, inv!.id));
        }

        // Trigger 2: Payment successful — notify customer with receipt reference.
        // Trigger 3: Payment failed  — prompt customer to retry / update payment method.
        if (userId) {
          if (gatewayResult.success) {
            notifyAsync({
              userId,
              type: "payment_success",
              titleEn: "Payment Successful",
              titleAr: "تمت عملية الدفع بنجاح",
              bodyEn: `Your payment of ${total} ${currency} was processed successfully. Receipt: ${invoiceRef}.`,
              bodyAr: `تمت معالجة دفعتك البالغة ${total} ${currency} بنجاح. الفاتورة: ${invoiceRef}.`,
              refId: orderId,
              refType: "order",
              metadata: { invoiceRef, transactionId: gatewayResult.transactionId },
            });
          } else {
            notifyAsync({
              userId,
              type: "payment_failed",
              titleEn: "Payment Failed",
              titleAr: "فشل الدفع",
              bodyEn: `Your payment for order #${orderId} could not be processed. Please update your payment method and try again.`,
              bodyAr: `تعذّر معالجة دفعتك للطلب #${orderId}. يرجى تحديث طريقة الدفع والمحاولة مرة أخرى.`,
              refId: orderId,
              refType: "order",
              metadata: { errorCode: gatewayResult.errorCode },
            });
          }
        }
      } catch {
        // Non-critical: gateway call failure should not block order confirmation
      }
    }

    // 3. Log financial transaction (ledger) — only for orders with active contract
    if (restaurantId) {
      try {
        const [contract] = await db
          .select({ id: contractsTable.id, commissionPercent: contractsTable.commissionPercent })
          .from(contractsTable)
          .where(
            and(
              eq(contractsTable.restaurantId, restaurantId),
              eq(contractsTable.status, "active"),
            ),
          )
          .limit(1);

        const commissionPct = Number(contract?.commissionPercent ?? 15);
        const commissionAmt = (total * commissionPct) / 100;
        const netAmt = total - commissionAmt;

        const [tx] = await db
          .insert(transactionsTable)
          .values({
            refCode: "PENDING",
            type: "order",
            status: "completed",
            grossAmount: String(total),
            commissionPercent: String(commissionPct),
            commissionAmount: String(commissionAmt.toFixed(2)),
            netAmount: String(netAmt.toFixed(2)),
            currency,
            restaurantId,
            userId: userId ?? undefined,
            contractId: contract?.id ?? undefined,
            notes: `Order #${orderId} via ${paymentMethod}`,
          })
          .returning();

        const txRef = generateRefCode("TXN", tx!.id);
        await db
          .update(transactionsTable)
          .set({ refCode: txRef })
          .where(eq(transactionsTable.id, tx!.id));
      } catch {
        // Non-critical: transaction log failure should not block the order
      }
    }

    // 3. Award loyalty points proportional to spend (10 pts per 100 SAR)
    if (userId) {
      const pointsEarned = Math.max(1, Math.floor(total / 10));
      try {
        await awardPoints(userId, pointsEarned);
        await logPointsTransaction(userId, "order_placed", pointsEarned, orderId, "order",
          `Earned ${pointsEarned} pts for order #${orderId}`);
      } catch {
        // Non-critical: points failure should not block the order
      }
    }

    return { invoiceRef };
  }

  /**
   * Process a completed booking: create customer invoice and award loyalty points.
   * Call after booking is confirmed (not just placed).
   */
  async processBooking(params: BookingInvoiceParams): Promise<{ invoiceRef: string }> {
    const {
      bookingId, userId, restaurantId,
      restaurantNameEn, restaurantNameAr,
      partySize, date, time,
      total, currency, paymentMethod,
    } = params;

    const lineItems = [{
      description: `Table reservation at ${restaurantNameEn} — ${date} ${time} (${partySize} guests)`,
      descriptionAr: `حجز طاولة في ${restaurantNameAr} — ${date} ${time} (${partySize} ضيوف)`,
      qty: 1,
      unitPrice: total,
      total,
    }];

    const [inv] = await db
      .insert(customerInvoicesTable)
      .values({
        refCode: "PENDING",
        userId,
        restaurantId,
        source: "booking",
        bookingId,
        lineItems,
        subtotal: String(total),
        discountAmount: "0",
        deliveryFee: "0",
        taxAmount: "0",
        taxRate: "0",
        taxName: "VAT",
        total: String(total),
        currency,
        paymentMethod: paymentMethod ?? "free",
        status: "paid",
      })
      .returning();

    const invoiceRef = generateRefCode("CINV", inv!.id);
    await db
      .update(customerInvoicesTable)
      .set({ refCode: invoiceRef })
      .where(eq(customerInvoicesTable.id, inv!.id));

    return { invoiceRef };
  }

  /**
   * Retrieve a customer invoice by its refCode.
   */
  async getByRef(refCode: string): Promise<typeof customerInvoicesTable.$inferSelect | null> {
    const [inv] = await db
      .select()
      .from(customerInvoicesTable)
      .where(eq(customerInvoicesTable.refCode, refCode))
      .limit(1);
    return inv ?? null;
  }

  /**
   * Retrieve all invoices for a user, newest first.
   */
  async getForUser(userId: number, limit = 20) {
    return db
      .select()
      .from(customerInvoicesTable)
      .where(eq(customerInvoicesTable.userId, userId))
      .orderBy(desc(customerInvoicesTable.createdAt))
      .limit(limit);
  }

  /**
   * Void a customer invoice (e.g. on cancellation/refund).
   */
  async voidInvoice(refCode: string): Promise<void> {
    await db
      .update(customerInvoicesTable)
      .set({ status: "void" })
      .where(eq(customerInvoicesTable.refCode, refCode));
  }

  /**
   * Mark a customer invoice as refunded.
   */
  async refundInvoice(refCode: string): Promise<void> {
    await db
      .update(customerInvoicesTable)
      .set({ status: "refunded" })
      .where(eq(customerInvoicesTable.refCode, refCode));
  }
}

export const invoiceService = new InvoiceService();
