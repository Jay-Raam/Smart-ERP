import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  X,
  FileText,
  Calendar,
  AlertTriangle,
  Receipt,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { useErpStore, FinancialTransaction } from '../../../store/erpStore';
import { showAppToast } from '../../../utils/handleApiError';

export const TransactionModule: React.FC = () => {
  const { bankAccounts, fetchTransactions } = useErpStore();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregation
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netFlow: 0,
    count: 0,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (bankFilter !== 'ALL') params.bankAccountId = bankFilter;

      const query = new URLSearchParams(params);
      const res = await fetch(`/api/erp/transactions?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load transaction ledger');
      const data = await res.json();

      setTransactions(data.transactions || []);
      setSummary({
        totalDebit: data.summary?.totalDebit || 0,
        totalCredit: data.summary?.totalCredit || 0,
        netFlow: data.summary?.netCashFlow || 0,
        count: data.pagination?.total || 0,
      });
    } catch (err: any) {
      showAppToast('Error loading ledger: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, typeFilter, bankFilter]);

  const handleReverseTx = async () => {
    if (!selectedTx) return;
    if (!reversalReason.trim()) {
      showAppToast('Please provide a reason for the reversal', 'warning');
      return;
    }

    try {
      setIsReversing(true);
      const res = await fetch(`/api/erp/transactions/${selectedTx.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reversalReason }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reverse transaction');
      }

      showAppToast('Transaction successfully reversed with offsetting ledger entry', 'success');
      setIsReverseModalOpen(false);
      setSelectedTx(null);
      setReversalReason('');
      loadData();
    } catch (err: any) {
      showAppToast(err.message, 'error');
    } finally {
      setIsReversing(false);
    }
  };

  // Local Search
  const filteredTxs = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.transactionNumber.toLowerCase().includes(q) ||
      (tx.partyName && tx.partyName.toLowerCase().includes(q)) ||
      (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(q)) ||
      (tx.notes && tx.notes.toLowerCase().includes(q))
    );
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CUSTOMER_PAYMENT':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Customer Payment</span>;
      case 'VENDOR_PAYMENT':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">Vendor Payment</span>;
      case 'VENDOR_ADVANCE':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">Vendor Advance</span>;
      case 'REVERSAL':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">Ledger Reversal</span>;
      case 'ADJUSTMENT':
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">Adjustment</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">{type}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Transactions Ledger</h1>
            <p className="text-xs text-slate-500">
              Immutable double-entry institutional cash & bank audit book
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Inflows (Credits)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
            +₹{summary.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Customer collections & receipts</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Outflows (Debits)</span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 font-mono">
            -₹{summary.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vendor bills & disbursements</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net Cash Flow</span>
            <span className={`text-xs font-bold ${summary.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.netFlow >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
          </div>
          <div className={`text-xl font-bold mt-2 font-mono ${summary.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₹{summary.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Net movement in period</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ledger Entries</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">{summary.count}</div>
          <p className="text-[11px] text-slate-400 mt-1">Immutable transactions recorded</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Tx number, party, UTR reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="CUSTOMER_PAYMENT">Customer Payment</option>
              <option value="VENDOR_PAYMENT">Vendor Payment</option>
              <option value="VENDOR_ADVANCE">Vendor Advance</option>
              <option value="REVERSAL">Ledger Reversal</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Bank Accounts</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} (..{b.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">&ndash;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Tx Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Party & UTR</th>
                <th className="py-3 px-4 text-right">Debit (Outflow)</th>
                <th className="py-3 px-4 text-right">Credit (Inflow)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading ledger data...
                  </td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No ledger transactions found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{tx.transactionNumber}</td>
                    <td className="py-3 px-4">{getTypeBadge(tx.type)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{tx.bankName || 'Enterprise Bank'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {tx.accountNumber ? `A/c: ..${tx.accountNumber.slice(-4)}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.partyName || 'Direct / Internal'}</div>
                      {tx.referenceNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">Ref: {tx.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {tx.debit > 0 ? (
                        <span className="font-bold text-rose-600">
                          -₹{tx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {tx.credit > 0 ? (
                        <span className="font-bold text-emerald-600">
                          +₹{tx.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{tx.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.status === 'POSTED' ? (
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          POSTED
                        </span>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold line-through">
                          REVERSED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Slide-Over Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Transaction Details</h3>
                    <p className="font-mono text-blue-700 font-semibold">{selectedTx.transactionNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status & Amount Highlight */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction Type</span>
                  {getTypeBadge(selectedTx.type)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ledger Status</span>
                  <span className="font-bold text-slate-800">{selectedTx.status}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">Net Impact</span>
                  {selectedTx.credit > 0 ? (
                    <span className="font-mono font-bold text-emerald-600">
                      +₹{selectedTx.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-rose-600">
                      -₹{selectedTx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Balance After Entry:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{selectedTx.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Core Ledger Attributes */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Posting Date:</span>
                  <span className="font-medium text-slate-800">
                    {selectedTx.transactionDate ? new Date(selectedTx.transactionDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bank Account:</span>
                  <span className="font-medium text-slate-800">{selectedTx.bankName || 'Bank'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono text-slate-800">{selectedTx.accountNumber || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Party Type:</span>
                  <span className="font-medium text-slate-800">{selectedTx.partyType || 'INTERNAL'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Party Name:</span>
                  <span className="font-semibold text-slate-900">{selectedTx.partyName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-medium text-slate-800">{selectedTx.paymentMode || 'NEFT'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Reference / UTR:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.referenceNumber || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Created By:</span>
                  <span className="text-slate-700">{selectedTx.createdBy || 'System Administrator'}</span>
                </div>
              </div>

              {/* Linked Document Info */}
              {(selectedTx.invoiceId || selectedTx.billId || selectedTx.purchaseOrderId) && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-blue-900">Linked Commercial Document</span>
                  {selectedTx.invoiceId && (
                    <div className="text-xs text-blue-800">
                      Invoice Linked &bull; ID: <span className="font-mono font-semibold">{selectedTx.invoiceId}</span>
                    </div>
                  )}
                  {selectedTx.billId && (
                    <div className="text-xs text-blue-800">
                      Bill Linked &bull; ID: <span className="font-mono font-semibold">{selectedTx.billId}</span>
                    </div>
                  )}
                  {selectedTx.purchaseOrderId && (
                    <div className="text-xs text-blue-800">
                      Purchase Order Linked &bull; ID: <span className="font-mono font-semibold">{selectedTx.purchaseOrderId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedTx.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Audit Notes</span>
                  <p className="text-slate-700 italic">{selectedTx.notes}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Reversal */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {selectedTx.status === 'POSTED' && selectedTx.type !== 'REVERSAL' && (
                <button
                  type="button"
                  onClick={() => setIsReverseModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reverse This Transaction</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {isReverseModalOpen && selectedTx && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Confirm Ledger Reversal</h3>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              You are about to reverse transaction{' '}
              <span className="font-mono font-bold text-slate-900">{selectedTx.transactionNumber}</span>. This will post
              an offsetting entry to the bank account and mark this transaction as REVERSED.
            </p>
            <div className="mb-4">
              <label className="block font-semibold text-slate-700 mb-1">Reason for Reversal *</label>
              <textarea
                rows={3}
                placeholder="e.g. Bank charge error / Bounced cheque / Correction"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReverseModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReversing}
                onClick={handleReverseTx}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {isReversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
