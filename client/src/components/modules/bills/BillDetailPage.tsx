import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Receipt,
  Building,
  Calendar,
  CreditCard,
  Boxes,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  ArrowDownLeft,
  DollarSign,
  Package,
  History,
  X,
} from 'lucide-react';
import { useErpStore, Bill, DocumentItem } from '../../../store/erpStore';
import { RecordPaymentModal } from '../../shared/RecordPaymentModal';
import { showAppToast } from '../../../utils/handleApiError';
import { BillPdfDocument } from '../../pdf/BillPdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';
import { Combobox } from '../../shared/Combobox';
import { usePermissions } from '../../../hooks/usePermissions';

interface BillDetailPageProps {
  billId: string;
  onBack: () => void;
}

export const BillDetailPage: React.FC<BillDetailPageProps> = ({ billId, onBack }) => {
  const { bills, moveBillToStore, fetchBootstrap } = useErpStore();
  const { canApprove } = usePermissions('bills');
  const { canAdd: canAddToStore } = usePermissions('store');
  const bill = bills.find((b) => b.id === billId || (b as any)._id === billId);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMoveToStoreOpen, setIsMoveToStoreOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [movementHistory, setMovementHistory] = useState<any[]>([]);
  const [billTransactions, setBillTransactions] = useState<any[]>([]);

  // Movement Form Items State
  const [movementItems, setMovementItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku?: string;
      remainingToMove: number;
      moveQuantity: number;
      hasExpiry: boolean;
      expiryDate: string;
      batchNumber: string;
      warehouse: string;
      binLocation: string;
      error?: string;
    }>
  >([]);

  // Load audit / movements and transactions for this bill
  useEffect(() => {
    if (!bill) return;

    // Initialize movement items
    const minExpiryDate = new Date();
    minExpiryDate.setDate(minExpiryDate.getDate() + 5);
    const minExpiryStr = minExpiryDate.toISOString().split('T')[0];

    const initial = (bill.items || []).map((item) => {
      const moved = item.movedToStoreQuantity || 0;
      const remaining = (item.remainingToMoveQuantity !== undefined && item.remainingToMoveQuantity > 0)
        ? item.remainingToMoveQuantity
        : Math.max(0, item.quantity - moved);

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        remainingToMove: remaining,
        moveQuantity: remaining,
        hasExpiry: false,
        expiryDate: minExpiryStr,
        batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
        warehouse: 'Main Warehouse',
        binLocation: 'A-01',
      };
    });

    setMovementItems(initial);
  }, [bill]);

  if (!bill) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Bill Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested vendor bill ID could not be loaded.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bills</span>
        </button>
      </div>
    );
  }

  const outstanding =
    bill.status === 'Paid'
      ? 0
      : (bill.outstandingAmount !== undefined && bill.outstandingAmount > 0)
        ? bill.outstandingAmount
        : Math.max(0, bill.totalAmount - (bill.paidAmount || 0) - (bill.advanceAdjusted || 0));

  const isFullyMoved =
    bill.storeMovementStatus === 'FULLY_MOVED' ||
    ((bill.items || []).length > 0 &&
      (bill.items || []).every((i) => {
        const moved = i.movedToStoreQuantity || 0;
        const rem = (i.remainingToMoveQuantity !== undefined && i.remainingToMoveQuantity > 0)
          ? i.remainingToMoveQuantity
          : Math.max(0, i.quantity - moved);
        return rem === 0 && moved > 0;
      }));

  const canMoveToStore = !isFullyMoved;

  const handleMovementItemChange = (index: number, field: string, value: any) => {
    setMovementItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleExecuteStoreMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    const movementDate = new Date();
    const minAllowedExpiry = new Date();
    minAllowedExpiry.setDate(minAllowedExpiry.getDate() + 5);
    minAllowedExpiry.setHours(0, 0, 0, 0);

    const itemsToMove = movementItems.filter((i) => i.moveQuantity > 0);
    if (itemsToMove.length === 0) {
      showAppToast('Please enter a quantity greater than 0 for at least one item', 'warning');
      return;
    }

    // Validate quantities & expiry
    for (const item of itemsToMove) {
      if (item.moveQuantity > item.remainingToMove) {
        showAppToast(`Cannot move more than remaining quantity (${item.remainingToMove}) for ${item.productName}`, 'error');
        return;
      }
      if (item.hasExpiry) {
        if (!item.expiryDate) {
          showAppToast(`Expiry date is required for ${item.productName}`, 'error');
          return;
        }
        const chosenExp = new Date(item.expiryDate);
        chosenExp.setHours(0, 0, 0, 0);
        if (chosenExp < minAllowedExpiry) {
          showAppToast(`Expiry date for ${item.productName} must be at least 5 days from today`, 'error');
          return;
        }
      }
    }

    try {
      setIsSubmittingMovement(true);
      await moveBillToStore(bill.id || (bill as any)._id, {
        movementDate: movementDate.toISOString().split('T')[0],
        items: itemsToMove.map((i) => ({
          productId: i.productId,
          quantity: Number(i.moveQuantity),
          batchNumber: i.batchNumber,
          hasExpiry: i.hasExpiry,
          expiryDate: i.hasExpiry ? i.expiryDate : undefined,
          warehouse: i.warehouse,
          binLocation: i.binLocation,
        })),
      });

      setIsMoveToStoreOpen(false);
      showAppToast('Items successfully moved to Store / Inventory', 'success');
      fetchBootstrap();
    } catch (err: any) {
      // Handled
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            title="Back to Vendor Bills"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">{bill.billNumber}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  bill.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : bill.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {bill.paymentStatus || 'UNPAID'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isFullyMoved
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : bill.storeMovementStatus === 'PARTIALLY_MOVED'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <Boxes className="h-3 w-3" />
                <span>{isFullyMoved ? 'FULLY MOVED TO STORE' : bill.storeMovementStatus || 'STORE MOVEMENT PENDING'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor: <span className="font-semibold text-slate-800">{bill.vendorName}</span> &bull; Bill Date: {bill.billDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View PDF</span>
          </button>

          {canMoveToStore && (canApprove || canAddToStore) && (
            <button
              type="button"
              onClick={() => setIsMoveToStoreOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Boxes className="h-4 w-4" />
              <span>Move to Store</span>
            </button>
          )}

          {outstanding > 0 && canApprove && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <DollarSign className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Bill Amount</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tax Inclusive Payable</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Advance Adjusted</span>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            ₹{(bill.advanceAdjusted || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">From Linked Purchase Order</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Direct Paid Amount</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ₹{(bill.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Settled Payments</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Current Outstanding</span>
          <div className={`text-xl font-bold font-mono mt-1 ${outstanding > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
            ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {outstanding > 0 ? `Due by ${bill.dueDate || 'Immediate'}` : 'Fully Settled'}
          </div>
        </div>
      </div>

      {/* Bill Line Items with Store Movement Tracking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase">Line Items & Store Inward Status</h3>
          </div>
          {canMoveToStore && (
            <button
              type="button"
              onClick={() => setIsMoveToStoreOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              + Move Remaining to Store
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Product Details</th>
                <th className="py-2.5 px-4 text-center">HSN</th>
                <th className="py-2.5 px-4 text-right">Billed Qty</th>
                <th className="py-2.5 px-4 text-right">Moved to Store</th>
                <th className="py-2.5 px-4 text-right">Remaining to Move</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(bill.items || []).map((item, idx) => {
                const moved = item.movedToStoreQuantity || 0;
                const remaining = (item.remainingToMoveQuantity !== undefined && item.remainingToMoveQuantity > 0)
                  ? item.remainingToMoveQuantity
                  : Math.max(0, item.quantity - moved);

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      {item.sku && <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.hsnCode}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">{moved}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {remaining > 0 ? (
                        <span className="font-bold text-amber-600">{remaining}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(item.totalAmount ?? item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase">Payment & Financial Ledger History</h3>
          </div>
          {outstanding > 0 && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 cursor-pointer"
            >
              + Record Payment
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Transaction No</th>
                <th className="py-2.5 px-4">Payment Mode</th>
                <th className="py-2.5 px-4">Reference / UTR</th>
                <th className="py-2.5 px-4 text-right">Debit (₹)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {billTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No payments recorded against this bill yet.
                  </td>
                </tr>
              ) : (
                billTransactions.map((tx) => (
                  <tr key={tx.id || tx._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-600">
                      {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{tx.transactionNumber}</td>
                    <td className="py-3 px-4 font-medium">{tx.paymentMode || 'NEFT'}</td>
                    <td className="py-3 px-4 font-mono">{tx.referenceNumber || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      -₹{tx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move to Store Modal */}
      {isMoveToStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Move Items to Store / Inventory Inward</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMoveToStoreOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteStoreMovement} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-500 text-[11px]">
                Specify inward quantities, batch identifiers, and mandatory expiry dates (if applicable). Expiry must be
                at least 5 days from movement date.
              </p>

              {movementItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.productName}</h4>
                      {item.sku && <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Remaining to Move: <span className="font-bold font-mono text-indigo-700">{item.remainingToMove}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity Selector */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Quantity to Move *</label>
                      <input
                        type="number"
                        min="0"
                        max={item.remainingToMove}
                        value={item.moveQuantity}
                        onChange={(e) => handleMovementItemChange(idx, 'moveQuantity', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                        required
                      />
                    </div>

                    {/* Batch Number */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => handleMovementItemChange(idx, 'batchNumber', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                        required
                      />
                    </div>

                    {/* Warehouse */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Warehouse</label>
                      <Combobox
                        value={item.warehouse || 'Main Warehouse'}
                        onChange={(val) => handleMovementItemChange(idx, 'warehouse', val)}
                        options={[
                          { value: 'Main Warehouse', label: 'Main Warehouse' },
                          { value: 'Raw Materials Bay', label: 'Raw Materials Bay' },
                          { value: 'Finished Goods Store', label: 'Finished Goods Store' },
                          { value: 'Central Store', label: 'Central Store' },
                          { value: 'Spares & Maintenance Bay', label: 'Spares & Maintenance Bay' },
                        ]}
                        placeholder="Select target warehouse..."
                        searchable={true}
                      />
                    </div>
                  </div>

                  {/* Expiry Radio & Date Picker */}
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Expiry Tracking</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`expiry-${idx}`}
                            checked={!item.hasExpiry}
                            onChange={() => handleMovementItemChange(idx, 'hasExpiry', false)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 font-medium">No Expiry</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`expiry-${idx}`}
                            checked={item.hasExpiry}
                            onChange={() => handleMovementItemChange(idx, 'hasExpiry', true)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 font-medium">Has Expiry</span>
                        </label>
                      </div>
                    </div>

                    {item.hasExpiry && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Expiry Date (Min +5 days) *
                        </label>
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleMovementItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          required={item.hasExpiry}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMoveToStoreOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmittingMovement ? 'Processing Movement...' : 'Confirm Store Inward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          targetType="BILL"
          documentId={bill.id || (bill as any)._id}
          documentNumber={bill.billNumber}
          partyName={bill.vendorName}
          totalAmount={bill.totalAmount}
          paidAmount={(bill.paidAmount || 0) + (bill.advanceAdjusted || 0)}
          outstandingAmount={outstanding}
          onSuccess={() => {
            fetchBootstrap();
            // Refresh linked transactions
            fetch(`/api/erp/transactions?billId=${bill.id || (bill as any)._id}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.transactions) setBillTransactions(data.transactions);
              })
              .catch(() => {});
          }}
        />
      )}

      {/* Vector PDF Modal */}
      {isPdfModalOpen && (
        <PdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title={`Bill PDF - ${bill.billNumber}`}
          fileName={`Bill_${bill.billNumber}.pdf`}
          document={<BillPdfDocument bill={bill} />}
        />
      )}
    </div>
  );
};
