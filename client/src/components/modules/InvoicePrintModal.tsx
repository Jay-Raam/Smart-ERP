import React from 'react';
import { Printer, X } from 'lucide-react';
import { Invoice, useErpStore } from '../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../utils/taxCalculation';

interface InvoicePrintModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { organisation, branches } = useErpStore();

  const branch = branches.find((b) => b.id === invoice.branchId) || branches[0];
  const isTN = isStateTamilNadu(invoice.customerState || invoice.billingAddress, invoice.customerGstin);

  const taxCalc = calculateDocumentTaxes({
    items: invoice.items && invoice.items.length > 0 ? invoice.items : [
      {
        productName: 'Standard Manufactured Industrial Component Batch',
        hsnCode: '84199090',
        quantity: 1,
        unitPrice: invoice.subtotal || 0,
        taxRate: invoice.gstRate || 18,
        discountAmount: invoice.totalDiscount || 0,
      },
    ],
    billingState: invoice.customerState || 'Tamil Nadu',
    partyGstin: invoice.customerGstin,
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

      {/* Printable Invoice Sheet (A4 Layout) */}
      <div className="invoice-sheet bg-white text-slate-900 w-full max-w-[850px] my-6 p-8 rounded-xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-6 text-[11px] leading-tight">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-sheet, .invoice-sheet * {
              visibility: visible;
            }
            .invoice-sheet {
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

        {/* Outer Invoice Container with Clean Smart ERP Border */}
        <div className="border border-slate-800">
          {/* Header Title */}
          <div className="border-b border-slate-800 bg-blue-700 text-white text-center py-1.5">
            <h1 className="text-sm font-bold tracking-wider uppercase">TAX INVOICE</h1>
          </div>

          {/* Company & Invoice Meta Header */}
          <div className="grid grid-cols-12 border-b border-slate-800">
            {/* Left: Company Details */}
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

            {/* Right: Invoice Reference Meta */}
            <div className="col-span-5 p-3 space-y-1 text-[10px]">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Invoice No:</span>
                <span className="font-mono font-bold text-blue-700 text-[11px]">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Invoice Date:</span>
                <span className="font-semibold text-slate-900">{invoice.invoiceDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Due Date:</span>
                <span className="font-semibold text-slate-900">{invoice.dueDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">SO Reference:</span>
                <span className="font-mono font-semibold text-slate-800">{invoice.salesOrderNumber || 'SO-DIRECT'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Reverse Charge:</span>
                <span className="font-semibold text-slate-800">No</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-semibold text-slate-600">Place of Supply:</span>
                <span className="font-semibold text-slate-800">{invoice.customerState || 'Tamil Nadu'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Transport / Dispatch:</span>
                <span className="text-slate-700">Dedicated Heavy Truck</span>
              </div>
            </div>
          </div>

          {/* 2-Column Parties Box: Billed To / Shipped To */}
          <div className="grid grid-cols-2 border-b border-slate-800">
            {/* Billed To */}
            <div className="p-3 border-r border-slate-800">
              <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] text-slate-800 border border-slate-300 rounded mb-1.5 uppercase">
                Billed To (Customer Details)
              </div>
              <div className="font-bold text-slate-900 text-xs mb-1">{invoice.customerName}</div>
              <p className="text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                {invoice.billingAddress || 'Industrial Complex, Sriperumbudur, Tamil Nadu'}
              </p>
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div><span className="font-semibold text-slate-700">GSTIN / UIN:</span> <span className="font-mono font-bold text-blue-700">{invoice.customerGstin || '33AAACB1234P1ZL'}</span></div>
                <div><span className="font-semibold text-slate-700">State:</span> {invoice.customerState || 'Tamil Nadu'}</div>
              </div>
            </div>

            {/* Shipped To */}
            <div className="p-3">
              <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] text-slate-800 border border-slate-300 rounded mb-1.5 uppercase">
                Shipped To (Delivery Destination)
              </div>
              <div className="font-bold text-slate-900 text-xs mb-1">{invoice.customerName}</div>
              <p className="text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                {invoice.shippingAddress || invoice.billingAddress || 'Central Stores Unit, Industrial Park, Tamil Nadu'}
              </p>
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div><span className="font-semibold text-slate-700">GSTIN / UIN:</span> <span className="font-mono font-bold text-blue-700">{invoice.customerGstin || '33AAACB1234P1ZL'}</span></div>
                <div><span className="font-semibold text-slate-700">State:</span> {invoice.customerState || 'Tamil Nadu'}</div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/70 border-b border-slate-800 text-[9.5px] font-bold text-slate-800 uppercase">
                <th className="py-2 px-1.5 text-center border-r border-slate-300 w-8">S.No</th>
                <th className="py-2 px-2 border-r border-slate-300">Description of Goods</th>
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

          {/* Lower Grid: HSN Summary & Bank details on Left / Totals Box on Right */}
          <div className="grid grid-cols-12 border-t border-slate-800">
            {/* Left 7 Columns: HSN Summary Table + Amount In Words + Bank Details */}
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

              {/* Bank Details & Terms */}
              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-600">
                <div className="border border-slate-200 rounded p-1.5">
                  <span className="font-bold text-slate-800 uppercase block mb-0.5">Company Bank Details</span>
                  <div>Bank Name: <span className="font-semibold text-slate-900">HDFC Bank Ltd</span></div>
                  <div>A/c No: <span className="font-mono font-semibold text-slate-900">50200088192019</span></div>
                  <div>IFSC: <span className="font-mono font-semibold text-slate-900">HDFC0000128</span></div>
                  <div>Branch: <span className="text-slate-800">Guindy Industrial Estate, Chennai</span></div>
                </div>
                <div className="border border-slate-200 rounded p-1.5">
                  <span className="font-bold text-slate-800 uppercase block mb-0.5">Terms & Conditions</span>
                  <ol className="list-decimal pl-3 space-y-0.5 text-[8.5px]">
                    <li>Goods once sold will not be taken back.</li>
                    <li>Interest @18% p.a. charged if unpaid by due date.</li>
                    <li>Subject to Chennai jurisdiction only.</li>
                  </ol>
                </div>
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
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono text-blue-700 text-sm">₹{taxCalc.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[9px] text-slate-400 text-right">GST Payable on Reverse Charge: No</div>
              </div>

              {/* Signature Box */}
              <div className="border-t border-slate-300 pt-4 mt-6 text-center">
                <p className="text-[9px] text-slate-500 mb-6">
                  For <span className="font-semibold text-slate-800">{organisation.name}</span>
                </p>
                <div className="inline-block border-t border-slate-800 px-6 pt-1 font-semibold text-[9.5px] text-slate-700">
                  Authorized Signatory
                </div>
                <p className="text-[8px] text-slate-400 mt-1">This is a Computer Generated Tax Invoice</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
