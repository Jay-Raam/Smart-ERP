/**
 * Ind AS 2 / AS 2 Compliant Inventory Valuation Engine
 * Supports FIFO (First-In, First-Out), Perpetual Moving Weighted Average Cost (WAC),
 * and Paragraph 9 "Lower of Cost and Net Realizable Value (NRV)" impairment auditing.
 */

export type ValuationMethod = 'FIFO' | 'WEIGHTED_AVERAGE';

export interface IStockReceipt {
  batchId: string;
  batchNumber?: string;
  date: string; // ISO or YYYY-MM-DD
  quantity: number;
  unitCost: number; // Base purchase price per unit
  freightAndLanding?: number; // Inward freight, customs, handling charges
  effectiveUnitCost?: number;
}

export interface IStockIssue {
  issueId: string;
  date: string;
  quantity: number;
  destinationDoc?: string; // e.g., Invoice # or Production WO #
}

export interface IFifoLot {
  batchId: string;
  batchNumber?: string;
  receivedDate: string;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number; // Effective cost per unit including landing
  totalValue: number;
}

export interface IConsumedLotDetail {
  batchId: string;
  batchNumber?: string;
  quantity: number;
  unitCost: number;
  value: number;
}

export interface IStockIssueResult {
  issueId: string;
  date: string;
  quantity: number;
  cogs: number;
  consumedLots: IConsumedLotDetail[];
  destinationDoc?: string;
}

export interface IValuationSummary {
  productId: string;
  method: ValuationMethod;
  totalReceivedQuantity: number;
  totalIssuedQuantity: number;
  closingStockQuantity: number;
  closingStockValue: number;
  costOfGoodsSold: number;
  effectiveAverageUnitCost: number;
  activeLots?: IFifoLot[];
  issueBreakdown?: IStockIssueResult[];
}

export interface IMethodComparisonReport {
  productId: string;
  fifo: {
    closingStockQuantity: number;
    closingStockValue: number;
    costOfGoodsSold: number;
    effectiveAverageCost: number;
  };
  weightedAverage: {
    closingStockQuantity: number;
    closingStockValue: number;
    costOfGoodsSold: number;
    effectiveAverageCost: number;
  };
  differences: {
    inventoryValueDiff: number; // FIFO - WeightedAverage
    cogsDiff: number; // FIFO - WeightedAverage
    higherValuationMethod: ValuationMethod | 'EQUAL';
  };
}

export interface INrvAuditResult {
  productId: string;
  productName: string;
  closingQuantity: number;
  costValue: number;
  costPerUnit: number;
  estimatedSellingPrice: number;
  estimatedCostToSell: number;
  nrvPerUnit: number;
  totalNrv: number;
  valuationRule: 'LOWER_OF_COST_AND_NRV';
  finalCarryingValue: number;
  writeDownRequired: boolean;
  writeDownAmount: number;
  journalVoucher?: {
    voucherType: 'JOURNAL';
    voucherNumber: string;
    narration: string;
    date: string;
    entries: Array<{
      account: string;
      debit: number;
      credit: number;
    }>;
  };
}

export class InventoryValuationService {
  /**
   * Calculate effective unit cost including direct landed costs (freight, duties, handling)
   * as required by Ind AS 2, Paragraph 11.
   */
  public static calculateEffectiveCost(receipt: IStockReceipt): number {
    if (receipt.quantity <= 0) return 0;
    const landing = receipt.freightAndLanding || 0;
    const totalCost = (receipt.quantity * receipt.unitCost) + landing;
    return Math.round((totalCost / receipt.quantity) * 10000) / 10000;
  }

  /**
   * FIFO (First-In, First-Out) Valuation Engine
   * Chronologically consumes earliest available receipt lots.
   * Closing inventory is valued at the prices of the most recent purchases.
   */
  public static calculateFifo(
    productId: string,
    receipts: IStockReceipt[],
    issues: IStockIssue[]
  ): IValuationSummary {
    // 1. Sort receipts chronologically
    const sortedReceipts = [...receipts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 2. Initialize FIFO lot queue
    const lotQueue: IFifoLot[] = sortedReceipts.map(r => {
      const effCost = this.calculateEffectiveCost(r);
      return {
        batchId: r.batchId,
        batchNumber: r.batchNumber || r.batchId,
        receivedDate: r.date,
        originalQuantity: r.quantity,
        remainingQuantity: r.quantity,
        unitCost: effCost,
        totalValue: Math.round(r.quantity * effCost * 100) / 100
      };
    });

    // 3. Sort issues chronologically
    const sortedIssues = [...issues].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let totalCogs = 0;
    const issueResults: IStockIssueResult[] = [];

    // 4. Consume from queue for each issuance
    for (const issue of sortedIssues) {
      let needed = issue.quantity;
      let issueCogs = 0;
      const consumedLots: IConsumedLotDetail[] = [];

      for (const lot of lotQueue) {
        if (needed <= 0) break;
        if (lot.remainingQuantity <= 0) continue;

        const take = Math.min(lot.remainingQuantity, needed);
        const lotValue = Math.round(take * lot.unitCost * 100) / 100;

        lot.remainingQuantity -= take;
        lot.totalValue = Math.round(lot.remainingQuantity * lot.unitCost * 100) / 100;
        needed -= take;
        issueCogs += lotValue;

        consumedLots.push({
          batchId: lot.batchId,
          batchNumber: lot.batchNumber,
          quantity: take,
          unitCost: lot.unitCost,
          value: lotValue
        });
      }

      totalCogs += issueCogs;
      issueResults.push({
        issueId: issue.issueId,
        date: issue.date,
        quantity: issue.quantity,
        cogs: Math.round(issueCogs * 100) / 100,
        consumedLots,
        destinationDoc: issue.destinationDoc
      });
    }

    // 5. Active lots with remaining quantity
    const activeLots = lotQueue.filter(l => l.remainingQuantity > 0);
    const closingStockQuantity = activeLots.reduce((acc, l) => acc + l.remainingQuantity, 0);
    const closingStockValue = Math.round(activeLots.reduce((acc, l) => acc + l.totalValue, 0) * 100) / 100;
    const totalReceivedQuantity = receipts.reduce((acc, r) => acc + r.quantity, 0);
    const totalIssuedQuantity = issues.reduce((acc, i) => acc + i.quantity, 0);

    const avgUnitCost = closingStockQuantity > 0
      ? Math.round((closingStockValue / closingStockQuantity) * 100) / 100
      : 0;

    return {
      productId,
      method: 'FIFO',
      totalReceivedQuantity,
      totalIssuedQuantity,
      closingStockQuantity,
      closingStockValue,
      costOfGoodsSold: Math.round(totalCogs * 100) / 100,
      effectiveAverageUnitCost: avgUnitCost,
      activeLots,
      issueBreakdown: issueResults
    };
  }

  /**
   * Perpetual Moving Weighted Average Cost (WAC) Engine
   * Dynamically recalculates unit cost upon every inward receipt.
   * Outward stock is issued at the prevailing weighted average rate.
   */
  public static calculateWeightedAverage(
    productId: string,
    receipts: IStockReceipt[],
    issues: IStockIssue[]
  ): IValuationSummary {
    // Combine receipts and issues into a timeline
    type TimelineEvent = 
      | { type: 'RECEIPT'; date: string; data: IStockReceipt }
      | { type: 'ISSUE'; date: string; data: IStockIssue };

    const events: TimelineEvent[] = [
      ...receipts.map(r => ({ type: 'RECEIPT' as const, date: r.date, data: r })),
      ...issues.map(i => ({ type: 'ISSUE' as const, date: i.date, data: i }))
    ];

    // Sort chronologically. When dates match, receipts process before issues.
    events.sort((a, b) => {
      const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.type === 'RECEIPT' ? -1 : 1;
    });

    let currentQty = 0;
    let currentValue = 0;
    let currentAvgCost = 0;
    let totalCogs = 0;
    const issueResults: IStockIssueResult[] = [];

    for (const event of events) {
      if (event.type === 'RECEIPT') {
        const r = event.data;
        const effCost = this.calculateEffectiveCost(r);
        const receiptValue = r.quantity * effCost;

        currentQty += r.quantity;
        currentValue += receiptValue;
        currentAvgCost = currentQty > 0 ? currentValue / currentQty : 0;
      } else {
        const i = event.data;
        const issueQty = i.quantity;
        const issueCogs = issueQty * currentAvgCost;

        totalCogs += issueCogs;
        currentQty = Math.max(0, currentQty - issueQty);
        currentValue = currentQty * currentAvgCost;

        issueResults.push({
          issueId: i.issueId,
          date: i.date,
          quantity: issueQty,
          cogs: Math.round(issueCogs * 100) / 100,
          consumedLots: [
            {
              batchId: 'WEIGHTED_AVG_POOL',
              batchNumber: 'WAC-POOL',
              quantity: issueQty,
              unitCost: Math.round(currentAvgCost * 10000) / 10000,
              value: Math.round(issueCogs * 100) / 100
            }
          ],
          destinationDoc: i.destinationDoc
        });
      }
    }

    const totalReceivedQuantity = receipts.reduce((acc, r) => acc + r.quantity, 0);
    const totalIssuedQuantity = issues.reduce((acc, i) => acc + i.quantity, 0);

    return {
      productId,
      method: 'WEIGHTED_AVERAGE',
      totalReceivedQuantity,
      totalIssuedQuantity,
      closingStockQuantity: currentQty,
      closingStockValue: Math.round(currentValue * 100) / 100,
      costOfGoodsSold: Math.round(totalCogs * 100) / 100,
      effectiveAverageUnitCost: Math.round(currentAvgCost * 100) / 100,
      issueBreakdown: issueResults
    };
  }

  /**
   * Compare FIFO vs Weighted Average Costing
   * Yields statutory variances in closing stock values and gross profit impact.
   */
  public static compareValuationMethods(
    productId: string,
    receipts: IStockReceipt[],
    issues: IStockIssue[]
  ): IMethodComparisonReport {
    const fifo = this.calculateFifo(productId, receipts, issues);
    const wac = this.calculateWeightedAverage(productId, receipts, issues);

    const inventoryValueDiff = Math.round((fifo.closingStockValue - wac.closingStockValue) * 100) / 100;
    const cogsDiff = Math.round((fifo.costOfGoodsSold - wac.costOfGoodsSold) * 100) / 100;

    let higherValuationMethod: ValuationMethod | 'EQUAL' = 'EQUAL';
    if (inventoryValueDiff > 0) higherValuationMethod = 'FIFO';
    else if (inventoryValueDiff < 0) higherValuationMethod = 'WEIGHTED_AVERAGE';

    return {
      productId,
      fifo: {
        closingStockQuantity: fifo.closingStockQuantity,
        closingStockValue: fifo.closingStockValue,
        costOfGoodsSold: fifo.costOfGoodsSold,
        effectiveAverageCost: fifo.effectiveAverageUnitCost
      },
      weightedAverage: {
        closingStockQuantity: wac.closingStockQuantity,
        closingStockValue: wac.closingStockValue,
        costOfGoodsSold: wac.costOfGoodsSold,
        effectiveAverageCost: wac.effectiveAverageUnitCost
      },
      differences: {
        inventoryValueDiff,
        cogsDiff,
        higherValuationMethod
      }
    };
  }

  /**
   * Ind AS 2, Paragraph 9: Lower of Cost and Net Realizable Value (NRV) Audit
   * 
   * NRV = Estimated Selling Price in ordinary course of business less estimated costs to complete and sell.
   * If Cost > NRV, inventory is written down to NRV.
   * Generates automated double-entry accounting journal entries for general ledger posting.
   */
  public static evaluateNrvImpairment(params: {
    productId: string;
    productName: string;
    closingQuantity: number;
    costValue: number;
    estimatedSellingPrice: number;
    estimatedCostToSell?: number;
    auditDate?: string;
  }): INrvAuditResult {
    const costToSell = params.estimatedCostToSell || 0;
    const nrvPerUnit = Math.max(0, params.estimatedSellingPrice - costToSell);
    const totalNrv = Math.round(params.closingQuantity * nrvPerUnit * 100) / 100;
    const costPerUnit = params.closingQuantity > 0 
      ? Math.round((params.costValue / params.closingQuantity) * 100) / 100 
      : 0;

    const writeDownRequired = params.costValue > totalNrv;
    const writeDownAmount = writeDownRequired 
      ? Math.round((params.costValue - totalNrv) * 100) / 100 
      : 0;

    const finalCarryingValue = Math.min(params.costValue, totalNrv);
    const dateStr = params.auditDate || new Date().toISOString().split('T')[0];

    let journalVoucher: INrvAuditResult['journalVoucher'];
    if (writeDownRequired) {
      const voucherNum = `JV-NRV-${dateStr.replace(/-/g, '')}-${params.productId.slice(-4)}`;
      journalVoucher = {
        voucherType: 'JOURNAL',
        voucherNumber: voucherNum,
        date: dateStr,
        narration: `Ind AS 2 Inventory Write-Down: ${params.productName} carrying cost (₹${params.costValue.toLocaleString('en-IN')}) adjusted to Net Realizable Value (₹${totalNrv.toLocaleString('en-IN')}) due to market realization drop.`,
        entries: [
          {
            account: 'Cost of Sales - Inventory Write-Down Loss (Ind AS 2)',
            debit: writeDownAmount,
            credit: 0
          },
          {
            account: 'Inventory Valuation Reserve / Stock-in-Hand',
            debit: 0,
            credit: writeDownAmount
          }
        ]
      };
    }

    return {
      productId: params.productId,
      productName: params.productName,
      closingQuantity: params.closingQuantity,
      costValue: params.costValue,
      costPerUnit,
      estimatedSellingPrice: params.estimatedSellingPrice,
      estimatedCostToSell: costToSell,
      nrvPerUnit,
      totalNrv,
      valuationRule: 'LOWER_OF_COST_AND_NRV',
      finalCarryingValue,
      writeDownRequired,
      writeDownAmount,
      journalVoucher
    };
  }
}
