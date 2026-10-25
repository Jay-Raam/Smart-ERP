import { IInvoice, IBill } from '../models/ErpModels';

export interface BankStatementLine {
  id: string;
  date: string;              // YYYY-MM-DD
  rawDate?: string;
  description: string;
  referenceNumber: string;   // UTR / Cheque No / Ref No
  type: 'CREDIT' | 'DEBIT';  // Inflow (Cr) vs Outflow (Dr)
  amount: number;
  balance?: number;
}

export type MatchConfidenceLevel = 'EXACT_UTR' | 'EXACT_PARTY_AMOUNT' | 'FUZZY_PARTY_AMOUNT' | 'UNMATCHED';

export interface BankReconciliationMatch {
  statementLine: BankStatementLine;
  matchedEntityType?: 'INVOICE' | 'BILL';
  matchedEntityId?: string;
  matchedEntityNumber?: string;
  partyName?: string;
  partyGstin?: string;
  documentTotalAmount?: number;
  documentOutstandingAmount?: number;
  confidenceScore: number;         // 0 - 100
  confidenceLevel: MatchConfidenceLevel;
  matchReason: string;
  isSettlementRecommended: boolean;
}

export interface BankReconciliationResult {
  totalStatementLines: number;
  totalCredits: number;
  totalDebits: number;
  matchedCreditCount: number;
  matchedDebitCount: number;
  unmatchedCount: number;
  totalReconciledAmount: number;
  matches: BankReconciliationMatch[];
}

export class BankStatementService {
  /**
   * Normalizes strings for robust matching (e.g. uppercase, stripping non-alphanumeric).
   */
  static cleanString(str: string): string {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Parses CSV statement text from standard Indian banks (HDFC, ICICI, SBI, Axis).
   */
  static parseCsvStatement(csvContent: string): BankStatementLine[] {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    // Find header line
    let headerIdx = -1;
    let colMap: Record<string, number> = {};

    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const lower = lines[i].toLowerCase();
      if ((lower.includes('date') || lower.includes('txn date')) && (lower.includes('narration') || lower.includes('description') || lower.includes('particulars'))) {
        headerIdx = i;
        const cols = lines[i].split(',').map((c) => c.replace(/["']/g, '').trim().toLowerCase());
        cols.forEach((col, idx) => {
          if (col.includes('date')) colMap['date'] = idx;
          if (col.includes('narration') || col.includes('description') || col.includes('particulars')) colMap['description'] = idx;
          if (col.includes('chq') || col.includes('ref') || col.includes('utr')) colMap['reference'] = idx;
          if (col.includes('withdrawal') || col.includes('debit') || col.includes('dr')) colMap['debit'] = idx;
          if (col.includes('deposit') || col.includes('credit') || col.includes('cr')) colMap['credit'] = idx;
          if (col.includes('balance')) colMap['balance'] = idx;
        });
        break;
      }
    }

    if (headerIdx === -1) {
      // Fallback: assume standard 5-column layout [Date, Description, Ref, Debit, Credit]
      colMap = { date: 0, description: 1, reference: 2, debit: 3, credit: 4, balance: 5 };
      headerIdx = 0;
    }

    const results: BankStatementLine[] = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((c) => c.replace(/["']/g, '').trim());
      if (row.length < 3) continue;

      const rawDate = row[colMap['date'] ?? 0] || '';
      const desc = row[colMap['description'] ?? 1] || '';
      const ref = row[colMap['reference'] ?? 2] || '';
      const debitStr = (row[colMap['debit'] ?? 3] || '').replace(/[^0-9.-]/g, '');
      const creditStr = (row[colMap['credit'] ?? 4] || '').replace(/[^0-9.-]/g, '');
      const balanceStr = (row[colMap['balance'] ?? 5] || '').replace(/[^0-9.-]/g, '');

      const debit = parseFloat(debitStr) || 0;
      const credit = parseFloat(creditStr) || 0;
      const balance = parseFloat(balanceStr) || undefined;

      if (debit <= 0 && credit <= 0) continue;

      // Normalize date to YYYY-MM-DD
      let normalizedDate = new Date().toISOString().split('T')[0];
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        normalizedDate = parsedDate.toISOString().split('T')[0];
      }

      results.push({
        id: `stmt_${Date.now()}_${i}`,
        date: normalizedDate,
        rawDate,
        description: desc,
        referenceNumber: ref,
        type: credit > 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.round((credit > 0 ? credit : debit) * 100) / 100,
        balance
      });
    }

    return results;
  }

  /**
   * Parses SWIFT MT940 electronic bank statements.
   */
  static parseMt940Statement(mt940Content: string): BankStatementLine[] {
    const results: BankStatementLine[] = [];
    const lines = mt940Content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let currentLine: Partial<BankStatementLine> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith(':61:')) {
        // Tag 61: Statement Line
        // Format: :61:YYMMDD[MMDD]C/D[Currency]Amount[TransactionType]Reference
        const payload = line.substring(4);
        const dateMatch = payload.match(/^(\d{6})/);
        const rawDate = dateMatch ? dateMatch[1] : '';

        // Form YYYY-MM-DD from YYMMDD
        let formattedDate = new Date().toISOString().split('T')[0];
        if (rawDate.length === 6) {
          const yy = parseInt(rawDate.substring(0, 2), 10);
          const mm = rawDate.substring(2, 4);
          const dd = rawDate.substring(4, 6);
          const fullYear = yy < 50 ? 2000 + yy : 1900 + yy;
          formattedDate = `${fullYear}-${mm}-${dd}`;
        }

        const isCredit = payload.includes('C') && !payload.includes('RC');
        const amountMatch = payload.match(/[CD]R?([0-9]+[,\.][0-9]{2})/i) || payload.match(/[CD]R?([0-9,.]+)/i);
        let amount = 0;
        if (amountMatch) {
          amount = parseFloat(amountMatch[1].replace(',', '.')) || 0;
        }

        const refMatch = payload.match(/NONREF|([A-Z0-9]{6,})/);
        const ref = refMatch && refMatch[0] !== 'NONREF' ? refMatch[0] : `REF${Date.now()}_${i}`;

        currentLine = {
          id: `mt940_${Date.now()}_${i}`,
          date: formattedDate,
          rawDate,
          type: isCredit ? 'CREDIT' : 'DEBIT',
          amount: Math.round(amount * 100) / 100,
          referenceNumber: ref,
          description: ''
        };
      } else if (line.startsWith(':86:') && currentLine) {
        // Tag 86: Narrative / Information to Account Owner
        currentLine.description = line.substring(4).trim();
        results.push(currentLine as BankStatementLine);
        currentLine = null;
      }
    }

    if (currentLine) {
      currentLine.description = currentLine.description || 'MT940 Bank Transaction';
      results.push(currentLine as BankStatementLine);
    }

    return results;
  }

  /**
   * Multi-factor fuzzy matching reconciling bank transactions against open invoices/bills.
   */
  static reconcile(
    statementLines: BankStatementLine[],
    openInvoices: IInvoice[],
    openBills: IBill[]
  ): BankReconciliationResult {
    const matches: BankReconciliationMatch[] = [];

    let totalCredits = 0;
    let totalDebits = 0;
    let matchedCreditCount = 0;
    let matchedDebitCount = 0;
    let unmatchedCount = 0;
    let totalReconciledAmount = 0;

    for (const stmt of statementLines) {
      if (stmt.type === 'CREDIT') {
        totalCredits += stmt.amount;

        // Inflow -> Reconcile against open Customer Invoices
        let bestMatch: BankReconciliationMatch = {
          statementLine: stmt,
          confidenceScore: 0,
          confidenceLevel: 'UNMATCHED',
          matchReason: 'No matching unpaid customer invoice found for this bank credit.',
          isSettlementRecommended: false
        };

        const cleanDesc = this.cleanString(stmt.description);
        const cleanRef = this.cleanString(stmt.referenceNumber);

        for (const inv of openInvoices) {
          const invNum = inv.invoiceNumber || '';
          const cleanInvNum = this.cleanString(invNum);
          const custName = (inv as any).customerName || '';
          const cleanCustName = this.cleanString(custName);
          const outstanding = (inv as any).outstandingAmount ?? (inv as any).totalAmount ?? 0;
          const totalVal = (inv as any).totalAmount ?? 0;

          const amountExactMatch = Math.abs(stmt.amount - outstanding) <= 1.0 || Math.abs(stmt.amount - totalVal) <= 1.0;

          // 1. Exact UTR / Ref match in Invoice Number or Payment Note
          if (cleanRef.length > 5 && (cleanInvNum.includes(cleanRef) || cleanRef.includes(cleanInvNum))) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'INVOICE',
              matchedEntityId: inv._id ? String(inv._id) : undefined,
              matchedEntityNumber: invNum,
              partyName: custName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 100,
              confidenceLevel: 'EXACT_UTR',
              matchReason: `Exact reference/invoice number match (${invNum}). 100% confidence.`,
              isSettlementRecommended: true
            };
            break;
          }

          // 2. Exact Party Name + Exact Amount match
          if (amountExactMatch && cleanCustName.length > 3 && cleanDesc.includes(cleanCustName)) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'INVOICE',
              matchedEntityId: inv._id ? String(inv._id) : undefined,
              matchedEntityNumber: invNum,
              partyName: custName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 90,
              confidenceLevel: 'EXACT_PARTY_AMOUNT',
              matchReason: `Exact customer name (${custName}) and matching amount (₹${stmt.amount}).`,
              isSettlementRecommended: true
            };
            break;
          }

          // 3. Partial Party Name or Amount match within date tolerance
          if (amountExactMatch && bestMatch.confidenceScore < 75) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'INVOICE',
              matchedEntityId: inv._id ? String(inv._id) : undefined,
              matchedEntityNumber: invNum,
              partyName: custName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 75,
              confidenceLevel: 'FUZZY_PARTY_AMOUNT',
              matchReason: `Exact amount match (₹${stmt.amount}) against invoice ${invNum}. Verify customer.`,
              isSettlementRecommended: true
            };
          }
        }

        if (bestMatch.isSettlementRecommended) {
          matchedCreditCount++;
          totalReconciledAmount += stmt.amount;
        } else {
          unmatchedCount++;
        }
        matches.push(bestMatch);
      } else {
        // DEBIT -> Outflow -> Reconcile against open Vendor Bills
        totalDebits += stmt.amount;

        let bestMatch: BankReconciliationMatch = {
          statementLine: stmt,
          confidenceScore: 0,
          confidenceLevel: 'UNMATCHED',
          matchReason: 'No matching unpaid vendor bill found for this bank debit.',
          isSettlementRecommended: false
        };

        const cleanDesc = this.cleanString(stmt.description);
        const cleanRef = this.cleanString(stmt.referenceNumber);

        for (const bill of openBills) {
          const billNum = bill.billNumber || '';
          const cleanBillNum = this.cleanString(billNum);
          const vendorName = (bill as any).vendorName || '';
          const cleanVendorName = this.cleanString(vendorName);
          const outstanding = (bill as any).outstandingAmount ?? (bill as any).totalAmount ?? 0;
          const totalVal = (bill as any).totalAmount ?? 0;

          const amountExactMatch = Math.abs(stmt.amount - outstanding) <= 1.0 || Math.abs(stmt.amount - totalVal) <= 1.0;

          // 1. Exact Reference Match
          if (cleanRef.length > 5 && (cleanBillNum.includes(cleanRef) || cleanRef.includes(cleanBillNum))) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'BILL',
              matchedEntityId: bill._id ? String(bill._id) : undefined,
              matchedEntityNumber: billNum,
              partyName: vendorName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 100,
              confidenceLevel: 'EXACT_UTR',
              matchReason: `Exact reference/bill number match (${billNum}). 100% confidence.`,
              isSettlementRecommended: true
            };
            break;
          }

          // 2. Exact Vendor Name + Exact Amount match
          if (amountExactMatch && cleanVendorName.length > 3 && cleanDesc.includes(cleanVendorName)) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'BILL',
              matchedEntityId: bill._id ? String(bill._id) : undefined,
              matchedEntityNumber: billNum,
              partyName: vendorName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 90,
              confidenceLevel: 'EXACT_PARTY_AMOUNT',
              matchReason: `Exact vendor name (${vendorName}) and matching amount (₹${stmt.amount}).`,
              isSettlementRecommended: true
            };
            break;
          }

          // 3. Amount Match
          if (amountExactMatch && bestMatch.confidenceScore < 75) {
            bestMatch = {
              statementLine: stmt,
              matchedEntityType: 'BILL',
              matchedEntityId: bill._id ? String(bill._id) : undefined,
              matchedEntityNumber: billNum,
              partyName: vendorName,
              documentTotalAmount: totalVal,
              documentOutstandingAmount: outstanding,
              confidenceScore: 75,
              confidenceLevel: 'FUZZY_PARTY_AMOUNT',
              matchReason: `Exact amount match (₹${stmt.amount}) against bill ${billNum}. Verify vendor.`,
              isSettlementRecommended: true
            };
          }
        }

        if (bestMatch.isSettlementRecommended) {
          matchedDebitCount++;
          totalReconciledAmount += stmt.amount;
        } else {
          unmatchedCount++;
        }
        matches.push(bestMatch);
      }
    }

    return {
      totalStatementLines: statementLines.length,
      totalCredits: Math.round(totalCredits * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      matchedCreditCount,
      matchedDebitCount,
      unmatchedCount,
      totalReconciledAmount: Math.round(totalReconciledAmount * 100) / 100,
      matches
    };
  }
}
