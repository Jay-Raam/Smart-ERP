import { Bill, PurchaseOrder, StoreItem, IBill, IPurchaseOrder } from '../models/ErpModels';

export interface IItemVariance {
  itemName: string;
  poQty: number;
  billQty: number;
  receivedQty: number;
  poUnitPrice: number;
  billUnitPrice: number;
  rateVariance: number;
  qtyVariance: number;
  status: 'MATCHED' | 'RATE_MISMATCH' | 'QTY_MISMATCH' | 'BOTH_MISMATCH';
}

export interface IReconciliationMatch {
  billId: string;
  billNumber: string;
  poId?: string;
  poNumber?: string;
  vendorName: string;
  billDate: string;
  billTotal: number;
  poTotal?: number;
  totalVariance: number;
  overallStatus: 'PERFECT_MATCH' | 'PRICE_DISCREPANCY' | 'QTY_DISCREPANCY' | 'UNMATCHED_NO_PO' | 'OVERBILLED';
  variances: IItemVariance[];
  actionRecommendation: string;
}

export interface IReconciliationSummary {
  totalBillsAudited: number;
  perfectMatches: number;
  discrepanciesCount: number;
  unmatchedCount: number;
  totalVarianceAmount: number;
  matches: IReconciliationMatch[];
}

export class ReconciliationService {
  /**
   * Perform 2-Way and 3-Way matching between Vendor Bills, Purchase Orders, and Inward Store Stock
   */
  static async performThreeWayMatch(
    organisationId?: string,
    branchId?: string
  ): Promise<IReconciliationSummary> {
    const billFilter: Record<string, any> = {};
    if (organisationId) billFilter.organisationId = organisationId;
    if (branchId) billFilter.branchId = branchId;

    const bills = await Bill.find(billFilter).sort({ billDate: -1 }).lean();

    const matches: IReconciliationMatch[] = [];
    let perfectMatches = 0;
    let discrepanciesCount = 0;
    let unmatchedCount = 0;
    let totalVarianceAmount = 0;

    for (const bill of bills) {
      // Find matching Purchase Order by poId or poNumber
      let po: any = null;
      if (bill.poId) {
        po = await PurchaseOrder.findById(bill.poId).lean();
      }
      if (!po && bill.poNumber) {
        po = await PurchaseOrder.findOne({ poNumber: bill.poNumber }).lean();
      }
      if (!po && bill.vendorName) {
        // Fallback: match open PO with same vendor within +/- 15% amount
        po = await PurchaseOrder.findOne({
          vendorName: bill.vendorName,
          status: { $in: ['APPROVED', 'PARTIALLY_BILLED', 'DRAFT'] },
        }).lean();
      }

      if (!po) {
        unmatchedCount++;
        matches.push({
          billId: bill._id.toString(),
          billNumber: bill.billNumber,
          vendorName: bill.vendorName,
          billDate: bill.billDate,
          billTotal: bill.totalAmount,
          totalVariance: bill.totalAmount,
          overallStatus: 'UNMATCHED_NO_PO',
          variances: [],
          actionRecommendation: 'Flag for manual review: No linked Purchase Order found for this Vendor Bill.',
        });
        continue;
      }

      // Check item-level variances (3-Way comparison)
      const variances: IItemVariance[] = [];
      let hasRateMismatch = false;
      let hasQtyMismatch = false;

      for (const billItem of bill.items || []) {
        const billProductName = (billItem as any).productName || (billItem as any).name || '';
        const matchingPoItem = (po.items || []).find(
          (pi: any) =>
            (pi.productName || pi.name)?.toLowerCase().trim() === billProductName.toLowerCase().trim() ||
            (pi.productId && pi.productId === billItem.productId)
        );

        const poQty = matchingPoItem ? matchingPoItem.quantity : 0;
        const poRate = matchingPoItem ? matchingPoItem.unitPrice : 0;
        const billQty = billItem.quantity;
        const billRate = billItem.unitPrice;

        // Inward received check: query store inventory linked to this bill/PO
        const storeRecord = await StoreItem.findOne({
          productName: new RegExp(`^${billProductName}$`, 'i'),
        }).lean();
        const receivedQty = storeRecord ? Math.min(storeRecord.availableStock, billQty) : billQty;

        const rateDiff = billRate - poRate;
        const qtyDiff = billQty - poQty;

        let itemStatus: IItemVariance['status'] = 'MATCHED';
        if (Math.abs(rateDiff) > 0.01 && Math.abs(qtyDiff) > 0.01) {
          itemStatus = 'BOTH_MISMATCH';
          hasRateMismatch = true;
          hasQtyMismatch = true;
        } else if (Math.abs(rateDiff) > 0.01) {
          itemStatus = 'RATE_MISMATCH';
          hasRateMismatch = true;
        } else if (Math.abs(qtyDiff) > 0.01) {
          itemStatus = 'QTY_MISMATCH';
          hasQtyMismatch = true;
        }

        variances.push({
          itemName: billProductName,
          poQty,
          billQty,
          receivedQty,
          poUnitPrice: poRate,
          billUnitPrice: billRate,
          rateVariance: rateDiff,
          qtyVariance: qtyDiff,
          status: itemStatus,
        });
      }

      const totalVariance = bill.totalAmount - po.totalAmount;
      totalVarianceAmount += Math.abs(totalVariance);

      let overallStatus: IReconciliationMatch['overallStatus'] = 'PERFECT_MATCH';
      let actionRecommendation = 'Approved: Bill perfectly matches authorized Purchase Order and inward records.';

      if (totalVariance > 5) {
        overallStatus = 'OVERBILLED';
        discrepanciesCount++;
        actionRecommendation = `Flag Dispute: Vendor Bill exceeds authorized PO amount by ₹${Math.round(totalVariance).toLocaleString('en-IN')}. Request revised invoice.`;
      } else if (hasRateMismatch) {
        overallStatus = 'PRICE_DISCREPANCY';
        discrepanciesCount++;
        actionRecommendation = 'Price Mismatch: Unit rates differ from negotiated Purchase Order terms. Withhold payment until credit note is issued.';
      } else if (hasQtyMismatch) {
        overallStatus = 'QTY_DISCREPANCY';
        discrepanciesCount++;
        actionRecommendation = 'Quantity Mismatch: Billed quantities exceed received quantities. Adjust bill line items to match inward delivery.';
      } else {
        perfectMatches++;
      }

      matches.push({
        billId: bill._id.toString(),
        billNumber: bill.billNumber,
        poId: po._id.toString(),
        poNumber: po.poNumber,
        vendorName: bill.vendorName,
        billDate: bill.billDate,
        billTotal: bill.totalAmount,
        poTotal: po.totalAmount,
        totalVariance,
        overallStatus,
        variances,
        actionRecommendation,
      });
    }

    return {
      totalBillsAudited: bills.length,
      perfectMatches,
      discrepanciesCount,
      unmatchedCount,
      totalVarianceAmount: Math.round(totalVarianceAmount),
      matches,
    };
  }

  /**
   * Format matching results into an executive Markdown report for AI chat
   */
  static formatReconciliationMarkdown(summary: IReconciliationSummary): string {
    const lines: string[] = [];
    lines.push('### 🔍 2-Way & 3-Way Billing Reconciliation Audit');
    lines.push('');
    lines.push(`| Audit Metric | Count / Value | Status |`);
    lines.push(`| :--- | :--- | :--- |`);
    lines.push(`| **Total Vendor Bills Audited** | **${summary.totalBillsAudited} Bills** | Full Portfolio |`);
    lines.push(`| **Perfect 3-Way Matches** | **${summary.perfectMatches} Bills** | ✅ Approved for Payment |`);
    lines.push(`| **Billing Discrepancies** | **${summary.discrepanciesCount} Bills** | ⚠️ Variances Flagged |`);
    lines.push(`| **Unlinked / Direct Bills** | **${summary.unmatchedCount} Bills** | ℹ️ No Linked PO |`);
    lines.push(`| **Total Variance Exposure** | **₹${summary.totalVarianceAmount.toLocaleString('en-IN')}** | Financial Risk Guarded |`);
    lines.push('');

    if (summary.matches.length > 0) {
      lines.push('#### Recent Bill Discrepancy Breakdown:');
      for (const m of summary.matches.slice(0, 4)) {
        const badge =
          m.overallStatus === 'PERFECT_MATCH'
            ? '✅ MATCHED'
            : m.overallStatus === 'OVERBILLED'
            ? '🚨 OVERBILLED'
            : m.overallStatus === 'PRICE_DISCREPANCY'
            ? '⚠️ RATE MISMATCH'
            : m.overallStatus === 'QTY_DISCREPANCY'
            ? '⚠️ QTY MISMATCH'
            : 'ℹ️ DIRECT BILL';

        lines.push(`- **${m.billNumber}** (${m.vendorName}) — **${badge}**`);
        lines.push(`  - Billed: ₹${m.billTotal.toLocaleString('en-IN')}${m.poTotal ? ` | PO Ref: ${m.poNumber} (₹${m.poTotal.toLocaleString('en-IN')})` : ''}`);
        lines.push(`  - *Action*: ${m.actionRecommendation}`);
        if (m.variances.length > 0) {
          for (const v of m.variances) {
            if (v.status !== 'MATCHED') {
              lines.push(`    - Item \`${v.itemName}\`: PO Rate ₹${v.poUnitPrice} vs Bill Rate ₹${v.billUnitPrice} | PO Qty ${v.poQty} vs Bill Qty ${v.billQty}`);
            }
          }
        }
      }
    }

    return lines.join('\n');
  }
}
