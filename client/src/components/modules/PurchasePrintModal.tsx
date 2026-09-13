import React from 'react';
import { Printer, X } from 'lucide-react';
import { PurchaseOrder, useErpStore } from '../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../utils/taxCalculation';

interface PurchasePrintModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({ purchaseOrder, onClose }) => {
  const { organisation, branches } = useErpStore();

  const branch = branches.find((b) => b.id === purchaseOrder.branchId) || branches[0];
  const isTN = isStateTamilNadu(purchaseOrder.vendorState || purchaseOrder.vendorAddress, purchaseOrder.vendorGstin);

  const taxCalc = calculateDocumentTaxes({
    items: purchaseOrder.items && purchaseOrder.items.length > 0 ? purchaseOrder.items : [
      {
        productName: 'Raw Titanium / Industrial Material Supplies Batch',
        hsnCode: '81089010',
        quantity: 1,
        unitPrice: purchaseOrder.subtotal || purchaseOrder.totalAmount,
        taxRate: 18,
        discountAmount: purchaseOrder.totalDiscount || 0,
      },
    ],
    billingState: purchaseOrder.vendorState || 'Tamil Nadu',
    partyGstin: purchaseOrder.vendorGstin,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Actions Bar (hidden in print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700 transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-lg hover:bg-white hover:text-slate-900 transition cursor-pointer"
          title="Close Modal"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Printable PO Sheet (A4 Layout) */}
      <div className="po-sheet bg-white text-slate-900 w-full max-w-[850px] my-6 p-8 rounded-xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-6 text-[11px] leading-tight">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .po-sheet, .po-sheet * {
              visibility: visible;
            }
            .po-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 10mm 10mm;
            }
          }
        `}} />

        {/* Outer PO Container with Clean Smart ERP Border */}
        <div className="border border-slate-800">
          {/* Header Title */}
          <div className="border-b border-slate-800 bg-blue-700 text-white text-center py-1.5">
            <h1 className="text-sm font-bold tracking-wider uppercase">PURCHASE ORDER</h1>
          </div>

          {/* Company & PO Meta Header */}
          <div className="grid grid-cols-12 border-b border-slate-800">
            {/* Left: Buyer Details */}
            <div className="col-span-7 p-3 border-r border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-7 w-7 rounded-md bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                  SE
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
                    {organisation.name}
                  </h2>
                  <p className="text-[10px] text-blue-700 font-medium font-mono">
                    {branch?.name || 'Chennai Central HQ & Assembly Plant'}
                  </p>
                </div>
              </div>
              <p className="text-slate-600 text-[10px] leading-normal">
                {branch?.address || organisation.address}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-700">
                <div><span className="font-semibold text-slate-900">Phone:</span> {branch?.phone || organisation.phone}</div>
                <div><span className="font-semibold text-slate-900">Email:</span> {organisation.email}</div>
                <div><span className="font-semibold text-slate-900">GSTIN:</span> <span className="font-mono font-bold text-blue-700">{branch?.gstin || organisation.gstin}</span></div>
                <div><span className="font-semibold text-slate-900">CIN:</span> <span className="font-mono">{organisation.cin}</span></div>
                <div><span className="font-semibold text-slate-900">State:</span> Tamil Nadu (Code: 33)</div>
                <div><span className="font-semibold text-slate-900">PAN:</span> <span className="font-mono">{organisation.pan}</span></div>
              </div>
            </div>

            {/* Right: PO Reference Meta */}
            <div className="col-span-5 p-3 space-y-1 text-[10px]">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">PO Number:</span>
                <span className="font-mono font-bold text-blue-700 text-[11px]">{purchaseOrder.poNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">PO Date:</span>
                <span className="font-semibold text-slate-900">{purchaseOrder.poDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Expected Delivery:</span>
                <span className="font-semibold text-slate-900">{purchaseOrder.expectedDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Status:</span>
                <span className="font-semibold text-emerald-700">{purchaseOrder.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Place of Delivery:</span>
                <span className="font-semibold text-slate-800">{branch?.location || 'Chennai Unit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Mode of Transport:</span>
                <span className="text-slate-700">Surface / Road Logistics</span>
              </div>
            </div>
          </div>

          {/* 2-Column Parties Box: Vendor Details / Ship-to Warehouse */}
          <div className="grid grid-cols-2 border-b border-slate-800">
            {/* Vendor Details */}
            <div className="p-3 border-r border-slate-800">
              <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] text-slate-800 border border-slate-300 rounded mb-1.5 uppercase">
                Vendor / Supplier Details
              </div>
              <div className="font-bold text-slate-900 text-xs mb-1">{purchaseOrder.vendorName}</div>
              <p className="text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                {purchaseOrder.vendorAddress || 'Vendor Plant & Works, Industrial Estate'}
              </p>
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div><span className="font-semibold text-slate-700">GSTIN / UIN:</span> <span className="font-mono font-bold text-blue-700">{purchaseOrder.vendorGstin || '36AAACM2091J1ZB'}</span></div>
                <div><span className="font-semibold text-slate-700">State:</span> {purchaseOrder.vendorState || 'Telangana'}</div>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="p-3">
              <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] text-slate-800 border border-slate-300 rounded mb-1.5 uppercase">
                Delivery Destination (Receiving Stores)
              </div>
              <div className="font-bold text-slate-900 text-xs mb-1">{organisation.name}</div>
              <p className="text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                {purchaseOrder.shippingAddress || branch?.address || organisation.address}
              </p>
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div><span className="font-semibold text-slate-700">Receiving GSTIN:</span> <span className="font-mono font-bold text-blue-700">{branch?.gstin || organisation.gstin}</span></div>
                <div><span className="font-semibold text-slate-700">State:</span> Tamil Nadu (Code: 33)</div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/70 border-b border-slate-800 text-[9.5px] font-bold text-slate-800 uppercase">
                <th className="py-2 px-1.5 text-center border-r border-slate-300 w-8">S.No</th>
                <th className="py-2 px-2 border-r border-slate-300">Item Description</th>
                <th className="py-2 px-1.5 text-center border-r border-slate-300 w-16">HSN/SAC</th>
                <th className="py-2 px-1.5 text-right border-r border-slate-300 w-12">Qty</th>
                <th className="py-2 px-1.5 text-center border-r border-slate-300 w-10">Unit</th>
                <th className="py-2 px-2 text-right border-r border-slate-300 w-20">Rate (₹)</th>
                <th className="py-2 px-2 text-right border-r border-slate-300 w-22">Total Amt</th>
                <th className="py-2 px-1.5 text-right border-r border-slate-300 w-12">Disc %</th>
                <th className="py-2 px-2 text-right border-r border-slate-300 w-16">Com Dis</th>
                <th className="py-2 px-2 text-right w-24">Sub Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[10px]">
              {taxCalc.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="py-2 px-1.5 text-center border-r border-slate-300 text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-2 px-2 border-r border-slate-300 font-medium text-slate-900">
                    <div>{item.productName}</div>
                    {item.sku && <span className="text-[9px] font-mono text-slate-400">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-2 px-1.5 text-center border-r border-slate-300 font-mono text-slate-600">{item.hsnCode}</td>
                  <td className="py-2 px-1.5 text-right border-r border-slate-300 font-mono font-semibold">{item.quantity}</td>
                  <td className="py-2 px-1.5 text-center border-r border-slate-300 text-slate-600">{item.uom || 'Nos'}</td>
                  <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">₹{item.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-1.5 text-right border-r border-slate-300 font-mono text-slate-500">{item.discountPercent || 0}%</td>
                  <td className="py-2 px-2 text-right border-r border-slate-300 font-mono text-slate-500">₹{(item.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">₹{item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}

              {taxCalc.items.length < 3 && Array.from({ length: 3 - taxCalc.items.length }).map((_, i) => (
                <tr key={`pad-${i}`} className="h-6">
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-800 bg-slate-50 font-bold text-[10px]">
                <td colSpan={3} className="py-1.5 px-2 text-right border-r border-slate-300 uppercase">Total Items:</td>
                <td className="py-1.5 px-1.5 text-right border-r border-slate-300 font-mono">{taxCalc.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                <td colSpan={4} className="border-r border-slate-300"></td>
                <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">₹{taxCalc.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-1.5 px-2 text-right font-mono text-blue-700 font-bold">₹{taxCalc.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>

          {/* Lower Grid: HSN Summary & Terms on Left / Totals Box on Right */}
          <div className="grid grid-cols-12 border-t border-slate-800">
            {/* Left 7 Columns: HSN Summary Table + Amount In Words + Terms */}
            <div className="col-span-7 border-r border-slate-800 p-2 space-y-2.5">
              <div>
                <div className="font-bold text-[9.5px] uppercase text-slate-800 mb-1">
                  HSN / SAC Wise Tax Breakdown
                </div>
                <table className="w-full text-left border border-slate-300 text-[9px]">
                  <thead>
                    <tr className="bg-blue-50 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-1 border-r border-slate-300">HSN/SAC</th>
                      <th className="p-1 text-center border-r border-slate-300">Rate</th>
                      <th className="p-1 text-right border-r border-slate-300">Taxable Val</th>
                      {isTN ? (
                        <>
                          <th className="p-1 text-right border-r border-slate-300">CGST</th>
                          <th className="p-1 text-right border-r border-slate-300">SGST</th>
                        </>
                      ) : (
                        <th className="p-1 text-right border-r border-slate-300">IGST</th>
                      )}
                      <th className="p-1 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {taxCalc.hsnSummary.map((hsn, idx) => (
                      <tr key={idx}>
                        <td className="p-1 border-r border-slate-300 font-bold">{hsn.hsnCode}</td>
                        <td className="p-1 text-center border-r border-slate-300">{hsn.taxRate}%</td>
                        <td className="p-1 text-right border-r border-slate-300">₹{hsn.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        {isTN ? (
                          <>
                            <td className="p-1 text-right border-r border-slate-300">₹{hsn.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-1 text-right border-r border-slate-300">₹{hsn.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </>
                        ) : (
                          <td className="p-1 text-right border-r border-slate-300">₹{hsn.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        )}
                        <td className="p-1 text-right font-bold text-slate-900">₹{hsn.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount In Words Box */}
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-[10px]">
                <div className="font-semibold text-slate-500 uppercase text-[8.5px]">Total Amount in Words:</div>
                <div className="font-bold text-slate-900 mt-0.5">{taxCalc.totalInWords}</div>
              </div>

              {/* PO Instructions & Terms */}
              <div className="border border-slate-200 rounded p-1.5 text-[9px] text-slate-600">
                <span className="font-bold text-slate-800 uppercase block mb-0.5">PO Instructions & Quality Terms</span>
                <ol className="list-decimal pl-3 space-y-0.5 text-[8.5px]">
                  <li>Material test certificate (MTC) Grade 1/2 must accompany delivery.</li>
                  <li>Delivery to be completed on or before expected date.</li>
                  <li>Invoice must cite this Purchase Order number for payment release.</li>
                </ol>
              </div>
            </div>

            {/* Right 5 Columns: Final Totals & Authorization */}
            <div className="col-span-5 flex flex-col justify-between p-3">
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount Before Tax:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{taxCalc.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {isTN ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Add: CGST ({taxCalc.items[0]?.taxRate ? taxCalc.items[0].taxRate / 2 : 9}%):</span>
                      <span className="font-mono text-slate-800">₹{taxCalc.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Add: SGST ({taxCalc.items[0]?.taxRate ? taxCalc.items[0].taxRate / 2 : 9}%):</span>
                      <span className="font-mono text-slate-800">₹{taxCalc.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Add: IGST ({taxCalc.items[0]?.taxRate ?? 18}%):</span>
                    <span className="font-mono text-slate-800">₹{taxCalc.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span>Total Tax Amount (GST):</span>
                  <span className="font-mono font-semibold text-slate-800">₹{taxCalc.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Round Off:</span>
                  <span className="font-mono text-slate-600">₹0.00</span>
                </div>

                <div className="flex justify-between items-center rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs font-bold text-slate-900 mt-2">
                  <span>Total PO Value:</span>
                  <span className="font-mono text-blue-700 text-sm">₹{taxCalc.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[9px] text-slate-400 text-right">Subject to Tamil Nadu Jurisdiction</div>
              </div>

              {/* Signature Box */}
              <div className="border-t border-slate-300 pt-4 mt-6 text-center">
                <p className="text-[9px] text-slate-500 mb-6">
                  For <span className="font-semibold text-slate-800">{organisation.name}</span>
                </p>
                <div className="inline-block border-t border-slate-800 px-6 pt-1 font-semibold text-[9.5px] text-slate-700">
                  Authorized Procurement Signatory
                </div>
                <p className="text-[8px] text-slate-400 mt-1">Official Electronic Purchase Order</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
