# @smart-erp/gst-engine 🇮🇳

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/Jay-Raam/Smart-ERP)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org/)

Zero-dependency, production-grade **Indian Goods & Services Tax (GST)** calculation engine. Built strictly in accordance with statutory guidelines by the **GST Council of India** (CGST, SGST, UTGST, IGST, Compensation Cess, and Section 170 Round-off regulations).

---

## Key Features

- 🏛️ **2-Digit State & UT Directory**: Complete state code mapping (`01` to `38`) distinguishing States, Union Territories with legislatures (Delhi, Puducherry, J&K), and Union Territories without legislatures (Chandigarh, Ladakh, Andaman, etc.).
- 🔄 **Automatic Bifurcation**: Automatically detects Intra-State (`CGST` + `SGST`/`UTGST`) vs Inter-State (`IGST`) based on Supplier & Place of Supply (POS) state codes.
- 🏷️ **HSN/SAC Aggregation**: Automatically compiles statutory HSN/SAC summary tables required on Tax Invoices and GSTR-1 filings.
- 🎯 **Statutory Precision Rounding**: Half-up precision rounding algorithm eliminating JavaScript floating-point artifacts (`0.1 + 0.2`), with statutory round-off to the nearest rupee per Section 170 of the CGST Act.
- 📦 **Zero Runtime Dependencies**: Ultra-fast, lightweight, pure TypeScript engine.

---

## Installation

```bash
# Within monorepo workspace
npm install @smart-erp/gst-engine --workspace=server
```

---

## Quick Start

```typescript
import { computeInvoiceGST } from '@smart-erp/gst-engine';

const invoiceTaxation = computeInvoiceGST({
  supplierStateCode: '33',  // Tamil Nadu
  recipientStateCode: '33', // Tamil Nadu (Intra-state)
  items: [
    {
      description: 'Enterprise ERP Server Module',
      hsnOrSac: '84713010',
      quantity: 2,
      unitPrice: 50000,
      discountAmount: 10000,
      gstRate: 18 // 18% slab
    }
  ]
});

console.log(invoiceTaxation.supplyType); // 'INTRA_STATE'
console.log(invoiceTaxation.totalCGST);   // 8100 (9%)
console.log(invoiceTaxation.totalSGST);   // 8100 (9%)
console.log(invoiceTaxation.totalIGST);   // 0
console.log(invoiceTaxation.grandTotal);  // 106200
```

---

## Inter-State Transaction Example

```typescript
const interStateTaxation = computeInvoiceGST({
  supplierStateCode: '33',  // Tamil Nadu
  recipientStateCode: '27', // Maharashtra (Inter-state)
  items: [
    {
      description: 'Industrial Hydraulic Pump',
      hsnOrSac: '84137010',
      quantity: 1,
      unitPrice: 75000,
      gstRate: 18
    }
  ]
});

console.log(interStateTaxation.supplyType); // 'INTER_STATE'
console.log(interStateTaxation.totalIGST);   // 13500 (18%)
console.log(interStateTaxation.grandTotal);  // 88500
```

---

## Statutory Round-Off (Section 170 CGST Act)

Under Indian law, the final invoice payable amount must be rounded off to the nearest Indian Rupee. `@smart-erp/gst-engine` calculates both the unrounded total and the exact fractional round-off delta:

```typescript
console.log(invoiceTaxation.totalBeforeRoundOff); // e.g. 106200.42
console.log(invoiceTaxation.roundOff);            // -0.42
console.log(invoiceTaxation.grandTotal);          // 106200.00
```

---

## Testing

```bash
npm run test --workspace=@smart-erp/gst-engine
```

All calculation routines are tested against GST Council edge cases including zero-rated exports, special economic zones (SEZ), and UTGST rules.
