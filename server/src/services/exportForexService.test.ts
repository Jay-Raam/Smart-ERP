import { describe, it, expect } from 'vitest';
import { ExportForexService, IExportInvoiceRequest, IForexSettlementRequest, IYearEndRevaluationRequest } from './exportForexService';

describe('ExportForexService (Multi-Currency Export Invoicing & Ind AS 21 Forex Engine)', () => {
  describe('Port Code & LUT ARN Validators', () => {
    it('should validate 6-character ICEGATE Indian port codes', () => {
      expect(ExportForexService.validatePortCode('INMAA1')).toBe(true); // Chennai Sea
      expect(ExportForexService.validatePortCode('INDEL4')).toBe(true); // Delhi Air Cargo
      expect(ExportForexService.validatePortCode('INBOM4')).toBe(true); // Mumbai Air Cargo
      expect(ExportForexService.validatePortCode('INTUT1')).toBe(true); // Tuticorin Sea
      expect(ExportForexService.validatePortCode('USNYC1')).toBe(false); // Non-Indian port
      expect(ExportForexService.validatePortCode('INMAA')).toBe(false); // Only 5 chars
      expect(ExportForexService.validatePortCode('')).toBe(false);
    });

    it('should validate 15-character statutory LUT Application Reference Numbers', () => {
      expect(ExportForexService.validateLutArn('AD330426000001Z')).toBe(true);
      expect(ExportForexService.validateLutArn('ARN123456789012')).toBe(true);
      expect(ExportForexService.validateLutArn('SHORT123')).toBe(false);
      expect(ExportForexService.validateLutArn('')).toBe(false);
    });
  });

  describe('Multi-Currency Export Invoice Generation under LUT / Bond (Rule 96A)', () => {
    it('should generate zero-rated export invoice with statutory endorsement text and dual currency conversion', () => {
      const req: IExportInvoiceRequest = {
        invoiceNumber: 'EXP-2026-001',
        invoiceDate: '2026-08-15',
        customerName: 'AeroTech Systems LLC',
        countryCode: 'US',
        destinationCountry: 'United States',
        exportType: 'EXPORT_WITHOUT_TAX',
        lutArn: 'AD330426000001Z',
        currency: 'USD',
        exchangeRate: 86.50, // 1 USD = 86.50 INR
        portCode: 'INMAA1',
        shippingBillNo: 'SB-9876543',
        shippingBillDate: '2026-08-14',
        items: [
          {
            itemCode: 'AERO-TITANIUM-BRKT',
            description: 'Titanium Aerospace Structural Bracket',
            hsnCode: '81089090',
            quantity: 50,
            unitPriceForeign: 200 // $200 USD each -> $10,000 USD total
          }
        ]
      };

      const res = ExportForexService.generateExportInvoice(req);

      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.statutoryDeclaration).toBe(ExportForexService.LUT_DECLARATION_WITHOUT_TAX);
      expect(res.totalAmountForeign).toBe(10000); // $10,000 USD
      expect(res.totalTaxableInr).toBe(865000); // 10,000 * 86.50 = ₹8,65,000 INR
      expect(res.totalIgstInr).toBe(0); // Zero-rated under LUT
      expect(res.totalAmountInr).toBe(865000);

      // Line item conversion check
      expect(res.items[0].unitPriceForeign).toBe(200);
      expect(res.items[0].unitPriceInr).toBe(17300); // 200 * 86.50
      expect(res.items[0].igstAmountInr).toBe(0);
    });

    it('should require valid LUT ARN when exportType is EXPORT_WITHOUT_TAX', () => {
      const invalidReq: IExportInvoiceRequest = {
        invoiceNumber: 'EXP-2026-002',
        invoiceDate: '2026-08-15',
        customerName: 'EuroDyne GmbH',
        countryCode: 'DE',
        destinationCountry: 'Germany',
        exportType: 'EXPORT_WITHOUT_TAX',
        lutArn: '', // Missing LUT ARN
        currency: 'EUR',
        exchangeRate: 94.00,
        portCode: 'INBOM4',
        items: [
          { itemCode: 'CNC-COMP-01', description: 'Precision Component', hsnCode: '84669390', quantity: 10, unitPriceForeign: 500 }
        ]
      };

      const res = ExportForexService.generateExportInvoice(invalidReq);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.includes('LUT ARN is mandatory'))).toBe(true);
    });

    it('should compute statutory IGST when export is on payment of tax (EXPORT_WITH_TAX)', () => {
      const req: IExportInvoiceRequest = {
        invoiceNumber: 'EXP-2026-003',
        invoiceDate: '2026-08-20',
        customerName: 'Tokyo Precision KK',
        countryCode: 'JP',
        destinationCountry: 'Japan',
        exportType: 'EXPORT_WITH_TAX',
        currency: 'USD',
        exchangeRate: 85.00,
        portCode: 'INDEL4',
        items: [
          {
            itemCode: 'OPTICAL-LENS',
            description: 'High-Precision Sapphire Window',
            hsnCode: '90019090',
            quantity: 20,
            unitPriceForeign: 500, // $10,000 USD -> ₹8,50,000 INR
            igstRate: 18
          }
        ]
      };

      const res = ExportForexService.generateExportInvoice(req);
      expect(res.isValid).toBe(true);
      expect(res.statutoryDeclaration).toBe(ExportForexService.DECLARATION_WITH_TAX);
      expect(res.totalTaxableInr).toBe(850000);
      expect(res.totalIgstInr).toBe(153000); // 18% of 850,000
      expect(res.totalAmountInr).toBe(1003000);
    });
  });

  describe('Ind AS 21 / AS 11 Foreign Exchange Remittance Settlement', () => {
    it('should calculate realized Forex Gain and format balanced double-entry journal voucher', () => {
      // Invoiced: $10,000 @ ₹85.00 = ₹8,50,000 INR
      // Received: $10,000 @ ₹86.80 = ₹8,68,000 INR
      // Forex Gain = ₹18,000 INR
      const req: IForexSettlementRequest = {
        invoiceNumber: 'EXP-2026-001',
        currency: 'USD',
        bookedAmountForeign: 10000,
        bookingExchangeRate: 85.00,
        bookingDate: '2026-08-15',
        receivedAmountForeign: 10000,
        settlementExchangeRate: 86.80,
        settlementDate: '2026-09-25',
        bankAccountName: 'HDFC Bank EEFC USD Account'
      };

      const res = ExportForexService.settleForeignRemittance(req);

      expect(res.forexType).toBe('GAIN');
      expect(res.bookedValueInr).toBe(850000);
      expect(res.realizedValueInr).toBe(868000);
      expect(res.varianceInr).toBe(18000);
      expect(res.isFullySettled).toBe(true);

      const jv = res.journalVoucher;
      expect(jv.voucherType).toBe('JOURNAL');
      // Verify balanced double-entry accounting
      const totalDebits = jv.entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredits = jv.entries.reduce((sum, e) => sum + e.credit, 0);
      expect(totalDebits).toBe(868000);
      expect(totalCredits).toBe(868000);

      // Verify credit to P&L Forex Gain
      const gainEntry = jv.entries.find(e => e.account.includes('Exchange Fluctuation Gain'));
      expect(gainEntry).toBeDefined();
      expect(gainEntry?.credit).toBe(18000);
    });

    it('should calculate realized Forex Loss and format balanced double-entry journal voucher', () => {
      // Invoiced: $10,000 @ ₹86.00 = ₹8,60,000 INR
      // Received: $10,000 @ ₹84.50 = ₹8,45,000 INR
      // Forex Loss = ₹15,000 INR
      const req: IForexSettlementRequest = {
        invoiceNumber: 'EXP-2026-002',
        currency: 'USD',
        bookedAmountForeign: 10000,
        bookingExchangeRate: 86.00,
        bookingDate: '2026-08-20',
        receivedAmountForeign: 10000,
        settlementExchangeRate: 84.50,
        settlementDate: '2026-10-05',
        bankAccountName: 'ICICI Bank EEFC USD Account'
      };

      const res = ExportForexService.settleForeignRemittance(req);

      expect(res.forexType).toBe('LOSS');
      expect(res.varianceInr).toBe(-15000);

      const jv = res.journalVoucher;
      const totalDebits = jv.entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredits = jv.entries.reduce((sum, e) => sum + e.credit, 0);
      expect(totalDebits).toBe(860000); // 845,000 (Bank) + 15,000 (Loss)
      expect(totalCredits).toBe(860000); // 860,000 (Debtor)

      const lossEntry = jv.entries.find(e => e.account.includes('Exchange Fluctuation Loss'));
      expect(lossEntry).toBeDefined();
      expect(lossEntry?.debit).toBe(15000);
    });
  });

  describe('Fiscal Year-End Mark-To-Market (MTM) Revaluation (Ind AS 21 Para 23)', () => {
    it('should audit and revalue unsettled foreign trade receivables at balance sheet date', () => {
      const req: IYearEndRevaluationRequest = {
        asOfDate: '2026-03-31',
        openInvoices: [
          { invoiceNumber: 'EXP-2026-010', currency: 'USD', unpaidAmountForeign: 5000, bookingExchangeRate: 85.00 }, // Booked: 425,000
          { invoiceNumber: 'EXP-2026-011', currency: 'EUR', unpaidAmountForeign: 4000, bookingExchangeRate: 92.00 }  // Booked: 368,000
        ],
        closingExchangeRates: {
          USD: 87.00, // Revalued: 435,000 (+10,000 Gain)
          EUR: 91.00  // Revalued: 364,000 (-4,000 Loss)
        }
      };

      const res = ExportForexService.revalueYearEndReceivables(req);

      expect(res.totalCarryingValueInr).toBe(793000);
      expect(res.totalRevaluedValueInr).toBe(799000);
      expect(res.netUnrealizedForexVariance).toBe(6000);
      expect(res.gainOrLoss).toBe('GAIN');
      expect(res.revaluationVoucher).toBeDefined();

      const jv = res.revaluationVoucher!;
      expect(jv.entries[0].debit).toBe(6000);
      expect(jv.entries[1].credit).toBe(6000);
    });
  });
});
