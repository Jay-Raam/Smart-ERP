/**
 * @file calculator.ts
 * @description Precise Indian GST Tax Calculation Engine with half-up rounding and HSN aggregation.
 */

import { determineSupplyType, isUTGSTApplicable, GST_STATE_CODES } from './rules';
import { GSTItemInput, GSTLineItemResult, InvoiceGSTComputationResult, SupplyType } from './types';

/**
 * High-precision rounding to specified decimal places (defaults to 2).
 * Uses half-up method to comply with standard statutory invoicing rounding.
 */
export function roundToPrecision(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates GST components for an individual line item.
 */
export function calculateLineItemGST(
  item: GSTItemInput,
  supplyType: SupplyType,
  supplierStateCode: string
): GSTLineItemResult {
  const quantity = Math.max(0, item.quantity);
  const unitPrice = Math.max(0, item.unitPrice);
  const discountAmount = Math.max(0, item.discountAmount || 0);

  const grossAmount = roundToPrecision(quantity * unitPrice);
  const taxableValue = roundToPrecision(Math.max(0, grossAmount - discountAmount));
  const gstRate = Math.max(0, item.gstRate);
  const cessRate = Math.max(0, item.cessRate || 0);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let utgstRate = 0;
  let utgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (supplyType === 'INTRA_STATE') {
    const halfRate = roundToPrecision(gstRate / 2, 4);
    const halfTax = roundToPrecision((taxableValue * halfRate) / 100);

    cgstRate = halfRate;
    cgstAmount = halfTax;

    if (isUTGSTApplicable(supplierStateCode)) {
      utgstRate = halfRate;
      utgstAmount = halfTax;
    } else {
      sgstRate = halfRate;
      sgstAmount = halfTax;
    }
  } else {
    // INTER_STATE, EXPORT, or SEZ
    igstRate = gstRate;
    igstAmount = roundToPrecision((taxableValue * igstRate) / 100);
  }

  const cessAmount = cessRate > 0 ? roundToPrecision((taxableValue * cessRate) / 100) : 0;
  const totalTax = roundToPrecision(cgstAmount + sgstAmount + utgstAmount + igstAmount + cessAmount);
  const lineTotal = roundToPrecision(taxableValue + totalTax);

  return {
    description: item.description,
    hsnOrSac: item.hsnOrSac.trim(),
    quantity,
    unitPrice,
    grossAmount,
    discountAmount,
    taxableValue,
    gstRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    utgstRate,
    utgstAmount,
    igstRate,
    igstAmount,
    cessRate,
    cessAmount,
    totalTax,
    lineTotal
  };
}

/**
 * Computes full invoice taxation summary, including statutory HSN summary and round-off adjustment.
 */
export function computeInvoiceGST(params: {
  supplierStateCode: string;
  recipientStateCode: string;
  items: GSTItemInput[];
  isExport?: boolean;
  isSEZ?: boolean;
}): InvoiceGSTComputationResult {
  const { supplierStateCode, recipientStateCode, items, isExport = false, isSEZ = false } = params;

  // Validate state codes
  const normalizedSupplierState = supplierStateCode.padStart(2, '0');
  const normalizedRecipientState = recipientStateCode.padStart(2, '0');

  const supplyType = determineSupplyType(normalizedSupplierState, normalizedRecipientState, isExport, isSEZ);

  const calculatedItems = items.map((item) =>
    calculateLineItemGST(item, supplyType, normalizedSupplierState)
  );

  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalUTGST = 0;
  let totalIGST = 0;
  let totalCess = 0;

  // HSN aggregation map
  const hsnMap = new Map<string, {
    hsnOrSac: string;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    utgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalTax: number;
  }>();

  for (const item of calculatedItems) {
    totalTaxableValue += item.taxableValue;
    totalCGST += item.cgstAmount;
    totalSGST += item.sgstAmount;
    totalUTGST += item.utgstAmount;
    totalIGST += item.igstAmount;
    totalCess += item.cessAmount;

    const existingHsn = hsnMap.get(item.hsnOrSac) || {
      hsnOrSac: item.hsnOrSac,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      utgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      totalTax: 0
    };

    existingHsn.taxableValue = roundToPrecision(existingHsn.taxableValue + item.taxableValue);
    existingHsn.cgstAmount = roundToPrecision(existingHsn.cgstAmount + item.cgstAmount);
    existingHsn.sgstAmount = roundToPrecision(existingHsn.sgstAmount + item.sgstAmount);
    existingHsn.utgstAmount = roundToPrecision(existingHsn.utgstAmount + item.utgstAmount);
    existingHsn.igstAmount = roundToPrecision(existingHsn.igstAmount + item.igstAmount);
    existingHsn.cessAmount = roundToPrecision(existingHsn.cessAmount + item.cessAmount);
    existingHsn.totalTax = roundToPrecision(existingHsn.totalTax + item.totalTax);

    hsnMap.set(item.hsnOrSac, existingHsn);
  }

  totalTaxableValue = roundToPrecision(totalTaxableValue);
  totalCGST = roundToPrecision(totalCGST);
  totalSGST = roundToPrecision(totalSGST);
  totalUTGST = roundToPrecision(totalUTGST);
  totalIGST = roundToPrecision(totalIGST);
  totalCess = roundToPrecision(totalCess);

  const totalTax = roundToPrecision(totalCGST + totalSGST + totalUTGST + totalIGST + totalCess);
  const totalBeforeRoundOff = roundToPrecision(totalTaxableValue + totalTax);

  // Statutory round-off to nearest integer (Section 170 of CGST Act)
  const grandTotal = Math.round(totalBeforeRoundOff);
  const roundOff = roundToPrecision(grandTotal - totalBeforeRoundOff);

  return {
    supplyType,
    supplierStateCode: normalizedSupplierState,
    recipientStateCode: normalizedRecipientState,
    totalTaxableValue,
    totalCGST,
    totalSGST,
    totalUTGST,
    totalIGST,
    totalCess,
    totalTax,
    totalBeforeRoundOff,
    roundOff,
    grandTotal,
    hsnSummary: Array.from(hsnMap.values()),
    items: calculatedItems
  };
}
