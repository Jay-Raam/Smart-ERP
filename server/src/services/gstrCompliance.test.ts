import { describe, it, expect } from 'vitest';
import { Gstr1Service } from './gstr1Service';
import { Gstr2bReconService, Gstr2bGovtPayload } from './gstr2bReconService';

describe('GSTR-1 Portal JSON Generator & GSTR-2B ITC Reconciliation Suite', () => {
  describe('Gstr1Service - Statutory GSTN Portal Export', () => {
    it('generates GSTR-1 JSON correctly separating B2B, B2CL, B2CS, and HSN summary', () => {
      const mockInvoices: any[] = [
        // 1. Registered B2B intra-state
        {
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-07-15',
          customerGstin: '33AAACA9823C1Z8',
          placeOfSupply: '33',
          reverseCharge: false,
          items: [
            {
              name: 'Enterprise ERP Server Blade',
              hsnCode: '84713010',
              quantity: 2,
              unitPrice: 50000,
              gstRate: 18
            }
          ]
        },
        // 2. Registered B2B inter-state
        {
          invoiceNumber: 'INV-2026-002',
          invoiceDate: '2026-07-18',
          customerGstin: '27AABCM5678K1Z2', // Maharashtra
          placeOfSupply: '27',
          reverseCharge: false,
          items: [
            {
              name: 'Industrial Fiber Switch',
              hsnCode: '85176290',
              quantity: 1,
              unitPrice: 40000,
              gstRate: 18
            }
          ]
        },
        // 3. Unregistered B2C Large (inter-state > 2.5L)
        {
          invoiceNumber: 'INV-2026-003',
          invoiceDate: '2026-07-20',
          customerGstin: '', // Unregistered
          placeOfSupply: '29', // Karnataka
          reverseCharge: false,
          items: [
            {
              name: 'Heavy Assembly Machinery',
              hsnCode: '84798999',
              quantity: 1,
              unitPrice: 300000,
              gstRate: 18
            }
          ]
        },
        // 4. Unregistered B2C Small (intra-state)
        {
          invoiceNumber: 'INV-2026-004',
          invoiceDate: '2026-07-22',
          customerGstin: '',
          placeOfSupply: '33',
          reverseCharge: false,
          items: [
            {
              name: 'Network Patch Cord',
              hsnCode: '85444299',
              quantity: 5,
              unitPrice: 1000,
              gstRate: 18
            }
          ]
        }
      ];

      const payload = Gstr1Service.generatePortalJson(
        mockInvoices,
        '33AABCS1429B1Z1',
        '072026'
      );

      expect(payload.gstin).toBe('33AABCS1429B1Z1');
      expect(payload.fp).toBe('072026');
      expect(payload.version).toBe('GSTR1_V2.0');
      expect(payload.hash).toBeDefined();

      // B2B assertions
      expect(payload.b2b.length).toBe(2);
      const tnSupplier = payload.b2b.find((b) => b.ctin === '33AAACA9823C1Z8');
      expect(tnSupplier).toBeDefined();
      expect(tnSupplier?.inv[0].inum).toBe('INV-2026-001');
      expect(tnSupplier?.inv[0].itms[0].itm_det.camt).toBe(9000);
      expect(tnSupplier?.inv[0].itms[0].itm_det.samt).toBe(9000);
      expect(tnSupplier?.inv[0].itms[0].itm_det.iamt).toBe(0);

      // B2CL assertions
      expect(payload.b2cl.length).toBe(1);
      expect(payload.b2cl[0].inv[0].inum).toBe('INV-2026-003');
      expect(payload.b2cl[0].inv[0].val).toBe(354000);

      // B2CS assertions
      expect(payload.b2cs.length).toBeGreaterThan(0);
      const b2csTn = payload.b2cs.find((b) => b.pos === '33');
      expect(b2csTn).toBeDefined();
      expect(b2csTn?.txval).toBe(5000);
      expect(b2csTn?.camt).toBe(450);

      // HSN summary table
      expect(payload.hsn.data.length).toBe(4);
      expect(payload.summary.totalTaxableValue).toBe(445000);
      expect(payload.summary.totalTax).toBe(80100);
    });
  });

  describe('Gstr2bReconService - ITC Leak & Compliance Reconciliation', () => {
    it('correctly audits matched, missing in 2B, and rate discrepancies', () => {
      // Internal recorded Purchase Bills
      const mockBills: any[] = [
        // 1. Matched with 2B
        {
          billNumber: 'BILL/2026/01',
          billDate: '2026-07-10',
          vendorGstin: '33AABCV1234F1Z9',
          vendorName: 'Acme Steel Supplies',
          items: [
            {
              name: 'Cold Rolled Steel Coils',
              quantity: 10,
              unitPrice: 10000,
              gstRate: 18
            }
          ]
        },
        // 2. Vendor billed, but missing in GSTR-2B (Vendor failed to file return)
        {
          billNumber: 'BILL/2026/02',
          billDate: '2026-07-12',
          vendorGstin: '33ZZZPD9999M1Z3',
          vendorName: 'Defaulting Vendor Corp',
          items: [
            {
              name: 'Industrial Lubricant Drums',
              quantity: 2,
              unitPrice: 25000,
              gstRate: 18
            }
          ]
        },
        // 3. Tax / Rate mismatch (Company booked 18%, Vendor filed 12%)
        {
          billNumber: 'BILL/2026/03',
          billDate: '2026-07-14',
          vendorGstin: '33AABCM8888D1Z5',
          vendorName: 'Mismatched Hardware Ltd',
          items: [
            {
              name: 'Standard Fasteners Box',
              quantity: 1,
              unitPrice: 50000,
              gstRate: 18 // Book tax: 9000
            }
          ]
        }
      ];

      // Government GSTR-2B JSON
      const mockGovt2b: Gstr2bGovtPayload = {
        gstin: '33AABCS1429B1Z1',
        fp: '072026',
        data: {
          b2b: [
            {
              ctin: '33AABCV1234F1Z9',
              trdnm: 'Acme Steel Supplies',
              inv: [
                {
                  inum: 'BILL-2026-01', // Normalization test (hyphen vs slash)
                  idt: '10-07-2026',
                  val: 118000,
                  itcavl: 'Y',
                  itms: [
                    {
                      txval: 100000,
                      rt: 18,
                      camt: 9000,
                      samt: 9000
                    }
                  ]
                }
              ]
            },
            {
              ctin: '33AABCM8888D1Z5',
              trdnm: 'Mismatched Hardware Ltd',
              inv: [
                {
                  inum: 'BILL/2026/03',
                  idt: '14-07-2026',
                  val: 56000,
                  itcavl: 'Y',
                  itms: [
                    {
                      txval: 50000,
                      rt: 12,
                      camt: 3000,
                      samt: 3000 // Total tax: 6000 (diff: 3000)
                    }
                  ]
                }
              ]
            },
            // 4. Supplier reported invoice not entered into company books
            {
              ctin: '29AABCK7777N1Z8',
              trdnm: 'Unrecorded Logistics Bengaluru',
              inv: [
                {
                  inum: 'LOG-2026-99',
                  idt: '16-07-2026',
                  val: 23600,
                  itcavl: 'Y',
                  itms: [
                    {
                      txval: 20000,
                      rt: 18,
                      iamt: 3600
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      const result = Gstr2bReconService.reconcile(mockBills, mockGovt2b);

      expect(result.taxPeriod).toBe('072026');
      expect(result.totalBillsAudited).toBe(3);
      expect(result.matchedCount).toBe(1);
      expect(result.missingIn2bCount).toBe(1);
      expect(result.mismatchCount).toBe(1);
      expect(result.missingInBooksCount).toBe(1);

      // Financial telemetry
      expect(result.totalEligibleItc).toBe(18000); // 9000 CGST + 9000 SGST
      expect(result.totalItcAtRisk).toBe(18000);   // 9000 (Defaulting Vendor) + 9000 (Mismatched Hardware)
      expect(result.unrecordedItcOpportunity).toBe(3600); // Logistics invoice

      // Check item-level findings
      const matchedItem = result.items.find((i) => i.billNumber === 'BILL/2026/01');
      expect(matchedItem?.matchStatus).toBe('MATCHED');
      expect(matchedItem?.isItcClaimable).toBe(true);

      const missing2bItem = result.items.find((i) => i.billNumber === 'BILL/2026/02');
      expect(missing2bItem?.matchStatus).toBe('MISSING_IN_2B');
      expect(missing2bItem?.isItcClaimable).toBe(false);

      const mismatchedItem = result.items.find((i) => i.billNumber === 'BILL/2026/03');
      expect(mismatchedItem?.matchStatus).toBe('TAX_AMOUNT_MISMATCH');
      expect(mismatchedItem?.isItcClaimable).toBe(false);

      const unrecordedItem = result.items.find((i) => i.billNumber === 'LOG-2026-99');
      expect(unrecordedItem?.matchStatus).toBe('MISSING_IN_BOOKS');
      expect(unrecordedItem?.isItcClaimable).toBe(false);
    });
  });
});
