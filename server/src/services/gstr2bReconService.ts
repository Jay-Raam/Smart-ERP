import { IBill } from '../models/ErpModels';

export interface Gstr2bLineItem {
  num?: number;
  txval: number;
  rt: number;
  iamt?: number;
  camt?: number;
  samt?: number;
  csamt?: number;
}

export interface Gstr2bInvoice {
  inum: string;
  idt: string;
  val: number;
  pos?: string;
  itcavl?: 'Y' | 'N';
  itms: Gstr2bLineItem[];
}

export interface Gstr2bSupplierGroup {
  ctin: string;
  trdnm?: string;
  inv: Gstr2bInvoice[];
}

export interface Gstr2bGovtPayload {
  gstin: string;
  fp: string;
  data: {
    b2b?: Gstr2bSupplierGroup[];
  };
}

export type ItcMatchStatus = 
  | 'MATCHED'
  | 'MISSING_IN_2B'
  | 'MISSING_IN_BOOKS'
  | 'TAX_AMOUNT_MISMATCH'
  | 'INELIGIBLE_ITC';

export interface ItcReconciliationResultItem {
  billNumber: string;
  supplierGstin: string;
  supplierName?: string;
  billDate?: string;
  bookTaxableValue: number;
  bookTaxAmount: number;
  gstr2bTaxableValue: number;
  gstr2bTaxAmount: number;
  taxableDiff: number;
  taxDiff: number;
  matchStatus: ItcMatchStatus;
  statusReason: string;
  isItcClaimable: boolean;
}

export interface Gstr2bReconSummary {
  taxPeriod: string;
  totalBillsAudited: number;
  totalGstr2bInvoices: number;
  matchedCount: number;
  missingIn2bCount: number;
  missingInBooksCount: number;
  mismatchCount: number;
  totalEligibleItc: number;
  totalItcAtRisk: number;
  unrecordedItcOpportunity: number;
  complianceConfidenceScore: number; // 0 - 100%
  items: ItcReconciliationResultItem[];
}

export class Gstr2bReconService {
  /**
   * Normalizes document numbers for robust comparison (e.g. 'INV/2026/01' -> 'INV202601').
   */
  static normalizeDocNumber(docNo: string): string {
    return (docNo || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Reconciles recorded purchase bills against government GSTR-2B data.
   */
  static reconcile(
    bills: IBill[],
    gstr2bData: Gstr2bGovtPayload,
    toleranceRupees = 2.0
  ): Gstr2bReconSummary {
    const results: ItcReconciliationResultItem[] = [];

    // Map GSTR-2B invoices by: normalizedSupplierGstin + '_' + normalizedInum
    interface Gstr2bIndexedRecord {
      supplierGstin: string;
      supplierName: string;
      invoice: Gstr2bInvoice;
      matched: boolean;
    }

    const gstr2bIndex = new Map<string, Gstr2bIndexedRecord>();
    const supplierGroups = gstr2bData?.data?.b2b || [];

    for (const group of supplierGroups) {
      const ctin = (group.ctin || '').trim().toUpperCase();
      const trdnm = group.trdnm || 'Unknown Vendor';
      for (const inv of group.inv || []) {
        const normInum = this.normalizeDocNumber(inv.inum);
        const key = `${ctin}_${normInum}`;
        gstr2bIndex.set(key, {
          supplierGstin: ctin,
          supplierName: trdnm,
          invoice: inv,
          matched: false
        });
      }
    }

    let totalEligibleItc = 0;
    let totalItcAtRisk = 0;
    let matchedCount = 0;
    let missingIn2bCount = 0;
    let mismatchCount = 0;

    // 1. Audit internal recorded Purchase Bills
    for (const bill of bills) {
      // Skip draft or cancelled bills
      if ((bill as any).status === 'CANCELLED' || (bill as any).status === 'VOID') {
        continue;
      }

      const billNo = bill.billNumber || '';
      const normBillNo = this.normalizeDocNumber(billNo);
      const vendorGstin = ((bill as any).vendorGstin || (bill as any).vendorGst || '').trim().toUpperCase();
      const vendorName = (bill as any).vendorName || 'Vendor';

      // Compute bill totals
      let bookTaxable = 0;
      let bookTax = 0;

      const items = bill.items || [];
      for (const item of items) {
        const qty = item.quantity || 1;
        const rate = (item as any).unitRate ?? (item as any).unitPrice ?? (item as any).rate ?? 0;
        const itemTaxable = Math.round((qty * rate) * 100) / 100;
        const taxRate = (item as any).taxRate ?? (item as any).gstRate ?? 18;
        const itemTax = Math.round((itemTaxable * (taxRate / 100)) * 100) / 100;

        bookTaxable += itemTaxable;
        bookTax += itemTax;
      }

      bookTaxable = Math.round(bookTaxable * 100) / 100;
      bookTax = Math.round(bookTax * 100) / 100;

      const key = `${vendorGstin}_${normBillNo}`;
      const gstr2bMatch = gstr2bIndex.get(key);

      if (!gstr2bMatch) {
        // Missing in GSTR-2B -> Vendor billed but hasn't uploaded to GSTN
        missingIn2bCount++;
        totalItcAtRisk += bookTax;
        results.push({
          billNumber: billNo,
          supplierGstin: vendorGstin,
          supplierName: vendorName,
          billDate: (bill as any).billDate ? new Date((bill as any).billDate).toISOString().split('T')[0] : '',
          bookTaxableValue: bookTaxable,
          bookTaxAmount: bookTax,
          gstr2bTaxableValue: 0,
          gstr2bTaxAmount: 0,
          taxableDiff: bookTaxable,
          taxDiff: bookTax,
          matchStatus: 'MISSING_IN_2B',
          statusReason: 'Bill is present in ERP accounts, but supplier has not filed in GSTR-2B. ITC is currently blocked.',
          isItcClaimable: false
        });
      } else {
        // Mark as inspected
        gstr2bMatch.matched = true;

        // Sum up GSTR-2B taxables and taxes
        let gstr2bTaxable = 0;
        let gstr2bTax = 0;
        for (const line of gstr2bMatch.invoice.itms || []) {
          gstr2bTaxable += line.txval || 0;
          gstr2bTax += (line.iamt || 0) + (line.camt || 0) + (line.samt || 0);
        }

        gstr2bTaxable = Math.round(gstr2bTaxable * 100) / 100;
        gstr2bTax = Math.round(gstr2bTax * 100) / 100;

        const taxableDiff = Math.round(Math.abs(bookTaxable - gstr2bTaxable) * 100) / 100;
        const taxDiff = Math.round(Math.abs(bookTax - gstr2bTax) * 100) / 100;

        if (taxableDiff <= toleranceRupees && taxDiff <= toleranceRupees) {
          // Full Match
          matchedCount++;
          totalEligibleItc += gstr2bTax;
          results.push({
            billNumber: billNo,
            supplierGstin: vendorGstin,
            supplierName: gstr2bMatch.supplierName || vendorName,
            billDate: gstr2bMatch.invoice.idt,
            bookTaxableValue: bookTaxable,
            bookTaxAmount: bookTax,
            gstr2bTaxableValue: gstr2bTaxable,
            gstr2bTaxAmount: gstr2bTax,
            taxableDiff,
            taxDiff,
            matchStatus: 'MATCHED',
            statusReason: 'Perfect statutory match between ERP books and GST portal. 100% ITC Eligible.',
            isItcClaimable: true
          });
        } else {
          // Amount or Rate mismatch
          mismatchCount++;
          totalItcAtRisk += bookTax;
          results.push({
            billNumber: billNo,
            supplierGstin: vendorGstin,
            supplierName: gstr2bMatch.supplierName || vendorName,
            billDate: gstr2bMatch.invoice.idt,
            bookTaxableValue: bookTaxable,
            bookTaxAmount: bookTax,
            gstr2bTaxableValue: gstr2bTaxable,
            gstr2bTaxAmount: gstr2bTax,
            taxableDiff,
            taxDiff,
            matchStatus: 'TAX_AMOUNT_MISMATCH',
            statusReason: `Discrepancy detected: Taxable diff ₹${taxableDiff}, Tax diff ₹${taxDiff}. Reconcile with supplier.`,
            isItcClaimable: false
          });
        }
      }
    }

    // 2. Unrecorded GSTR-2B invoices (Supplier filed, but not in company books)
    let missingInBooksCount = 0;
    let unrecordedItcOpportunity = 0;

    for (const [_, record] of gstr2bIndex.entries()) {
      if (!record.matched) {
        missingInBooksCount++;
        let gstr2bTaxable = 0;
        let gstr2bTax = 0;
        for (const line of record.invoice.itms || []) {
          gstr2bTaxable += line.txval || 0;
          gstr2bTax += (line.iamt || 0) + (line.camt || 0) + (line.samt || 0);
        }
        gstr2bTaxable = Math.round(gstr2bTaxable * 100) / 100;
        gstr2bTax = Math.round(gstr2bTax * 100) / 100;

        unrecordedItcOpportunity += gstr2bTax;

        results.push({
          billNumber: record.invoice.inum,
          supplierGstin: record.supplierGstin,
          supplierName: record.supplierName,
          billDate: record.invoice.idt,
          bookTaxableValue: 0,
          bookTaxAmount: 0,
          gstr2bTaxableValue: gstr2bTaxable,
          gstr2bTaxAmount: gstr2bTax,
          taxableDiff: gstr2bTaxable,
          taxDiff: gstr2bTax,
          matchStatus: 'MISSING_IN_BOOKS',
          statusReason: 'Supplier filed invoice on GSTN, but not found in ERP Purchase Register. Opportunity to book and claim ITC.',
          isItcClaimable: false
        });
      }
    }

    const totalBills = bills.length;
    const confidenceScore = totalBills > 0 ? Math.round((matchedCount / totalBills) * 100) : 100;

    return {
      taxPeriod: gstr2bData.fp || 'UNKNOWN',
      totalBillsAudited: totalBills,
      totalGstr2bInvoices: gstr2bIndex.size,
      matchedCount,
      missingIn2bCount,
      missingInBooksCount,
      mismatchCount,
      totalEligibleItc: Math.round(totalEligibleItc * 100) / 100,
      totalItcAtRisk: Math.round(totalItcAtRisk * 100) / 100,
      unrecordedItcOpportunity: Math.round(unrecordedItcOpportunity * 100) / 100,
      complianceConfidenceScore: confidenceScore,
      items: results
    };
  }
}
