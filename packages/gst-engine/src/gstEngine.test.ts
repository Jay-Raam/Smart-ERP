import { describe, it, expect } from 'vitest';
import {
  computeInvoiceGST,
  calculateLineItemGST,
  roundToPrecision,
  determineSupplyType,
  isUTGSTApplicable,
  GST_STATE_CODES
} from './index';

describe('@smart-erp/gst-engine - Statutory India GST Engine Tests', () => {
  it('correctly maps 2-digit Indian State Codes and flags UTs', () => {
    expect(GST_STATE_CODES['33'].name).toBe('Tamil Nadu');
    expect(GST_STATE_CODES['33'].isUnionTerritory).toBe(false);

    // Chandigarh is UT without legislature -> UTGST
    expect(isUTGSTApplicable('04')).toBe(true);

    // Delhi is UT with legislature -> SGST
    expect(isUTGSTApplicable('07')).toBe(false);
  });

  it('determines supply type correctly for intra-state and inter-state trade', () => {
    expect(determineSupplyType('33', '33')).toBe('INTRA_STATE');
    expect(determineSupplyType('33', '29')).toBe('INTER_STATE');
    expect(determineSupplyType('33', '29', true)).toBe('EXPORT');
    expect(determineSupplyType('33', '33', false, true)).toBe('SEZ');
  });

  it('calculates intra-state GST (CGST 9% + SGST 9% on 18% slab)', () => {
    const result = computeInvoiceGST({
      supplierStateCode: '33', // Tamil Nadu
      recipientStateCode: '33', // Tamil Nadu
      items: [
        {
          description: 'Enterprise ERP Server Module',
          hsnOrSac: '84713010',
          quantity: 2,
          unitPrice: 50000,
          discountAmount: 10000,
          gstRate: 18
        }
      ]
    });

    expect(result.supplyType).toBe('INTRA_STATE');
    // Gross: 100,000, Discount: 10,000 -> Taxable: 90,000
    expect(result.totalTaxableValue).toBe(90000);
    // CGST 9%: 8,100 | SGST 9%: 8,100 | IGST: 0
    expect(result.totalCGST).toBe(8100);
    expect(result.totalSGST).toBe(8100);
    expect(result.totalIGST).toBe(0);
    expect(result.totalTax).toBe(16200);
    expect(result.grandTotal).toBe(106200);
    expect(result.roundOff).toBe(0);
  });

  it('calculates inter-state GST (IGST 18% slab)', () => {
    const result = computeInvoiceGST({
      supplierStateCode: '33', // Tamil Nadu
      recipientStateCode: '27', // Maharashtra
      items: [
        {
          description: 'Industrial Hydraulic Pump',
          hsnOrSac: '84137010',
          quantity: 1,
          unitPrice: 75000,
          discountAmount: 0,
          gstRate: 18
        }
      ]
    });

    expect(result.supplyType).toBe('INTER_STATE');
    expect(result.totalTaxableValue).toBe(75000);
    expect(result.totalCGST).toBe(0);
    expect(result.totalSGST).toBe(0);
    expect(result.totalIGST).toBe(13500);
    expect(result.grandTotal).toBe(88500);
  });

  it('applies UTGST instead of SGST for Union Territories without state legislature', () => {
    const result = computeInvoiceGST({
      supplierStateCode: '04', // Chandigarh
      recipientStateCode: '04', // Chandigarh
      items: [
        {
          description: 'Logistics Storage Crate',
          hsnOrSac: '39231090',
          quantity: 10,
          unitPrice: 1500,
          gstRate: 12
        }
      ]
    });

    expect(result.supplyType).toBe('INTRA_STATE');
    expect(result.totalTaxableValue).toBe(15000);
    expect(result.totalCGST).toBe(900); // 6%
    expect(result.totalUTGST).toBe(900); // 6% UTGST
    expect(result.totalSGST).toBe(0);
    expect(result.totalIGST).toBe(0);
    expect(result.grandTotal).toBe(16800);
  });

  it('aggregates multi-item invoice with statutory HSN grouping and Section 170 round-off', () => {
    const result = computeInvoiceGST({
      supplierStateCode: '33',
      recipientStateCode: '33',
      items: [
        {
          description: 'Software Consulting SAC 998314',
          hsnOrSac: '998314',
          quantity: 1,
          unitPrice: 12500.33,
          gstRate: 18
        },
        {
          description: 'Printed Manuals HSN 49011010',
          hsnOrSac: '49011010',
          quantity: 5,
          unitPrice: 320.50,
          gstRate: 5
        }
      ]
    });

    expect(result.hsnSummary.length).toBe(2);
    // Check round-off accuracy
    expect(result.grandTotal).toBe(Math.round(result.totalBeforeRoundOff));
    expect(roundToPrecision(result.totalBeforeRoundOff + result.roundOff)).toBe(result.grandTotal);
  });

  it('handles half-up floating precision without rounding errors', () => {
    expect(roundToPrecision(0.1 + 0.2)).toBe(0.3);
    expect(roundToPrecision(10.555, 2)).toBe(10.56);
    expect(roundToPrecision(10.554, 2)).toBe(10.55);
  });
});
