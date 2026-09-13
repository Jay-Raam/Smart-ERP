import React, { useState } from 'react';
import { Download, Printer, X, Eye, FileText } from 'lucide-react';
import { PDFViewer, PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { Invoice, useErpStore } from '../../store/erpStore';
import { TaxInvoicePdfDocument } from './invoices/TaxInvoicePdfDocument';

interface InvoicePrintModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { organisation, branches, bankAccounts } = useErpStore();
  const [viewMode, setViewMode] = useState<'pdf' | 'html'>('pdf');

  const branch = branches.find((b) => b.id === invoice.branchId) || branches[0];
  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];

  const handlePrintBlob = (blob: Blob | null) => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    };
  };

  const pdfDoc = (
    <TaxInvoicePdfDocument
      invoice={invoice}
      organisation={organisation}
      branch={branch}
      bankAccount={primaryBank}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              PDF
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Tax Invoice Preview &mdash; {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-300">
                Customer: <span className="text-blue-300 font-medium">{invoice.customerName}</span> | ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-700/60 rounded-lg p-0.5 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('pdf')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  viewMode === 'pdf' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Vector PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('html')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  viewMode === 'html' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Web Sheet</span>
              </button>
            </div>

            {/* Direct Vector Print Button via BlobProvider */}
            <BlobProvider document={pdfDoc}>
              {({ blob, loading }) => (
                <button
                  type="button"
                  disabled={loading || !blob}
                  onClick={() => handlePrintBlob(blob)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  title="Print vector PDF directly"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{loading ? 'Preparing...' : 'Print PDF'}</span>
                </button>
              )}
            </BlobProvider>

            {/* Direct Vector Download Button */}
            <PDFDownloadLink
              document={pdfDoc}
              fileName={`Tax_Invoice_${invoice.invoiceNumber}.pdf`}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
            >
              {({ loading }) => (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{loading ? 'Generating...' : 'Download PDF'}</span>
                </>
              )}
            </PDFDownloadLink>

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

        {/* Modal Main Content */}
        <div className="flex-1 w-full bg-slate-100 overflow-hidden relative">
          {viewMode === 'pdf' ? (
            <div className="w-full h-full">
              <PDFViewer width="100%" height="100%" showToolbar={true} className="border-none">
                {pdfDoc}
              </PDFViewer>
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto p-4 flex justify-center">
              <div className="bg-white text-slate-900 w-full max-w-[850px] p-8 rounded-lg shadow-md border border-slate-200 text-[11px] leading-tight">
                {/* Visual Header */}
                <div className="border border-slate-800">
                  <div className="border-b border-slate-800 bg-blue-700 text-white text-center py-1.5">
                    <h1 className="text-sm font-bold tracking-wider uppercase">TAX INVOICE</h1>
                  </div>

                  {/* Company & Meta */}
                  <div className="grid grid-cols-12 border-b border-slate-800">
                    <div className="col-span-7 p-3 border-r border-slate-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-md bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                          SE
                        </div>
                        <div>
                          <h2 className="text-xs font-bold text-slate-900">{organisation.name}</h2>
                          <p className="text-[10px] text-blue-700 font-medium">{branch?.name || 'Chennai Central HQ'}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[10px]">{branch?.address || organisation.address}</p>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-700">
                        <div><span className="font-semibold">Phone:</span> {branch?.phone || organisation.phone}</div>
                        <div><span className="font-semibold">Email:</span> {organisation.email}</div>
                        <div><span className="font-semibold">GSTIN:</span> <span className="font-mono font-bold text-blue-700">{branch?.gstin || organisation.gstin}</span></div>
                        <div><span className="font-semibold">CIN:</span> {organisation.cin}</div>
                      </div>
                    </div>

                    <div className="col-span-5 p-3 space-y-1 text-[10px]">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Invoice No:</span>
                        <span className="font-mono font-bold text-blue-700">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Invoice Date:</span>
                        <span>{invoice.invoiceDate}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Due Date:</span>
                        <span>{invoice.dueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-600">Place of Supply:</span>
                        <span>{invoice.customerState || 'Tamil Nadu'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 border-b border-slate-800">
                    <div className="p-3 border-r border-slate-800">
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] rounded mb-1 uppercase">Billed To</div>
                      <div className="font-bold text-slate-900">{invoice.customerName}</div>
                      <p className="text-slate-600 text-[10px]">{invoice.billingAddress || 'Industrial Complex, Tamil Nadu'}</p>
                      <p className="text-[10px] mt-1"><span className="font-semibold">GSTIN:</span> {invoice.customerGstin || '33AAACB1234P1ZL'}</p>
                    </div>
                    <div className="p-3">
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-[10px] rounded mb-1 uppercase">Shipped To</div>
                      <div className="font-bold text-slate-900">{invoice.customerName}</div>
                      <p className="text-slate-600 text-[10px]">{invoice.shippingAddress || invoice.billingAddress}</p>
                      <p className="text-[10px] mt-1"><span className="font-semibold">State:</span> {invoice.customerState || 'Tamil Nadu'}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-blue-50 border-b border-slate-800 font-bold uppercase text-[9px]">
                        <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                        <th className="p-2 border-r border-slate-300">Description</th>
                        <th className="p-2 border-r border-slate-300 text-center">HSN</th>
                        <th className="p-2 border-r border-slate-300 text-right">Qty</th>
                        <th className="p-2 border-r border-slate-300 text-right">Rate</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(invoice.items && invoice.items.length > 0 ? invoice.items : []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center border-r border-slate-300">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-medium">{item.productName}</td>
                          <td className="p-2 text-center border-r border-slate-300 font-mono">{item.hsnCode}</td>
                          <td className="p-2 text-right border-r border-slate-300">{item.quantity}</td>
                          <td className="p-2 text-right border-r border-slate-300 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-semibold">₹{((item.taxableAmount ?? (item.quantity * item.unitPrice))).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-800 bg-slate-50 font-bold">
                        <td colSpan={5} className="p-2 text-right border-r border-slate-300">Total Invoice Amount:</td>
                        <td className="p-2 text-right font-mono text-blue-700 text-xs">₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
