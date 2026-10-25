import { Router, Request, Response } from 'express';
import { Bill, BankAccount, CollectionActivity, Invoice } from '../models/ErpModels';
import { requirePermission } from '../middleware/rbacMiddleware';
import { ReconciliationService } from '../services/reconciliationService';
import { ReminderService } from '../services/reminderService';
import { InventoryValuationService, IStockReceipt, IStockIssue, ValuationMethod } from '../services/inventoryValuationService';
import { ExportForexService, IForexSettlementRequest, IYearEndRevaluationRequest } from '../services/exportForexService';

export const financeRouter = Router();

financeRouter.get('/finance/reminders', requirePermission('reports', 'view'), async (req: Request, res: Response) => {
  try {
    const { organisationId, branchId } = req.query as Record<string, string>;
    const minOverdueDays = Math.max(0, Math.min(365, Number(req.query.minOverdueDays) || 0));
    const summary = await ReminderService.getOverdueReminders(organisationId, branchId, minOverdueDays);
    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

financeRouter.get('/finance/reconciliation', requirePermission('reports', 'view'), async (req: Request, res: Response) => {
  try {
    const { organisationId, branchId } = req.query as Record<string, string>;
    const summary = await ReconciliationService.performThreeWayMatch(organisationId, branchId);
    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const agingBuckets = [
  { key: 'current', label: 'Current', min: -Infinity, max: 0 },
  { key: '1_30', label: '1–30 days', min: 1, max: 30 },
  { key: '31_60', label: '31–60 days', min: 31, max: 60 },
  { key: '61_90', label: '61–90 days', min: 61, max: 90 },
  { key: 'over_90', label: 'Over 90 days', min: 91, max: Infinity },
];

function getScopedQuery(req: Request) {
  const { organisationId, branchId, financialYear } = req.query as Record<string, string>;
  const query: Record<string, any> = {};
  if (organisationId) query.organisationId = organisationId;
  if (branchId) query.branchId = branchId;
  if (financialYear) query.financialYear = financialYear;
  return query;
}

function getOutstanding(total: number, paid: number, outstanding?: number) {
  return Math.max(0, Number(outstanding) > 0 ? Number(outstanding) : Number(total || 0) - Number(paid || 0));
}

function getDaysPastDue(dueDate: string, asOf: Date) {
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.floor((asOf.getTime() - due.getTime()) / 86_400_000);
}

function bucketFor(daysPastDue: number) {
  return agingBuckets.find((bucket) => daysPastDue >= bucket.min && daysPastDue <= bucket.max) || agingBuckets[0];
}

financeRouter.get('/finance/collection-activities', requirePermission('reports', 'view'), async (req: Request, res: Response) => {
  try {
    const activities = await CollectionActivity.find(getScopedQuery(req)).sort({ nextFollowUpDate: 1, createdAt: -1 }).limit(200);
    return res.json(activities.map((activity) => ({ ...activity.toObject(), id: activity._id.toString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

financeRouter.post('/finance/collection-activities', requirePermission('reports', 'edit'), async (req: Request, res: Response) => {
  try {
    const { documentType, documentId, documentNumber, partyName, actionType, notes, nextFollowUpDate, status } = req.body;
    if (!['INVOICE', 'BILL'].includes(documentType) || !documentId || !documentNumber || !partyName || !actionType || !notes?.trim()) {
      return res.status(400).json({ error: 'Document, action type, and follow-up notes are required.' });
    }
    const query = getScopedQuery(req);
    const activity = await CollectionActivity.create({
      documentType,
      documentId,
      documentNumber,
      partyName,
      actionType,
      notes: notes.trim(),
      nextFollowUpDate: nextFollowUpDate || '',
      status: status === 'COMPLETED' ? 'COMPLETED' : 'OPEN',
      organisationId: query.organisationId || '',
      branchId: query.branchId || '',
      financialYear: query.financialYear || '2026-2027',
      createdBy: (req as any).user?.name || (req as any).user?.email || 'Finance User',
    });
    return res.status(201).json({ ...activity.toObject(), id: activity._id.toString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

financeRouter.get('/finance/aging', requirePermission('reports', 'view'), async (req: Request, res: Response) => {
  try {
    const query = getScopedQuery(req);
    const asOf = req.query.asOf ? new Date(`${req.query.asOf}T00:00:00`) : new Date();
    if (Number.isNaN(asOf.getTime())) return res.status(400).json({ error: 'Invalid asOf date.' });

    const [invoices, bills] = await Promise.all([
      Invoice.find(query).sort({ dueDate: 1 }),
      Bill.find(query).sort({ dueDate: 1 }),
    ]);

    const receivables = agingBuckets.map((bucket) => ({ ...bucket, count: 0, amount: 0 }));
    const payables = agingBuckets.map((bucket) => ({ ...bucket, count: 0, amount: 0 }));
    const receivableRows: any[] = [];
    const payableRows: any[] = [];

    for (const invoice of invoices) {
      const amount = getOutstanding(invoice.totalAmount, invoice.paidAmount, invoice.outstandingAmount);
      if (amount <= 0 || invoice.status === 'Cancelled') continue;
      const daysPastDue = getDaysPastDue(invoice.dueDate, asOf);
      const bucket = bucketFor(daysPastDue);
      const target = receivables.find((item) => item.key === bucket.key)!;
      target.count += 1;
      target.amount += amount;
      receivableRows.push({
        id: invoice._id.toString(),
        documentNumber: invoice.invoiceNumber,
        partyName: invoice.customerName,
        dueDate: invoice.dueDate,
        daysPastDue,
        amount,
        bucket: bucket.label,
      });
    }

    for (const bill of bills) {
      const amount = getOutstanding(bill.totalAmount, bill.paidAmount, bill.outstandingAmount);
      if (amount <= 0 || bill.status === 'Cancelled') continue;
      const daysPastDue = getDaysPastDue(bill.dueDate, asOf);
      const bucket = bucketFor(daysPastDue);
      const target = payables.find((item) => item.key === bucket.key)!;
      target.count += 1;
      target.amount += amount;
      payableRows.push({
        id: bill._id.toString(),
        documentNumber: bill.billNumber,
        partyName: bill.vendorName,
        dueDate: bill.dueDate,
        daysPastDue,
        amount,
        bucket: bucket.label,
      });
    }

    return res.json({
      asOf: asOf.toISOString().slice(0, 10),
      receivables,
      payables,
      totals: {
        receivables: receivableRows.reduce((sum, row) => sum + row.amount, 0),
        payables: payableRows.reduce((sum, row) => sum + row.amount, 0),
      },
      receivableRows,
      payableRows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

financeRouter.get('/finance/cash-flow', requirePermission('reports', 'view'), async (req: Request, res: Response) => {
  try {
    const query = getScopedQuery(req);
    const horizonDays = Math.min(365, Math.max(30, Number(req.query.horizonDays) || 90));
    const asOf = req.query.asOf ? new Date(`${req.query.asOf}T00:00:00`) : new Date();
    if (Number.isNaN(asOf.getTime())) return res.status(400).json({ error: 'Invalid asOf date.' });
    const endDate = new Date(asOf);
    endDate.setDate(endDate.getDate() + horizonDays);

    const [invoices, bills, banks] = await Promise.all([
      Invoice.find(query),
      Bill.find(query),
      BankAccount.find(query),
    ]);
    const periods = Array.from({ length: Math.ceil(horizonDays / 30) }, (_, index) => {
      const start = new Date(asOf);
      start.setDate(start.getDate() + index * 30);
      const end = new Date(start);
      end.setDate(end.getDate() + 29);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), expectedInflow: 0, expectedOutflow: 0 };
    });
    const addForecast = (date: string, amount: number, direction: 'inflow' | 'outflow') => {
      const due = new Date(`${date}T00:00:00`);
      if (Number.isNaN(due.getTime()) || due < asOf || due > endDate) return;
      const index = Math.min(periods.length - 1, Math.floor((due.getTime() - asOf.getTime()) / (30 * 86_400_000)));
      periods[index][direction === 'inflow' ? 'expectedInflow' : 'expectedOutflow'] += amount;
    };
    invoices.forEach((invoice) => {
      if (invoice.status === 'Cancelled') return;
      const amount = getOutstanding(invoice.totalAmount, invoice.paidAmount, invoice.outstandingAmount);
      if (amount > 0) addForecast(invoice.dueDate, amount, 'inflow');
    });
    bills.forEach((bill) => {
      if (bill.status === 'Cancelled') return;
      const amount = getOutstanding(bill.totalAmount, bill.paidAmount, bill.outstandingAmount);
      if (amount > 0) addForecast(bill.dueDate, amount, 'outflow');
    });

    const openingCash = banks.reduce((sum, bank) => sum + Number(bank.balance || 0), 0);
    let runningCash = openingCash;
    const forecast = periods.map((period) => {
      const netFlow = period.expectedInflow - period.expectedOutflow;
      runningCash += netFlow;
      return { ...period, netFlow, projectedClosingCash: runningCash };
    });
    return res.json({ asOf: asOf.toISOString().slice(0, 10), horizonDays, openingCash, forecast });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/finance/inventory-valuation/calculate
 * Computes statutory inventory valuation and COGS under Ind AS 2 (FIFO or Moving Weighted Average)
 */
financeRouter.post(
  '/finance/inventory-valuation/calculate',
  requirePermission('reports', 'view'),
  async (req: Request, res: Response) => {
    try {
      const {
        productId,
        method = 'FIFO',
        receipts = [],
        issues = [],
        compareWithOther = true
      } = req.body as {
        productId: string;
        method?: ValuationMethod;
        receipts: IStockReceipt[];
        issues: IStockIssue[];
        compareWithOther?: boolean;
      };

      if (!productId) {
        return res.status(400).json({ error: 'productId is required.' });
      }

      let valuationResult;
      if (method === 'WEIGHTED_AVERAGE') {
        valuationResult = InventoryValuationService.calculateWeightedAverage(productId, receipts, issues);
      } else {
        valuationResult = InventoryValuationService.calculateFifo(productId, receipts, issues);
      }

      let comparisonReport;
      if (compareWithOther) {
        comparisonReport = InventoryValuationService.compareValuationMethods(productId, receipts, issues);
      }

      return res.json({
        success: true,
        productId,
        method,
        valuation: valuationResult,
        comparisonReport
      });
    } catch (err: any) {
      console.error('Error calculating inventory valuation:', err);
      return res.status(500).json({ error: 'Failed to calculate inventory valuation', details: err.message });
    }
  }
);

/**
 * POST /api/erp/finance/inventory-valuation/nrv-audit
 * Performs statutory audit under Ind AS 2 Paragraph 9 (Lower of Cost and Net Realizable Value)
 */
financeRouter.post(
  '/finance/inventory-valuation/nrv-audit',
  requirePermission('reports', 'view'),
  async (req: Request, res: Response) => {
    try {
      const {
        productId,
        productName = 'Store Inventory Item',
        closingQuantity,
        costValue,
        estimatedSellingPrice,
        estimatedCostToSell = 0,
        auditDate
      } = req.body;

      if (!productId || closingQuantity === undefined || costValue === undefined || estimatedSellingPrice === undefined) {
        return res.status(400).json({
          error: 'MISSING_PARAMETERS',
          message: 'productId, closingQuantity, costValue, and estimatedSellingPrice are required.'
        });
      }

      const auditResult = InventoryValuationService.evaluateNrvImpairment({
        productId,
        productName,
        closingQuantity: Number(closingQuantity),
        costValue: Number(costValue),
        estimatedSellingPrice: Number(estimatedSellingPrice),
        estimatedCostToSell: Number(estimatedCostToSell),
        auditDate
      });

      return res.json({
        success: true,
        audit: auditResult
      });
    } catch (err: any) {
      console.error('Error performing NRV impairment audit:', err);
      return res.status(500).json({ error: 'Failed to perform NRV audit', details: err.message });
    }
  }
);

/**
 * POST /api/erp/finance/forex/settle
 * Realizes foreign remittance and generates Ind AS 21 double-entry exchange gain/loss voucher
 */
financeRouter.post(
  '/finance/forex/settle',
  requirePermission('reports', 'view'),
  async (req: Request, res: Response) => {
    try {
      const payload = req.body as IForexSettlementRequest;
      if (!payload.invoiceNumber || !payload.receivedAmountForeign || !payload.settlementExchangeRate) {
        return res.status(400).json({ error: 'invoiceNumber, receivedAmountForeign, and settlementExchangeRate are required.' });
      }

      const settlement = ExportForexService.settleForeignRemittance(payload);
      return res.json({
        success: true,
        settlement
      });
    } catch (err: any) {
      console.error('Error settling foreign remittance:', err);
      return res.status(500).json({ error: 'Failed to settle foreign remittance', details: err.message });
    }
  }
);

/**
 * POST /api/erp/finance/forex/revalue-receivables
 * Fiscal year-end mark-to-market revaluation of open foreign trade receivables under Ind AS 21
 */
financeRouter.post(
  '/finance/forex/revalue-receivables',
  requirePermission('reports', 'view'),
  async (req: Request, res: Response) => {
    try {
      const payload = req.body as IYearEndRevaluationRequest;
      if (!payload.asOfDate || !Array.isArray(payload.openInvoices) || !payload.closingExchangeRates) {
        return res.status(400).json({ error: 'asOfDate, openInvoices array, and closingExchangeRates are required.' });
      }

      const revaluation = ExportForexService.revalueYearEndReceivables(payload);
      return res.json({
        success: true,
        revaluation
      });
    } catch (err: any) {
      console.error('Error revaluing year-end foreign receivables:', err);
      return res.status(500).json({ error: 'Failed to revalue foreign receivables', details: err.message });
    }
  }
);

