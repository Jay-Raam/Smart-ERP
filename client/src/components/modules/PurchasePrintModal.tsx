import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Eye,
  Building2,
  Truck,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { PDFViewer, BlobProvider } from '@react-pdf/renderer';
import { PurchaseOrder, useErpStore } from '../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../utils/taxCalculation';
import { PurchaseOrderPdfDocument } from '../pdf/PurchaseOrderPdfDocument';
import { RecordPaymentModal } from '../shared/RecordPaymentModal';

interface PurchasePrintModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({ purchaseOrder, onClose }) => {
  const { organisation, branches } = useErpStore();
  const [viewMode, setViewMode] = useState<'html' | 'pdf'>('html');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const branch = branches.find((b) => b.id === purchaseOrder.branchId) || branches[0];
  const isTN = isStateTamilNadu(
    purchaseOrder.vendorState || purchaseOrder.vendorAddress,
    purchaseOrder.vendorGstin
  );

  const taxCalc = calculateDocumentTaxes({
    items:
      purchaseOrder.items && purchaseOrder.items.length > 0
        ? purchaseOrder.items
        : [
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
    shippingCharge: purchaseOrder.shippingCharge || 0,
  });

  const outstanding =
    purchaseOrder.outstandingAmount !== undefined
      ? purchaseOrder.outstandingAmount
      : Math.max(0, purchaseOrder.totalAmount - (purchaseOrder.paidAmount || 0));

  const pdfDoc = <PurchaseOrderPdfDocument po={purchaseOrder} />;

  // Clean isolated print function for Web Sheet that prevents blank screen bugs
  const handlePrintWebSheet = () => {
    const printContent = document.getElementById('po-printable-area');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PO_${purchaseOrder.poNumber}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #fff;
              color: #0f172a;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .po-card {
              max-width: 100% !important;
              border: 1px solid #1e293b !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
          </style>
        </head>
        <body class="p-2">
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const defaultInstructions =
    purchaseOrder.instructions ||
    '1. Deliver to Central Stores Receiving Bay, Ambattur between 09:00 AM - 05:00 PM.\n2. Delivery Challan, Packing List & Invoices must strictly cite this PO Number.\n3. Goods must be packaged safely with protective wrapping against transit corrosion.';

  const defaultQualityTerms =
    purchaseOrder.qualityTerms ||
    '1. All supplied materials must strictly match specification tolerances and engineering drawings.\n2. Manufacturer Test Certificate (MTC) and Certificate of Analysis (CoA) required at gate inward.\n3. Defective or non-compliant lots will be rejected with return freight on supplier account.';

  const defaultCommercialTerms =
    purchaseOrder.termsAndConditions ||
    '1. Payment release: 30 days net following successful GRN quality approval.\n2. Prices are firm, fixed and inclusive of transit insurance up to factory delivery point.\n3. Smart ERP reserves statutory right of audit and dispute escalation under Tamil Nadu jurisdiction.';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden">
        <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Top Bar Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-800 text-white border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                PO
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    Purchase Order &mdash; {purchaseOrder.poNumber}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {purchaseOrder.status || 'APPROVED'}
                  </span>
                  {outstanding > 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      Due: ₹{outstanding.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      Paid in Full
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Vendor: <span className="text-blue-300 font-semibold">{purchaseOrder.vendorName}</span> | Date:{' '}
                  <span className="font-mono text-slate-200">{purchaseOrder.poDate}</span> | Total:{' '}
                  <strong className="text-white font-mono">₹{purchaseOrder.totalAmount.toLocaleString('en-IN')}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-700/70 rounded-lg p-0.5 mr-1 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('html')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition font-semibold cursor-pointer ${
                    viewMode === 'html' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Interactive Web Sheet Preview"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Web Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition font-semibold cursor-pointer ${
                    viewMode === 'pdf' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Vector PDF Document View"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Vector PDF</span>
                </button>
              </div>

              {/* Pay Advance Button if Balance Outstanding */}
              {outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                  title="Record Vendor Advance Payment"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Pay Advance</span>
                </button>
              )}

              {/* Print Button */}
              {viewMode === 'pdf' ? (
                <BlobProvider document={pdfDoc}>
                  {({ blob, loading }) => (
                    <button
                      type="button"
                      disabled={loading || !blob}
                      onClick={() => {
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const w = window.open(url, '_blank');
                          if (w) {
                            w.focus();
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                      title="Print via Vector PDF"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>
                  )}
                </BlobProvider>
              ) : (
                <button
                  type="button"
                  onClick={handlePrintWebSheet}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                  title="Print Web Sheet"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Sheet</span>
                </button>
              )}

              {/* Download Vector PDF Button */}
              <BlobProvider document={pdfDoc}>
                {({ blob, loading }) => (
                  <button
                    type="button"
                    disabled={loading || !blob}
                    onClick={() => {
                      if (blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Purchase_Order_${purchaseOrder.poNumber}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600 hover:text-white transition cursor-pointer disabled:opacity-50"
                    title="Download Official PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
              </BlobProvider>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white transition cursor-pointer ml-1"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 w-full bg-slate-100 overflow-hidden relative">
            {viewMode === 'pdf' ? (
              <div className="w-full h-full">
                <PDFViewer width="100%" height="100%" showToolbar={true} className="border-none">
                  {pdfDoc}
                </PDFViewer>
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto overflow-x-auto p-3 sm:p-6 bg-slate-200/70">
                <div className="min-w-fit flex justify-center py-2">
                  <div
                    id="po-printable-area"
                    className="bg-white text-slate-900 w-full max-w-[820px] p-5 sm:p-7 rounded-xl shadow-xl border border-slate-300 text-[11px] leading-tight space-y-4 shrink-0 mx-auto po-card"
                  >
                    {/* Outer PO Container with Clean Smart ERP Border */}
                    <div className="border border-slate-800">
                      {/* Header Title */}
                      <div className="border-b border-slate-800 bg-blue-700 text-white text-center py-2">
                        <h1 className="text-base font-bold tracking-wider uppercase">PURCHASE ORDER</h1>
                        <div className="text-[10px] text-blue-100 mt-0.5 tracking-wide">
                          Statutory Procurement & Vendor Requisition Document
                        </div>
                      </div>

                      {/* Company & PO Meta Header */}
                      <div className="grid grid-cols-12 border-b border-slate-800">
                        {/* Left: Buyer Details */}
                        <div className="col-span-7 p-3.5 border-r border-slate-800">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-8 w-8 rounded-md bg-blue-700 text-white flex items-center justify-center font-black text-xs">
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
                            <div>
                              <span className="font-semibold text-slate-900">Phone:</span>{' '}
                              {branch?.phone || organisation.phone}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">Email:</span> {organisation.email}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
                              <span className="font-mono font-bold text-blue-700">
                                {branch?.gstin || organisation.gstin}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">CIN:</span>{' '}
                              <span className="font-mono">{organisation.cin}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">State:</span> Tamil Nadu (Code: 33)
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">PAN:</span>{' '}
                              <span className="font-mono">{organisation.pan}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: PO Numbers & Dates */}
                        <div className="col-span-5 p-3.5 flex flex-col justify-between bg-slate-50/50">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-semibold uppercase text-[9.5px]">PO Number:</span>
                              <span className="font-mono font-bold text-sm text-blue-700">
                                {purchaseOrder.poNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">PO Date:</span>
                              <span className="font-mono font-semibold text-slate-800">{purchaseOrder.poDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Expected Delivery:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                {purchaseOrder.expectedDate || 'Immediate'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">PO Status:</span>
                              <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {purchaseOrder.status || 'APPROVED'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Payment Status:</span>
                              <span className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                                {purchaseOrder.paymentStatus || 'UNPAID'} (Paid: ₹{(purchaseOrder.paidAmount || 0).toLocaleString('en-IN')})
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] text-slate-400 text-right">
                            Procurement Requisition Ledger Ref: {purchaseOrder.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* 2-Column Parties: Vendor Details & Factory Delivery Point */}
                      <div className="grid grid-cols-12 border-b border-slate-800">
                        {/* Vendor / Supplier */}
                        <div className="col-span-6 p-3 border-r border-slate-800">
                          <div className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Vendor / Supplier Details</span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs">{purchaseOrder.vendorName}</div>
                          <p className="text-slate-600 text-[10px] mt-0.5 leading-normal whitespace-pre-line">
                            {purchaseOrder.vendorAddress || 'Vendor Plant / Dispatch Location on Record'}
                          </p>
                          <div className="mt-2 space-y-0.5 text-[10px] text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
                              <span className="font-mono font-bold text-blue-700">
                                {purchaseOrder.vendorGstin || 'Unregistered / Not Provided'}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">State:</span>{' '}
                              {purchaseOrder.vendorState || 'Tamil Nadu'}
                            </div>
                          </div>
                        </div>

                        {/* Delivery Destination */}
                        <div className="col-span-6 p-3">
                          <div className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Delivery Destination (Factory Stores)</span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs">
                            {organisation.name} - CENTRAL STORES BAY
                          </div>
                          <p className="text-slate-600 text-[10px] mt-0.5 leading-normal">
                            Plot 14-B, SIDCO Industrial Estate, Ambattur, Chennai, Tamil Nadu - 600058
                          </p>
                          <div className="mt-2 space-y-0.5 text-[10px] text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-900">Destination State:</span> Tamil Nadu (Code
                              33)
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">Contact:</span> Store Receiving Officer (+91
                              44 2250 8899)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Procurement Items Table */}
                      <div className="border-b border-slate-800 overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-800 text-slate-800 font-bold">
                              <th className="p-2 text-center w-8 border-r border-slate-300">#</th>
                              <th className="p-2 text-left border-r border-slate-300">Procurement Item Description</th>
                              <th className="p-2 text-center w-20 border-r border-slate-300">HSN/SAC</th>
                              <th className="p-2 text-right w-16 border-r border-slate-300">Qty</th>
                              <th className="p-2 text-center w-14 border-r border-slate-300">Unit</th>
                              <th className="p-2 text-right w-20 border-r border-slate-300">Rate (₹)</th>
                              <th className="p-2 text-center w-14 border-r border-slate-300">GST %</th>
                              <th className="p-2 text-right w-24">Total Amt (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {taxCalc.items.map((item, index) => {
                              const lineTotal = item.grossAmount || item.quantity * item.unitPrice;
                              return (
                                <tr key={index} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-300">
                                    {index + 1}
                                  </td>
                                  <td className="p-2 border-r border-slate-300">
                                    <div className="font-bold text-slate-900">{item.productName}</div>
                                    {item.sku && (
                                      <div className="text-[9px] text-slate-400 font-mono">SKU: {item.sku}</div>
                                    )}
                                  </td>
                                  <td className="p-2 text-center font-mono text-slate-700 border-r border-slate-300">
                                    {item.hsnCode || '—'}
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                                    {item.quantity}
                                  </td>
                                  <td className="p-2 text-center text-slate-600 border-r border-slate-300">
                                    {item.uom || 'Nos'}
                                  </td>
                                  <td className="p-2 text-right font-mono text-slate-800 border-r border-slate-300">
                                    ₹{item.unitPrice.toFixed(2)}
                                  </td>
                                  <td className="p-2 text-center font-mono font-semibold text-slate-800 border-r border-slate-300">
                                    {item.taxRate}%
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                                    ₹{lineTotal.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Bottom Summary: HSN Summary (Left) / Commercial Totals (Right) */}
                      <div className="grid grid-cols-12 border-b border-slate-800">
                        {/* Left 7 Columns: HSN Summary & Amount in Words */}
                        <div className="col-span-7 p-3.5 border-r border-slate-800 space-y-3">
                          {/* HSN Tax Table */}
                          <div className="rounded border border-slate-200 overflow-hidden">
                            <div className="bg-slate-100 px-2 py-1 font-bold text-[9px] text-slate-700 uppercase tracking-wide border-b border-slate-200">
                              GST Tax Rate Breakdown
                            </div>
                            <table className="w-full text-[9px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                  <th className="p-1 text-left border-r border-slate-200">HSN</th>
                                  <th className="p-1 text-right border-r border-slate-200">Taxable Val</th>
                                  {isTN ? (
                                    <>
                                      <th className="p-1 text-right border-r border-slate-200">CGST</th>
                                      <th className="p-1 text-right border-r border-slate-200">SGST</th>
                                    </>
                                  ) : (
                                    <th className="p-1 text-right border-r border-slate-200">IGST</th>
                                  )}
                                  <th className="p-1 text-right">Tax Amt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taxCalc.hsnSummary.map((hsn, idx) => (
                                  <tr key={idx} className="border-b border-slate-100 font-mono">
                                    <td className="p-1 border-r border-slate-200 font-bold text-slate-800">
                                      {hsn.hsnCode}
                                    </td>
                                    <td className="p-1 text-right border-r border-slate-200">
                                      ₹{hsn.taxableAmount.toFixed(2)}
                                    </td>
                                    {isTN ? (
                                      <>
                                        <td className="p-1 text-right border-r border-slate-200">
                                          ₹{hsn.cgstAmount.toFixed(2)}
                                        </td>
                                        <td className="p-1 text-right border-r border-slate-200">
                                          ₹{hsn.sgstAmount.toFixed(2)}
                                        </td>
                                      </>
                                    ) : (
                                      <td className="p-1 text-right border-r border-slate-200">
                                        ₹{hsn.igstAmount.toFixed(2)}
                                      </td>
                                    )}
                                    <td className="p-1 text-right font-bold text-slate-900">
                                      ₹{hsn.totalTax.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Amount In Words */}
                          <div className="rounded border border-slate-200 bg-slate-50 p-2.5 text-[10px]">
                            <div className="font-semibold text-slate-500 uppercase text-[8.5px]">
                              Total Amount in Words:
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              {taxCalc.totalInWords || `INR ${purchaseOrder.totalAmount.toLocaleString('en-IN')} Only`}
                            </div>
                          </div>
                        </div>

                        {/* Right 5 Columns: Final Totals */}
                        <div className="col-span-5 p-3.5 space-y-2 text-[10.5px]">
                          <div className="flex justify-between text-slate-600">
                            <span>Total Taxable Amount:</span>
                            <span className="font-mono font-semibold text-slate-900">
                              ₹{taxCalc.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {(purchaseOrder.shippingCharge || 0) > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Freight & Logistics:</span>
                              <span className="font-mono font-semibold text-slate-900">
                                ₹{(purchaseOrder.shippingCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {isTN ? (
                            <>
                              <div className="flex justify-between text-slate-600">
                                <span>Add: CGST (Central GST):</span>
                                <span className="font-mono text-slate-800">
                                  ₹{taxCalc.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Add: SGST (State GST):</span>
                                <span className="font-mono text-slate-800">
                                  ₹{taxCalc.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-slate-600">
                              <span>Add: IGST (Integrated GST):</span>
                              <span className="font-mono text-slate-800">
                                ₹{taxCalc.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                            <span>Total GST Tax:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              ₹{taxCalc.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex justify-between items-center rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-xs font-bold text-slate-900 mt-2">
                            <span>Total PO Value:</span>
                            <span className="font-mono text-blue-700 text-sm">
                              ₹{taxCalc.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Payment summary status */}
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                            <div className="flex justify-between text-slate-600">
                              <span>Advance Disbursed:</span>
                              <span className="font-mono font-bold text-emerald-600">
                                ₹{(purchaseOrder.paidAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Balance Payable:</span>
                              <span className={`font-mono font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                ₹{outstanding.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-400 text-right">
                            Subject to Chennai, Tamil Nadu Jurisdiction
                          </div>
                        </div>
                      </div>

                      {/* Full-Width Terms & Quality Standards */}
                      <div className="border-b border-slate-800 bg-slate-50/70 p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-700 uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>PO Instructions, Quality Terms & Commercial Conditions</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[9.5px]">
                          <div className="bg-white border border-slate-200 rounded p-2.5 shadow-2xs space-y-1">
                            <span className="font-bold text-slate-800 uppercase text-[8.5px] block text-blue-800">
                              Dispatch & Store Instructions
                            </span>
                            <p className="text-[9px] text-slate-600 whitespace-pre-line leading-relaxed">
                              {defaultInstructions}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded p-2.5 shadow-2xs space-y-1">
                            <span className="font-bold text-slate-800 uppercase text-[8.5px] block text-blue-800">
                              Quality Assurance & Acceptance Criteria
                            </span>
                            <p className="text-[9px] text-slate-600 whitespace-pre-line leading-relaxed">
                              {defaultQualityTerms}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded p-2.5 shadow-2xs space-y-1">
                            <span className="font-bold text-slate-800 uppercase text-[8.5px] block text-blue-800">
                              Commercial Terms & Conditions
                            </span>
                            <p className="text-[9px] text-slate-600 whitespace-pre-line leading-relaxed">
                              {defaultCommercialTerms}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Full-Width Official Authorization & Signature Block */}
                      <div className="p-4 grid grid-cols-2 gap-12 text-center bg-white">
                        <div>
                          <div className="h-12"></div>
                          <div className="border-t border-slate-400 pt-1.5 font-semibold text-[9.5px] text-slate-700">
                            Vendor Acceptance & Stamp
                          </div>
                          <p className="text-[8.5px] text-slate-400">Supplier Authorized Signatory</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 mb-1">
                            For <span className="font-bold text-slate-800">{organisation.name}</span>
                          </p>
                          <div className="h-8"></div>
                          <div className="border-t border-slate-800 pt-1.5 font-bold text-[10px] text-slate-800">
                            Head of Procurement & Quality Assurance
                          </div>
                          <p className="text-[8.5px] text-slate-400">Official Electronic Approval & Requisition Authority</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Advance Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
          targetType="PO_ADVANCE"
          documentId={purchaseOrder.id}
          documentNumber={purchaseOrder.poNumber}
          partyName={purchaseOrder.vendorName}
          totalAmount={purchaseOrder.totalAmount}
          paidAmount={purchaseOrder.paidAmount || 0}
          outstandingAmount={outstanding}
        />
      )}
    </>
  );
};
