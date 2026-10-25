import { IInvoice } from '../models/ErpModels';
import crypto from 'crypto';

export interface Gstr1ItemDetail {
  rt: number;      // Tax rate, e.g. 18.0
  txval: number;   // Taxable value
  iamt: number;    // IGST amount
  camt: number;    // CGST amount
  samt: number;    // SGST amount
  csamt: number;   // Cess amount
}

export interface Gstr1InvoiceItem {
  num: number;
  itm_det: Gstr1ItemDetail;
}

export interface Gstr1InvoiceRecord {
  inum: string;
  idt: string;    // DD-MM-YYYY format
  val: number;    // Total invoice value
  pos: string;    // 2-digit Place of Supply
  rchrg: 'Y' | 'N';
  inv_typ: 'R' | 'SEZWP' | 'SEZWOP' | 'DE'; // Regular, SEZ with/without payment, Deemed Export
  itms: Gstr1InvoiceItem[];
}

export interface Gstr1B2BSupplierGroup {
  ctin: string; // Customer GSTIN
  inv: Gstr1InvoiceRecord[];
}

export interface Gstr1HsnRecord {
  num: number;
  hsn_sc: string;
  desc: string;
  uqc: string;
  qty: number;
  val: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface Gstr1PortalPayload {
  gstin: string;
  fp: string;        // Tax period: MMYYYY
  version: string;
  hash: string;
  cur_gt?: number;
  b2b: Gstr1B2BSupplierGroup[];
  b2cl: Array<{
    pos: string;
    inv: Gstr1InvoiceRecord[];
  }>;
  b2cs: Array<{
    sply_ty: 'INTRA' | 'INTER';
    pos: string;
    rt: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  }>;
  hsn: {
    data: Gstr1HsnRecord[];
  };
  summary: {
    totalInvoices: number;
    totalTaxableValue: number;
    totalIGST: number;
    totalCGST: number;
    totalSGST: number;
    totalTax: number;
    totalInvoiceValue: number;
  };
}

export class Gstr1Service {
  /**
   * Generates a fully-compliant statutory GSTN GSTR-1 portal payload JSON.
   */
  static generatePortalJson(
    invoices: IInvoice[],
    supplierGstin: string,
    taxPeriod: string // e.g. '072026'
  ): Gstr1PortalPayload {
    const cleanSupplierGstin = supplierGstin.trim().toUpperCase();
    const supplierState = cleanSupplierGstin.substring(0, 2);

    const b2bMap = new Map<string, Gstr1InvoiceRecord[]>();
    const b2clInvoices: Gstr1InvoiceRecord[] = [];
    const b2csMap = new Map<string, {
      sply_ty: 'INTRA' | 'INTER';
      pos: string;
      rt: number;
      txval: number;
      iamt: number;
      camt: number;
      samt: number;
      csamt: number;
    }>();

    const hsnMap = new Map<string, Gstr1HsnRecord>();

    let totalTaxableValue = 0;
    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalInvoiceValue = 0;

    for (const inv of invoices) {
      // Skip draft or cancelled invoices
      if ((inv as any).status === 'CANCELLED' || (inv as any).status === 'VOID') {
        continue;
      }

      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date();
      const formattedDate = `${String(invDate.getDate()).padStart(2, '0')}-${String(invDate.getMonth() + 1).padStart(2, '0')}-${invDate.getFullYear()}`;
      
      const posState = ((inv as any).placeOfSupply || (inv as any).billingAddress?.state || supplierState).padStart(2, '0');
      const isInterState = posState !== supplierState;

      // Compile line items into rate groups
      const rateGroupMap = new Map<number, Gstr1ItemDetail>();
      let invTaxableSum = 0;
      let invIgstSum = 0;
      let invCgstSum = 0;
      let invSgstSum = 0;

      const items = inv.items || [];
      for (const item of items) {
        const rate = (item as any).taxRate ?? (item as any).gstRate ?? 18;
        const qty = item.quantity || 1;
        const unitRate = (item as any).unitRate ?? (item as any).unitPrice ?? (item as any).rate ?? 0;
        const itemTaxable = Math.round(((qty * unitRate) - ((item as any).discount || 0)) * 100) / 100;

        let igst = 0;
        let cgst = 0;
        let sgst = 0;

        if (isInterState) {
          igst = Math.round((itemTaxable * (rate / 100)) * 100) / 100;
        } else {
          cgst = Math.round((itemTaxable * ((rate / 2) / 100)) * 100) / 100;
          sgst = Math.round((itemTaxable * ((rate / 2) / 100)) * 100) / 100;
        }

        invTaxableSum += itemTaxable;
        invIgstSum += igst;
        invCgstSum += cgst;
        invSgstSum += sgst;

        const existingRateGroup = rateGroupMap.get(rate) || {
          rt: rate,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        };

        existingRateGroup.txval = Math.round((existingRateGroup.txval + itemTaxable) * 100) / 100;
        existingRateGroup.iamt = Math.round((existingRateGroup.iamt + igst) * 100) / 100;
        existingRateGroup.camt = Math.round((existingRateGroup.camt + cgst) * 100) / 100;
        existingRateGroup.samt = Math.round((existingRateGroup.samt + sgst) * 100) / 100;
        rateGroupMap.set(rate, existingRateGroup);

        // HSN aggregation
        const hsnCode = ((item as any).hsnCode || (item as any).hsnOrSac || '998314').trim();
        const existingHsn = hsnMap.get(hsnCode) || {
          num: hsnMap.size + 1,
          hsn_sc: hsnCode,
          desc: (item as any).productName || (item as any).name || 'Goods/Services',
          uqc: 'NOS',
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        };

        existingHsn.qty += qty;
        existingHsn.txval = Math.round((existingHsn.txval + itemTaxable) * 100) / 100;
        existingHsn.iamt = Math.round((existingHsn.iamt + igst) * 100) / 100;
        existingHsn.camt = Math.round((existingHsn.camt + cgst) * 100) / 100;
        existingHsn.samt = Math.round((existingHsn.samt + sgst) * 100) / 100;
        existingHsn.val = Math.round((existingHsn.txval + existingHsn.iamt + existingHsn.camt + existingHsn.samt) * 100) / 100;
        hsnMap.set(hsnCode, existingHsn);
      }

      const invTotalTax = Math.round((invIgstSum + invCgstSum + invSgstSum) * 100) / 100;
      const invTotalVal = Math.round((invTaxableSum + invTotalTax) * 100) / 100;

      totalTaxableValue += invTaxableSum;
      totalIGST += invIgstSum;
      totalCGST += invCgstSum;
      totalSGST += invSgstSum;
      totalInvoiceValue += invTotalVal;

      const gstrItems: Gstr1InvoiceItem[] = Array.from(rateGroupMap.values()).map((rg, idx) => ({
        num: idx + 1,
        itm_det: rg
      }));

      const record: Gstr1InvoiceRecord = {
        inum: inv.invoiceNumber,
        idt: formattedDate,
        val: invTotalVal,
        pos: posState,
        rchrg: (inv as any).reverseCharge ? 'Y' : 'N',
        inv_typ: 'R',
        itms: gstrItems
      };

      const customerGstin = ((inv as any).customerGstin || (inv as any).customerGst || '').trim().toUpperCase();

      if (customerGstin && customerGstin.length === 15) {
        // B2B Supply
        const existingGroup = b2bMap.get(customerGstin) || [];
        existingGroup.push(record);
        b2bMap.set(customerGstin, existingGroup);
      } else if (isInterState && invTotalVal > 250000) {
        // B2C Large (Inter-state unregistered > ₹2.5 Lakhs)
        b2clInvoices.push(record);
      } else {
        // B2C Small
        for (const rg of rateGroupMap.values()) {
          const b2csKey = `${posState}_${rg.rt}`;
          const existingB2cs = b2csMap.get(b2csKey) || {
            sply_ty: isInterState ? 'INTER' : 'INTRA',
            pos: posState,
            rt: rg.rt,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0
          };

          existingB2cs.txval = Math.round((existingB2cs.txval + rg.txval) * 100) / 100;
          existingB2cs.iamt = Math.round((existingB2cs.iamt + rg.iamt) * 100) / 100;
          existingB2cs.camt = Math.round((existingB2cs.camt + rg.camt) * 100) / 100;
          existingB2cs.samt = Math.round((existingB2cs.samt + rg.samt) * 100) / 100;
          b2csMap.set(b2csKey, existingB2cs);
        }
      }
    }

    const b2b: Gstr1B2BSupplierGroup[] = Array.from(b2bMap.entries()).map(([ctin, invList]) => ({
      ctin,
      inv: invList
    }));

    const b2cl = b2clInvoices.length > 0 ? [{
      pos: b2clInvoices[0].pos,
      inv: b2clInvoices
    }] : [];

    const b2cs = Array.from(b2csMap.values());
    const hsnData = Array.from(hsnMap.values());

    // Deterministic payload hash for audit trail
    const hashPayload = `${cleanSupplierGstin}_${taxPeriod}_${totalTaxableValue}_${totalInvoiceValue}`;
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    return {
      gstin: cleanSupplierGstin,
      fp: taxPeriod,
      version: 'GSTR1_V2.0',
      hash,
      b2b,
      b2cl,
      b2cs,
      hsn: {
        data: hsnData
      },
      summary: {
        totalInvoices: invoices.length,
        totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
        totalIGST: Math.round(totalIGST * 100) / 100,
        totalCGST: Math.round(totalCGST * 100) / 100,
        totalSGST: Math.round(totalSGST * 100) / 100,
        totalTax: Math.round((totalIGST + totalCGST + totalSGST) * 100) / 100,
        totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100
      }
    };
  }
}
