import React from 'react';
import { History, X, Calendar, User, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { Invoice } from '../../../store/erpStore';

interface InvoiceHistoryModalProps {
  invoice: Invoice;
  isOpen?: boolean;
  onClose: () => void;
}

export const InvoiceHistoryModal: React.FC<InvoiceHistoryModalProps> = ({ invoice, isOpen = true, onClose }) => {
  if (!isOpen) return null;
  const history = invoice.history || [
    {
      action: 'CREATED',
      timestamp: invoice.invoiceDate || new Date().toISOString(),
      user: 'System',
      details: `Direct Tax Invoice ${invoice.invoiceNumber} created for ${invoice.customerName}. Total Amount: ₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Invoice Audit Trail & History</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {invoice.invoiceNumber} &bull; {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((entry, idx) => {
              const isCreated = entry.action === 'CREATED';
              const isPayment = entry.action === 'PAYMENT_RECORDED';
              const isEdit = entry.action === 'EDITED' || entry.action === 'UPDATE';

              return (
                <div key={idx} className="relative">
                  {/* Timeline bullet */}
                  <span
                    className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                      isPayment
                        ? 'bg-emerald-500 text-white'
                        : isCreated
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isPayment ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isCreated ? (
                      <FileText className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                  </span>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPayment
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCreated
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.action.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN') : 'N/A'}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium pt-1">{entry.details}</p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Performed by: <strong className="text-slate-700">{entry.user || 'System'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
