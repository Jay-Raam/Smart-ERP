/**
 * Multi-Currency Export Invoicing & Ind AS 21 / AS 11 Foreign Exchange Fluctuation Engine
 * Handles Zero-Rated Export under Letter of Undertaking (LUT) / Bond (Rule 96A) and
 * automated realized/unrealized foreign exchange gain/loss accounting.
 */

export type ExportType = 'EXPORT_WITHOUT_TAX' | 'EXPORT_WITH_TAX';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'JPY' | 'CAD' | 'AUD' | 'CHF';

export interface IExportLineItemInput {
  itemCode: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPriceForeign: number;
  igstRate?: number; // Statutory rate, e.g. 18. Applicable if EXPORT_WITH_TAX
}

export interface IExportLineItemResult {
  itemCode: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPriceForeign: number;
  totalPriceForeign: number;
  unitPriceInr: number;
  totalPriceInr: number;
  igstRate: number;
  igstAmountInr: number;
}

export interface IExportInvoiceRequest {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  countryCode: string; // ISO 2-character country code (e.g. US, GB, DE)
  destinationCountry: string;
  exportType: ExportType;
  lutArn?: string; // Statutory ARN: 15 alphanumeric characters (e.g., AD330426000001Z)
  currency: CurrencyCode;
  exchangeRate: number; // CBIC notified customs rate or RBI reference rate (e.g., 86.50)
  portCode: string; // 6-character ICEGATE port code (e.g., INMAA1, INBOM4, INDEL4)
  shippingBillNo?: string;
  shippingBillDate?: string;
  items: IExportLineItemInput[];
}

export interface IExportInvoiceResult {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  countryCode: string;
  destinationCountry: string;
  exportType: ExportType;
  statutoryDeclaration: string;
  lutArn?: string;
  currency: CurrencyCode;
  exchangeRate: number;
  portCode: string;
  shippingBillNo?: string;
  shippingBillDate?: string;
  totalAmountForeign: number;
  totalTaxableInr: number;
  totalIgstInr: number;
  totalAmountInr: number;
  items: IExportLineItemResult[];
  isValid: boolean;
  errors: string[];
}

export interface IForexSettlementRequest {
  invoiceNumber: string;
  currency: CurrencyCode;
  bookedAmountForeign: number;
  bookingExchangeRate: number;
  bookingDate: string;
  receivedAmountForeign: number;
  settlementExchangeRate: number;
  settlementDate: string;
  bankAccountName?: string;
}

export interface IForexSettlementResult {
  invoiceNumber: string;
  currency: CurrencyCode;
  receivedAmountForeign: number;
  bookedValueInr: number;
  realizedValueInr: number;
  varianceInr: number;
  forexType: 'GAIN' | 'LOSS' | 'NIL';
  isFullySettled: boolean;
  unsettledAmountForeign: number;
  journalVoucher: {
    voucherType: 'JOURNAL';
    voucherNumber: string;
    date: string;
    narration: string;
    entries: Array<{
      account: string;
      debit: number;
      credit: number;
    }>;
  };
}

export interface IYearEndRevaluationRequest {
  asOfDate: string;
  openInvoices: Array<{
    invoiceNumber: string;
    currency: CurrencyCode;
    unpaidAmountForeign: number;
    bookingExchangeRate: number;
  }>;
  closingExchangeRates: Record<string, number>;
}

export interface IYearEndRevaluationResult {
  asOfDate: string;
  totalCarryingValueInr: number;
  totalRevaluedValueInr: number;
  netUnrealizedForexVariance: number;
  gainOrLoss: 'GAIN' | 'LOSS' | 'NIL';
  items: Array<{
    invoiceNumber: string;
    currency: string;
    unpaidForeign: number;
    bookedInr: number;
    revaluedInr: number;
    varianceInr: number;
    type: 'GAIN' | 'LOSS' | 'NIL';
  }>;
  revaluationVoucher?: {
    voucherType: 'JOURNAL';
    voucherNumber: string;
    date: string;
    narration: string;
    entries: Array<{
      account: string;
      debit: number;
      credit: number;
    }>;
  };
}

export class ExportForexService {
  /**
   * Statutory LUT Endorsements under Rule 96 / Rule 96A of CGST Rules 2017
   */
  public static readonly LUT_DECLARATION_WITHOUT_TAX = 
    'SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX';

  public static readonly DECLARATION_WITH_TAX = 
    'SUPPLY MEANT FOR EXPORT ON PAYMENT OF INTEGRATED TAX';

  /**
   * ICEGATE Port Code Regex: 2 letters (country code 'IN') + 3 letters (port location) + 1 digit/letter (terminal/air cargo/sea)
   * e.g., INMAA1 (Chennai Sea), INDEL4 (Delhi Air Cargo), INBOM4 (Mumbai Air Cargo), INTUT1 (Tuticorin Sea)
   */
  private static readonly PORT_CODE_REGEX = /^IN[A-Z]{3}[0-9A-Z]{1}$/i;

  /**
   * Validate Indian ICEGATE Port Code
   */
  public static validatePortCode(portCode: string): boolean {
    if (!portCode) return false;
    return this.PORT_CODE_REGEX.test(portCode.trim());
  }

  /**
   * Validate LUT ARN format (15 alphanumeric characters)
   */
  public static validateLutArn(lutArn: string): boolean {
    if (!lutArn) return false;
    return /^[A-Z0-9]{15}$/i.test(lutArn.trim());
  }

  /**
   * Format and validate Multi-Currency Export Invoice
   */
  public static generateExportInvoice(request: IExportInvoiceRequest): IExportInvoiceResult {
    const errors: string[] = [];

    // 1. Mandatory invoice fields
    if (!request.invoiceNumber || request.invoiceNumber.trim().length === 0) {
      errors.push('invoiceNumber is required.');
    }
    if (!request.exchangeRate || request.exchangeRate <= 0) {
      errors.push('A valid positive foreign exchangeRate is required for statutory currency conversion.');
    }

    // 2. Export Type & LUT Validation
    let declaration = '';
    if (request.exportType === 'EXPORT_WITHOUT_TAX') {
      declaration = this.LUT_DECLARATION_WITHOUT_TAX;
      if (!request.lutArn || !this.validateLutArn(request.lutArn)) {
        errors.push(`Statutory LUT ARN is mandatory for zero-rated export without payment of tax. Received: '${request.lutArn || ''}'.`);
      }
    } else if (request.exportType === 'EXPORT_WITH_TAX') {
      declaration = this.DECLARATION_WITH_TAX;
    } else {
      errors.push(`Invalid exportType '${request.exportType}'. Must be EXPORT_WITHOUT_TAX or EXPORT_WITH_TAX.`);
    }

    // 3. Port Code Validation
    if (!request.portCode || !this.validatePortCode(request.portCode)) {
      errors.push(`Invalid ICEGATE Port Code '${request.portCode}'. Must be a 6-character port identifier (e.g. INMAA1, INDEL4).`);
    }

    // 4. Line items conversion
    if (!request.items || request.items.length === 0) {
      errors.push('At least one export line item is required.');
    }

    let totalForeign = 0;
    let totalTaxableInr = 0;
    let totalIgstInr = 0;
    const processedItems: IExportLineItemResult[] = [];

    if (request.items && request.items.length > 0) {
      for (const item of request.items) {
        const foreignLineTotal = Math.round(item.quantity * item.unitPriceForeign * 100) / 100;
        const unitInr = Math.round(item.unitPriceForeign * request.exchangeRate * 100) / 100;
        const lineTotalInr = Math.round(foreignLineTotal * request.exchangeRate * 100) / 100;

        let igstRate = 0;
        let lineIgstInr = 0;

        if (request.exportType === 'EXPORT_WITH_TAX') {
          igstRate = item.igstRate || 18;
          lineIgstInr = Math.round((lineTotalInr * (igstRate / 100)) * 100) / 100;
        }

        totalForeign += foreignLineTotal;
        totalTaxableInr += lineTotalInr;
        totalIgstInr += lineIgstInr;

        processedItems.push({
          itemCode: item.itemCode,
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign,
          totalPriceForeign: foreignLineTotal,
          unitPriceInr: unitInr,
          totalPriceInr: lineTotalInr,
          igstRate,
          igstAmountInr: lineIgstInr
        });
      }
    }

    const totalAmountInr = Math.round((totalTaxableInr + totalIgstInr) * 100) / 100;
    const isValid = errors.length === 0;

    return {
      invoiceNumber: request.invoiceNumber,
      invoiceDate: request.invoiceDate || new Date().toISOString().split('T')[0],
      customerName: request.customerName,
      countryCode: (request.countryCode || 'US').toUpperCase(),
      destinationCountry: request.destinationCountry,
      exportType: request.exportType,
      statutoryDeclaration: declaration,
      lutArn: request.lutArn ? request.lutArn.trim().toUpperCase() : undefined,
      currency: request.currency,
      exchangeRate: request.exchangeRate,
      portCode: request.portCode ? request.portCode.trim().toUpperCase() : '',
      shippingBillNo: request.shippingBillNo,
      shippingBillDate: request.shippingBillDate,
      totalAmountForeign: Math.round(totalForeign * 100) / 100,
      totalTaxableInr: Math.round(totalTaxableInr * 100) / 100,
      totalIgstInr: Math.round(totalIgstInr * 100) / 100,
      totalAmountInr,
      items: processedItems,
      isValid,
      errors
    };
  }

  /**
   * Settle Foreign Remittance & Compute Ind AS 21 / AS 11 Realized Forex Gain or Loss
   * 
   * Compares the INR booked value of the received foreign currency against the INR realized value at settlement exchange rate.
   * Generates double-entry accounting journal voucher.
   */
  public static settleForeignRemittance(request: IForexSettlementRequest): IForexSettlementResult {
    const bookedInr = Math.round(request.receivedAmountForeign * request.bookingExchangeRate * 100) / 100;
    const realizedInr = Math.round(request.receivedAmountForeign * request.settlementExchangeRate * 100) / 100;
    const varianceInr = Math.round((realizedInr - bookedInr) * 100) / 100;

    const bankAccount = request.bankAccountName || `Foreign Exchange EEFC Bank A/c (${request.currency})`;
    const debtorAccount = `Trade Receivables - Export Debtor (${request.invoiceNumber})`;

    let forexType: 'GAIN' | 'LOSS' | 'NIL' = 'NIL';
    let narration = '';
    const entries: Array<{ account: string; debit: number; credit: number }> = [];

    const voucherNum = `JV-FX-${request.settlementDate.replace(/-/g, '')}-${request.invoiceNumber.slice(-4)}`;

    if (varianceInr > 0) {
      forexType = 'GAIN';
      narration = `Realized Forex Gain on settlement of ${request.invoiceNumber}: ${request.receivedAmountForeign} ${request.currency} realized @ ₹${request.settlementExchangeRate} vs booked @ ₹${request.bookingExchangeRate}.`;
      
      entries.push({ account: bankAccount, debit: realizedInr, credit: 0 });
      entries.push({ account: debtorAccount, debit: 0, credit: bookedInr });
      entries.push({ account: 'Exchange Fluctuation Gain (P&L)', debit: 0, credit: varianceInr });
    } else if (varianceInr < 0) {
      forexType = 'LOSS';
      const absLoss = Math.abs(varianceInr);
      narration = `Realized Forex Loss on settlement of ${request.invoiceNumber}: ${request.receivedAmountForeign} ${request.currency} realized @ ₹${request.settlementExchangeRate} vs booked @ ₹${request.bookingExchangeRate}.`;
      
      entries.push({ account: bankAccount, debit: realizedInr, credit: 0 });
      entries.push({ account: 'Exchange Fluctuation Loss (P&L)', debit: absLoss, credit: 0 });
      entries.push({ account: debtorAccount, debit: 0, credit: bookedInr });
    } else {
      forexType = 'NIL';
      narration = `Settlement of ${request.invoiceNumber}: ${request.receivedAmountForeign} ${request.currency} realized at unchanged booking rate ₹${request.bookingExchangeRate}.`;
      
      entries.push({ account: bankAccount, debit: realizedInr, credit: 0 });
      entries.push({ account: debtorAccount, debit: 0, credit: bookedInr });
    }

    const unsettledForeign = Math.max(0, request.bookedAmountForeign - request.receivedAmountForeign);
    const isFullySettled = unsettledForeign === 0;

    return {
      invoiceNumber: request.invoiceNumber,
      currency: request.currency,
      receivedAmountForeign: request.receivedAmountForeign,
      bookedValueInr: bookedInr,
      realizedValueInr: realizedInr,
      varianceInr,
      forexType,
      isFullySettled,
      unsettledAmountForeign: unsettledForeign,
      journalVoucher: {
        voucherType: 'JOURNAL',
        voucherNumber: voucherNum,
        date: request.settlementDate,
        narration,
        entries
      }
    };
  }

  /**
   * Fiscal Year-End Mark-To-Market (MTM) Revaluation under Ind AS 21, Paragraph 23(a)
   * Revalues all unsettled foreign currency monetary receivables at closing balance sheet exchange rate.
   */
  public static revalueYearEndReceivables(request: IYearEndRevaluationRequest): IYearEndRevaluationResult {
    let totalCarryingInr = 0;
    let totalRevaluedInr = 0;

    const itemAudits = request.openInvoices.map(inv => {
      const closingRate = request.closingExchangeRates[inv.currency] || inv.bookingExchangeRate;
      const bookedInr = Math.round(inv.unpaidAmountForeign * inv.bookingExchangeRate * 100) / 100;
      const revaluedInr = Math.round(inv.unpaidAmountForeign * closingRate * 100) / 100;
      const variance = Math.round((revaluedInr - bookedInr) * 100) / 100;

      totalCarryingInr += bookedInr;
      totalRevaluedInr += revaluedInr;

      let type: 'GAIN' | 'LOSS' | 'NIL' = 'NIL';
      if (variance > 0) type = 'GAIN';
      else if (variance < 0) type = 'LOSS';

      return {
        invoiceNumber: inv.invoiceNumber,
        currency: inv.currency,
        unpaidForeign: inv.unpaidAmountForeign,
        bookedInr,
        revaluedInr,
        varianceInr: variance,
        type
      };
    });

    const netVariance = Math.round((totalRevaluedInr - totalCarryingInr) * 100) / 100;
    let gainOrLoss: 'GAIN' | 'LOSS' | 'NIL' = 'NIL';
    let revaluationVoucher;

    if (netVariance !== 0) {
      gainOrLoss = netVariance > 0 ? 'GAIN' : 'LOSS';
      const voucherNum = `JV-MTM-${request.asOfDate.replace(/-/g, '')}-FYE`;

      if (gainOrLoss === 'GAIN') {
        revaluationVoucher = {
          voucherType: 'JOURNAL' as const,
          voucherNumber: voucherNum,
          date: request.asOfDate,
          narration: `Ind AS 21 Year-End MTM Revaluation: Unrealized exchange gain on unsettled export receivables as of ${request.asOfDate}.`,
          entries: [
            { account: 'Trade Receivables - Export Debtors (MTM Adjustment)', debit: netVariance, credit: 0 },
            { account: 'Unrealized Foreign Exchange Fluctuation Gain (P&L)', debit: 0, credit: netVariance }
          ]
        };
      } else {
        const absLoss = Math.abs(netVariance);
        revaluationVoucher = {
          voucherType: 'JOURNAL' as const,
          voucherNumber: voucherNum,
          date: request.asOfDate,
          narration: `Ind AS 21 Year-End MTM Revaluation: Unrealized exchange loss on unsettled export receivables as of ${request.asOfDate}.`,
          entries: [
            { account: 'Unrealized Foreign Exchange Fluctuation Loss (P&L)', debit: absLoss, credit: 0 },
            { account: 'Trade Receivables - Export Debtors (MTM Adjustment)', debit: 0, credit: absLoss }
          ]
        };
      }
    }

    return {
      asOfDate: request.asOfDate,
      totalCarryingValueInr: Math.round(totalCarryingInr * 100) / 100,
      totalRevaluedValueInr: Math.round(totalRevaluedInr * 100) / 100,
      netUnrealizedForexVariance: netVariance,
      gainOrLoss,
      items: itemAudits,
      revaluationVoucher
    };
  }
}
