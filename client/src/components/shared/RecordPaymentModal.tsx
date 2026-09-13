import React, { useState, useEffect } from 'react';
import { CreditCard, Landmark, AlertCircle, X, Check } from 'lucide-react';
import { useErpStore, BankAccount } from '../../store/erpStore';
import { showAppToast } from '../../utils/handleApiError';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'INVOICE' | 'BILL' | 'PO_ADVANCE';
  documentId: string;
  documentNumber: string;
  partyName: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  targetType,
  documentId,
  documentNumber,
  partyName,
  totalAmount,
  paidAmount,
  outstandingAmount,
  onSuccess,
}) => {
  const { bankAccounts, recordCustomerPayment, recordVendorPayment, recordVendorAdvance } = useErpStore();

  const orgBanks = bankAccounts.filter((b) => b.accountHolderType === 'ORGANISATION');
  const defaultBank = orgBanks.find((b) => b.isPrimary) || orgBanks[0];

  const [bankAccountId, setBankAccountId] = useState(defaultBank?.id || '');
  const [amount, setAmount] = useState(String(outstandingAmount > 0 ? outstandingAmount : ''));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH' | 'CARD' | 'NET_BANKING'>('NEFT');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAmount(String(outstandingAmount > 0 ? outstandingAmount : ''));
      if (defaultBank && !bankAccountId) {
        setBankAccountId(defaultBank.id);
      }
    }
  }, [isOpen, outstandingAmount, defaultBank]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!bankAccountId) newErrors.bankAccountId = 'Bank account is required';
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      newErrors.amount = 'Enter a valid amount greater than 0';
    } else if (numAmount > outstandingAmount + 0.001) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ₹${outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    if (!paymentDate) newErrors.paymentDate = 'Payment date is required';
    if (!paymentMode) newErrors.paymentMode = 'Payment mode is required';
    if (!referenceNumber.trim()) newErrors.referenceNumber = 'Reference / UTR / Cheque number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showAppToast('Please resolve validation errors', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        amount: Number(amount),
        paymentDate,
        bankAccountId,
        paymentMode,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim() || undefined,
      };

      if (targetType === 'INVOICE') {
        await recordCustomerPayment({ ...payload, invoiceId: documentId });
      } else if (targetType === 'BILL') {
        await recordVendorPayment({ ...payload, billId: documentId });
      } else if (targetType === 'PO_ADVANCE') {
        await recordVendorAdvance({ ...payload, purchaseOrderId: documentId });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      // Error toast already displayed by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {targetType === 'INVOICE'
                  ? 'Record Customer Payment'
                  : targetType === 'BILL'
                  ? 'Record Vendor Payment'
                  : 'Record Vendor Advance (PO)'}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {documentNumber} &bull; {partyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Cards Summary */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-center">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Total Amount</div>
              <div className="font-mono font-bold text-slate-800 mt-0.5">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Paid to Date</div>
              <div className="font-mono font-bold text-emerald-700 mt-0.5">
                ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Outstanding</div>
              <div className="font-mono font-bold text-blue-700 mt-0.5">
                ₹{outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Bank Account Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Bank Account *</label>
            <select
              value={bankAccountId}
              onChange={(e) => {
                setBankAccountId(e.target.value);
                setErrors((prev) => ({ ...prev, bankAccountId: '' }));
              }}
              className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-blue-500 ${
                errors.bankAccountId ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
              }`}
              required
            >
              <option value="">Select bank account...</option>
              {orgBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} ({b.accountType}) {b.isPrimary ? '★ PRIMARY' : ''} &bull; Bal: ₹
                  {(Number(b.balance) || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            {errors.bankAccountId && <p className="text-[10px] text-red-600 mt-0.5">{errors.bankAccountId}</p>}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                max={outstandingAmount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  errors.amount ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                }`}
                required
              />
              {errors.amount && <p className="text-[10px] text-red-600 mt-0.5">{errors.amount}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => {
                  setPaymentDate(e.target.value);
                  setErrors((prev) => ({ ...prev, paymentDate: '' }));
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                required
              />
              {errors.paymentDate && <p className="text-[10px] text-red-600 mt-0.5">{errors.paymentDate}</p>}
            </div>
          </div>

          {/* Payment Mode and Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              >
                <option value="NEFT">NEFT Transfer</option>
                <option value="RTGS">RTGS Transfer</option>
                <option value="UPI">UPI / Instant Pay</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CHEQUE">Cheque / DD</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Cheque No *</label>
              <input
                type="text"
                placeholder="e.g. UTR1029384812"
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value);
                  setErrors((prev) => ({ ...prev, referenceNumber: '' }));
                }}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  errors.referenceNumber ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                }`}
                required
              />
              {errors.referenceNumber && (
                <p className="text-[10px] text-red-600 mt-0.5">{errors.referenceNumber}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Audit Notes</label>
            <textarea
              rows={2}
              placeholder="Optional payment notes or allocation details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
