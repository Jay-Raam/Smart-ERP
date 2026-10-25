import { describe, it, expect } from 'vitest';
import { InventoryValuationService, IStockReceipt, IStockIssue } from './inventoryValuationService';

describe('InventoryValuationService (Ind AS 2 / AS 2 Compliance)', () => {
  const sampleReceipts: IStockReceipt[] = [
    {
      batchId: 'BATCH-001',
      batchNumber: 'LOT-2026-AUG-10',
      date: '2026-08-10',
      quantity: 100,
      unitCost: 500, // Base cost: 50,000
      freightAndLanding: 2000 // Total landed: 52,000 -> 520 / unit
    },
    {
      batchId: 'BATCH-002',
      batchNumber: 'LOT-2026-AUG-20',
      date: '2026-08-20',
      quantity: 150,
      unitCost: 550, // Base cost: 82,500
      freightAndLanding: 4500 // Total landed: 87,000 -> 580 / unit
    },
    {
      batchId: 'BATCH-003',
      batchNumber: 'LOT-2026-SEP-05',
      date: '2026-09-05',
      quantity: 50,
      unitCost: 600, // Base cost: 30,000
      freightAndLanding: 1500 // Total landed: 31,500 -> 630 / unit
    }
  ];

  describe('Effective Inward Cost Allocation (Ind AS 2 Para 11)', () => {
    it('should allocate inward freight and landing charges directly into unit cost', () => {
      const effCost1 = InventoryValuationService.calculateEffectiveCost(sampleReceipts[0]);
      expect(effCost1).toBe(520);

      const effCost2 = InventoryValuationService.calculateEffectiveCost(sampleReceipts[1]);
      expect(effCost2).toBe(580);

      const effCost3 = InventoryValuationService.calculateEffectiveCost(sampleReceipts[2]);
      expect(effCost3).toBe(630);
    });
  });

  describe('FIFO (First-In, First-Out) Valuation Engine', () => {
    it('should consume earliest lots first and calculate exact COGS and closing inventory', () => {
      // Total received: 100 @ 520, 150 @ 580, 50 @ 630 = 300 units (Total cost: 170,500)
      // Issue 1: 80 units on Aug 15 -> completely from BATCH-001 (80 @ 520 = 41,600)
      // Issue 2: 60 units on Aug 25 -> 20 from BATCH-001 (20 @ 520 = 10,400) + 40 from BATCH-002 (40 @ 580 = 23,200) = 33,600
      // Total issued = 140 units. Total COGS = 41,600 + 33,600 = 75,200
      // Remaining stock = 160 units (110 from BATCH-002 @ 580 = 63,800 + 50 from BATCH-003 @ 630 = 31,500) = 95,300
      const issues: IStockIssue[] = [
        { issueId: 'ISS-001', date: '2026-08-15', quantity: 80, destinationDoc: 'INV-2026-001' },
        { issueId: 'ISS-002', date: '2026-08-25', quantity: 60, destinationDoc: 'INV-2026-002' }
      ];

      const res = InventoryValuationService.calculateFifo('PROD-TI-ROD', sampleReceipts, issues);

      expect(res.closingStockQuantity).toBe(160);
      expect(res.costOfGoodsSold).toBe(75200);
      expect(res.closingStockValue).toBe(95300);
      expect(res.costOfGoodsSold + res.closingStockValue).toBe(170500); // Reconciliation sanity: COGS + Closing = Total Inward

      // Verify active lots
      expect(res.activeLots).toHaveLength(2);
      expect(res.activeLots![0].batchId).toBe('BATCH-002');
      expect(res.activeLots![0].remainingQuantity).toBe(110);
      expect(res.activeLots![1].batchId).toBe('BATCH-003');
      expect(res.activeLots![1].remainingQuantity).toBe(50);
    });
  });

  describe('Perpetual Moving Weighted Average Cost (WAC) Engine', () => {
    it('should dynamically recalculate unit cost after each receipt and issue at moving average', () => {
      // Step 1: Aug 10 Receipt: 100 @ 520. Qty=100, Val=52,000, Avg=520
      // Step 2: Aug 15 Issue: 80 units @ 520. Qty=20, Val=10,400, Avg=520 (COGS = 41,600)
      // Step 3: Aug 20 Receipt: 150 @ 580 (Val=87,000). Qty=170, Val=10,400+87,000=97,400, Avg=97400/170 = 572.9412
      // Step 4: Aug 25 Issue: 60 units @ 572.9412 = 34,376.47. Qty=110, Val=63,023.53
      // Step 5: Sep 05 Receipt: 50 @ 630 (Val=31,500). Qty=160, Val=63,023.53 + 31,500 = 94,523.53, Avg = 590.772
      const issues: IStockIssue[] = [
        { issueId: 'ISS-001', date: '2026-08-15', quantity: 80 },
        { issueId: 'ISS-002', date: '2026-08-25', quantity: 60 }
      ];

      const res = InventoryValuationService.calculateWeightedAverage('PROD-TI-ROD', sampleReceipts, issues);

      expect(res.closingStockQuantity).toBe(160);
      expect(Math.round(res.costOfGoodsSold)).toBe(75976);
      expect(Math.round(res.closingStockValue)).toBe(94524);
      expect(Math.round(res.costOfGoodsSold + res.closingStockValue)).toBe(170500);
    });
  });

  describe('FIFO vs Weighted Average Comparison', () => {
    it('should generate audit comparison highlighting valuation variance', () => {
      const issues: IStockIssue[] = [
        { issueId: 'ISS-001', date: '2026-08-15', quantity: 80 },
        { issueId: 'ISS-002', date: '2026-08-25', quantity: 60 }
      ];

      const report = InventoryValuationService.compareValuationMethods('PROD-TI-ROD', sampleReceipts, issues);

      expect(report.fifo.closingStockQuantity).toBe(report.weightedAverage.closingStockQuantity);
      // In an inflationary price environment (costs rising from 520 -> 580 -> 630), FIFO yields higher inventory valuation and lower COGS
      expect(report.differences.higherValuationMethod).toBe('FIFO');
      expect(report.differences.inventoryValueDiff).toBeGreaterThan(0);
      expect(report.differences.cogsDiff).toBeLessThan(0);
    });
  });

  describe('Ind AS 2 Paragraph 9 (Lower of Cost and Net Realizable Value Audit)', () => {
    it('should not require write-down when market Net Realizable Value exceeds carrying cost', () => {
      const audit = InventoryValuationService.evaluateNrvImpairment({
        productId: 'PROD-TI-ROD',
        productName: 'Titanium Grade-5 Rod',
        closingQuantity: 100,
        costValue: 50000, // Cost = 500 / unit
        estimatedSellingPrice: 750, // Realizable = 750 - 50 = 700 / unit -> Total NRV = 70,000
        estimatedCostToSell: 50
      });

      expect(audit.writeDownRequired).toBe(false);
      expect(audit.writeDownAmount).toBe(0);
      expect(audit.finalCarryingValue).toBe(50000);
      expect(audit.journalVoucher).toBeUndefined();
    });

    it('should enforce write-down and generate double-entry voucher when NRV drops below cost', () => {
      // Cost = 50,000 (500/unit for 100 units). Market price drops to 420, selling costs 20 -> NRV = 400/unit -> Total NRV = 40,000
      const audit = InventoryValuationService.evaluateNrvImpairment({
        productId: 'PROD-TI-ROD',
        productName: 'Titanium Grade-5 Rod',
        closingQuantity: 100,
        costValue: 50000,
        estimatedSellingPrice: 420,
        estimatedCostToSell: 20,
        auditDate: '2026-09-30'
      });

      expect(audit.writeDownRequired).toBe(true);
      expect(audit.writeDownAmount).toBe(10000); // 50,000 - 40,000
      expect(audit.finalCarryingValue).toBe(40000);
      expect(audit.journalVoucher).toBeDefined();

      const jv = audit.journalVoucher!;
      expect(jv.voucherType).toBe('JOURNAL');
      expect(jv.entries[0].account).toContain('Cost of Sales');
      expect(jv.entries[0].debit).toBe(10000);
      expect(jv.entries[1].account).toContain('Inventory Valuation Reserve');
      expect(jv.entries[1].credit).toBe(10000);
    });
  });
});
