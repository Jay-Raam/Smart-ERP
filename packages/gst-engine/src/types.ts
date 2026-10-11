/**
 * @file types.ts
 * @description Core types for the @smart-erp/gst-engine Indian GST taxation calculator.
 */

export type SupplyType = 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT' | 'SEZ';

export interface StateInfo {
  code: string; // 2-digit GST state code, e.g., '33' for Tamil Nadu
  name: string;
  isUnionTerritory: boolean;
  hasStateLegislature?: boolean; // Delhi (07), Puducherry (34), Jammu & Kashmir (08)
}

export interface GSTItemInput {
  description: string;
  hsnOrSac: string; // 4, 6, or 8 digits
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  gstRate: number; // e.g. 5, 12, 18, 28
  cessRate?: number; // e.g. 12% for luxury goods
}

export interface GSTLineItemResult {
  description: string;
  hsnOrSac: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  utgstRate: number;
  utgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface InvoiceGSTComputationResult {
  supplyType: SupplyType;
  supplierStateCode: string;
  recipientStateCode: string;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalUTGST: number;
  totalIGST: number;
  totalCess: number;
  totalTax: number;
  totalBeforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
  hsnSummary: Array<{
    hsnOrSac: string;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    utgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalTax: number;
  }>;
  items: GSTLineItemResult[];
}
