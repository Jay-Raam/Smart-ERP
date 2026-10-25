import { describe, it, expect } from 'vitest';
import { BankStatementService, BankStatementLine } from './bankStatementService';

describe('BankStatementService - Automated Bank Statement Reconciliation', () => {
  describe('parseCsvStatement', () => {
    it('parses standard Indian commercial bank CSV format correctly', () => {
      const sampleCsv = `
Date,Narration,Chq/Ref No,Withdrawal (Dr),Deposit (Cr),Balance
15/07/2026,NEFT-ACME MFG INDIA-UTR9823401,UTR9823401,,146320.00,520000.00
16/07/2026,RTGS-STEEL SUPPLIERS LTD-UTR112233,UTR112233,118000.00,,402000.00
18/07/2026,UPI-MISC VENDOR PAYMENT-UPI778899,UPI778899,5000.00,,397000.00
      `.trim();

      const parsed = BankStatementService.parseCsvStatement(sampleCsv);
      expect(parsed.length).toBe(3);

      // Line 1: Credit inflow
      expect(parsed[0].type).toBe('CREDIT');
      expect(parsed[0].amount).toBe(146320);
      expect(parsed[0].referenceNumber).toBe('UTR9823401');
      expect(parsed[0].description).toContain('ACME MFG INDIA');

      // Line 2: Debit outflow
      expect(parsed[1].type).toBe('DEBIT');
      expect(parsed[1].amount).toBe(118000);
      expect(parsed[1].referenceNumber).toBe('UTR112233');

      // Line 3: Debit outflow
      expect(parsed[2].type).toBe('DEBIT');
      expect(parsed[2].amount).toBe(5000);
    });
  });

  describe('parseMt940Statement', () => {
    it('parses SWIFT MT940 electronic bank statements with :61: and :86: tags', () => {
      const sampleMt940 = `
:20:START20260715
:25:HDFC0000123/1234567890
:28C:00012/001
:60F:C260715INR500000,00
:61:2607150715CR146320,00NTRFNONREF//UTR9823401
:86:NEFT INWARD CR FROM ACME MFG PVT LTD
:61:2607160716DR118000,00NTRFNONREF//UTR112233
:86:RTGS OUTWARD PAYMENT TO TATA STEEL
:62F:C260716INR528320,00
-
      `.trim();

      const parsed = BankStatementService.parseMt940Statement(sampleMt940);
      expect(parsed.length).toBe(2);

      // Line 1: Credit
      expect(parsed[0].type).toBe('CREDIT');
      expect(parsed[0].amount).toBe(146320);
      expect(parsed[0].description).toBe('NEFT INWARD CR FROM ACME MFG PVT LTD');

      // Line 2: Debit
      expect(parsed[1].type).toBe('DEBIT');
      expect(parsed[1].amount).toBe(118000);
      expect(parsed[1].description).toBe('RTGS OUTWARD PAYMENT TO TATA STEEL');
    });
  });

  describe('reconcile - Fuzzy Multi-Factor Auto Matching', () => {
    const mockInvoices: any[] = [
      {
        _id: 'inv_001',
        invoiceNumber: 'INV-2026-0892',
        customerName: 'Acme Manufacturing India',
        totalAmount: 146320,
        outstandingAmount: 146320,
        paymentStatus: 'UNPAID'
      },
      {
        _id: 'inv_002',
        invoiceNumber: 'INV-2026-0895',
        customerName: 'Global Tech Systems',
        totalAmount: 25000,
        outstandingAmount: 25000,
        paymentStatus: 'UNPAID'
      }
    ];

    const mockBills: any[] = [
      {
        _id: 'bill_001',
        billNumber: 'BILL-2026-001',
        vendorName: 'Tata Steel Ltd',
        totalAmount: 118000,
        outstandingAmount: 118000,
        paymentStatus: 'UNPAID'
      }
    ];

    it('achieves 100% confidence when statement reference matches invoice/bill number', () => {
      const statementLines: BankStatementLine[] = [
        {
          id: 's1',
          date: '2026-07-15',
          description: 'Payment for invoice INV-2026-0892',
          referenceNumber: 'INV20260892',
          type: 'CREDIT',
          amount: 146320
        }
      ];

      const result = BankStatementService.reconcile(statementLines, mockInvoices, mockBills);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].confidenceScore).toBe(100);
      expect(result.matches[0].confidenceLevel).toBe('EXACT_UTR');
      expect(result.matches[0].matchedEntityNumber).toBe('INV-2026-0892');
      expect(result.matches[0].isSettlementRecommended).toBe(true);
    });

    it('achieves 90% confidence on exact party name and exact amount match', () => {
      const statementLines: BankStatementLine[] = [
        {
          id: 's2',
          date: '2026-07-15',
          description: 'NEFT CR ACME MANUFACTURING INDIA CHENNAI BRANCH',
          referenceNumber: 'UTR99887711',
          type: 'CREDIT',
          amount: 146320
        }
      ];

      const result = BankStatementService.reconcile(statementLines, mockInvoices, mockBills);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].confidenceScore).toBe(90);
      expect(result.matches[0].confidenceLevel).toBe('EXACT_PARTY_AMOUNT');
      expect(result.matches[0].matchedEntityNumber).toBe('INV-2026-0892');
      expect(result.matches[0].isSettlementRecommended).toBe(true);
    });

    it('matches debit outflows against vendor bills', () => {
      const statementLines: BankStatementLine[] = [
        {
          id: 's3',
          date: '2026-07-16',
          description: 'RTGS PAYMENT TO TATA STEEL LTD',
          referenceNumber: 'CMS99882233',
          type: 'DEBIT',
          amount: 118000
        }
      ];

      const result = BankStatementService.reconcile(statementLines, mockInvoices, mockBills);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].matchedEntityType).toBe('BILL');
      expect(result.matches[0].matchedEntityNumber).toBe('BILL-2026-001');
      expect(result.matches[0].confidenceScore).toBe(90);
      expect(result.matches[0].isSettlementRecommended).toBe(true);
    });

    it('flags unmatched transactions accurately without false positives', () => {
      const statementLines: BankStatementLine[] = [
        {
          id: 's4',
          date: '2026-07-20',
          description: 'INTEREST CREDIT FROM BANK',
          referenceNumber: 'INT2026',
          type: 'CREDIT',
          amount: 1250.50
        }
      ];

      const result = BankStatementService.reconcile(statementLines, mockInvoices, mockBills);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].confidenceScore).toBe(0);
      expect(result.matches[0].confidenceLevel).toBe('UNMATCHED');
      expect(result.matches[0].isSettlementRecommended).toBe(false);
      expect(result.unmatchedCount).toBe(1);
    });
  });
});
