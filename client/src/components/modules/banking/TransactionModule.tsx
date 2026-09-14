import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { useErpStore, FinancialTransaction } from '../../../store/erpStore';
import { showAppToast } from '../../../utils/handleApiError';
import { ExportModal, ExportColumn } from '../../shared/ExportModal';
import { Combobox } from '../../shared/Combobox';
import { usePermissions } from '../../../hooks/usePermissions';

export const TransactionModule: React.FC = () => {
  const { bankAccounts, fetchTransactions } = useErpStore();
  const { canApprove } = usePermissions('transactions');

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      if (startDate) {
        params.startDate = startDate;
        params.fromDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
        params.toDate = endDate;
      }
      if (typeFilter !== 'ALL') {
        params.type = typeFilter;
        params.transactionType = typeFilter;
      }
      if (bankFilter !== 'ALL') {
        params.bankAccountId = bankFilter;
        params.accountId = bankFilter;
      }

      const query = new URLSearchParams(params);
      const res = await fetch(`/api/erp/transactions?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load transaction ledger');
      const data = await res.json();
      const txs = (data.data || data.transactions || []).map((t: any) => ({
        ...t,
        id: t.id || t._id,
        type: t.transactionType || t.type || 'ADJUSTMENT',
        transactionType: t.transactionType || t.type || 'ADJUSTMENT',
      }));

      setTransactions(txs);
      setSummary({
        totalDebit: data.totals?.totalDebit ?? data.summary?.totalDebit ?? 0,
        totalCredit: data.totals?.totalCredit ?? data.summary?.totalCredit ?? 0,
        netFlow: data.totals?.netBalance ?? data.summary?.netCashFlow ?? 0,
        count: data.total ?? data.pagination?.total ?? txs.length,
      });
    } catch (err: any) {
      showAppToast('Error loading ledger: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for formatting Date to YYYY-MM-DD in local time
  const formatDateToYmd = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const activePreset = useMemo(() => {
    if (!startDate && !endDate) return 'all';
    const now = new Date();
    const todayStr = formatDateToYmd(now);
    if (endDate === todayStr) {
      const startOfMonth = formatDateToYmd(new Date(now.getFullYear(), now.getMonth(), 1));
      if (startDate === startOfMonth) return 'thisMonth';

      const last30 = new Date(now);
      last30.setDate(now.getDate() - 30);
      if (startDate === formatDateToYmd(last30)) return 'last30';

      const month = now.getMonth();
      const fyYear = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const startFy = formatDateToYmd(new Date(fyYear, 3, 1));
      if (startDate === startFy) return 'fy';
    }
    return 'custom';
  }, [startDate, endDate]);

  const setDatePreset = (preset: 'all' | 'thisMonth' | 'last30' | 'fy') => {
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateToYmd(start));
      setEndDate(formatDateToYmd(now));
    } else if (preset === 'last30') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setStartDate(formatDateToYmd(start));
      setEndDate(formatDateToYmd(now));
    } else if (preset === 'fy') {
      const month = now.getMonth();
      const fyYear = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const start = new Date(fyYear, 3, 1);
      setStartDate(formatDateToYmd(start));
      setEndDate(formatDateToYmd(now));
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    typeFilter !== 'ALL' ||
    bankFilter !== 'ALL' ||
    startDate ||
    endDate
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setBankFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const typeOptions = [
    { value: 'ALL', label: 'All Transaction Types' },
    { value: 'CUSTOMER_PAYMENT', label: 'Customer Payment', sublabel: 'Inflows from customers' },
    { value: 'VENDOR_PAYMENT', label: 'Vendor Payment', sublabel: 'Disbursements to vendors' },
    { value: 'VENDOR_ADVANCE', label: 'Vendor Advance', sublabel: 'Advance paid to vendors' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', sublabel: 'Internal bank to bank transfers' },
    { value: 'REVERSAL', label: 'Ledger Reversal', sublabel: 'Reversed ledger entries' },
    { value: 'ADJUSTMENT', label: 'Adjustment', sublabel: 'Manual journal entries' },
    { value: 'EXPENSE', label: 'Expense', sublabel: 'Operational expenses' },
  ];

  const bankOptions = useMemo(() => [
    { value: 'ALL', label: 'All Bank Accounts' },
    ...bankAccounts.map((b) => ({
      value: b.id,
      label: b.bankName,
      sublabel: `A/c: ..${b.accountNumber ? b.accountNumber.slice(-4) : ''} · Bal: ₹${(Number(b.openingBalance) || 0).toLocaleString('en-IN')}`,
    })),
  ], [bankAccounts]);

  useEffect(() => {
    loadData();
    setCurrentPage(1);
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

  // Local Search & Filtering
  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.transactionNumber.toLowerCase().includes(q) ||
        (tx.partyName && tx.partyName.toLowerCase().includes(q)) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(q)) ||
        (tx.notes && tx.notes.toLowerCase().includes(q))
      );
    });
  }, [transactions, searchQuery]);

  const totalPages = Math.ceil(filteredTxs.length / pageSize) || 1;
  const paginatedTxs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTxs.slice(start, start + pageSize);
  }, [filteredTxs, currentPage, pageSize]);

  const exportColumns: ExportColumn<FinancialTransaction>[] = [
    {
      key: 'transactionDate',
      label: 'Posting Date',
      transform: (val) => (val ? new Date(val).toLocaleDateString('en-IN') : '—'),
    },
    { key: 'transactionNumber', label: 'Transaction #' },
    {
      key: 'type',
      label: 'Type',
      transform: (val, row) => (row.transactionType || row.type || 'ADJUSTMENT').replace(/_/g, ' '),
    },
    { key: 'bankName', label: 'Bank Account', transform: (val) => val || 'Enterprise Bank' },
    { key: 'accountNumber', label: 'Account Number', transform: (val) => (val ? `..${val.slice(-4)}` : '—') },
    { key: 'partyName', label: 'Party', transform: (val) => val || 'Direct / Internal' },
    { key: 'referenceNumber', label: 'Reference / UTR', transform: (val) => val || '—' },
    { key: 'debit', label: 'Debit (₹)', transform: (val) => (Number(val) || 0).toFixed(2) },
    { key: 'credit', label: 'Credit (₹)', transform: (val) => (Number(val) || 0).toFixed(2) },
    {
      key: 'runningBalance',
      label: 'Balance (₹)',
      transform: (val, row) =>
        (Number(val) || Number(row.credit) || Number(row.debit) || 0).toFixed(2),
    },
    { key: 'status', label: 'Status' },
  ];

  const getTypeBadge = (type?: string) => {
    const t = type || 'ADJUSTMENT';
    switch (t) {
      case 'CUSTOMER_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Customer Payment
          </span>
        );
      case 'VENDOR_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Vendor Payment
          </span>
        );
      case 'VENDOR_ADVANCE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Vendor Advance
          </span>
        );
      case 'BANK_TRANSFER':
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Bank Transfer
          </span>
        );
      case 'REVERSAL':
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Ledger Reversal
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Adjustment
          </span>
        );
      case 'EXPENSE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Expense
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap">
            {t.replace(/_/g, ' ')}
          </span>
        );
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
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Ledger</span>
          </button>
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search, Comboboxes & Reset */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Tx number, party, UTR reference..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Combobox */}
          <div className="w-full md:w-60">
            <Combobox
              options={typeOptions}
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              placeholder="All Transaction Types"
              searchable={true}
            />
          </div>

          {/* Bank Combobox */}
          <div className="w-full md:w-64">
            <Combobox
              options={bankOptions}
              value={bankFilter}
              onChange={(val) => {
                setBankFilter(val);
                setCurrentPage(1);
              }}
              placeholder="All Bank Accounts"
              searchable={true}
            />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl transition cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Row 2: Date presets & Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Date Filter:
            </span>
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                activePreset === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('thisMonth')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                activePreset === 'thisMonth'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('last30')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                activePreset === 'last30'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('fy')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                activePreset === 'fy'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Current FY
            </button>
          </div>

          {/* Explicit Date Inputs */}
          <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 text-xs text-slate-700 focus:ring-0 focus:outline-none p-0 cursor-pointer font-medium"
                title="From Date"
              />
            </div>
            <span className="text-slate-300 font-bold px-0.5">&ndash;</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 text-xs text-slate-700 focus:ring-0 focus:outline-none p-0 cursor-pointer font-medium"
                title="To Date"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear date range"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Tx Number</th>
                <th className="py-3 px-4 whitespace-nowrap">Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Bank Account</th>
                <th className="py-3 px-4 whitespace-nowrap">Party & UTR</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Debit (Outflow)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Credit (Inflow)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Running Balance</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCcw className="h-6 w-6 animate-spin text-blue-500" />
                      <span>Loading ledger data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <span className="font-semibold text-slate-600">No ledger transactions found</span>
                      <span className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'Try adjusting or resetting your filters to see transactions.'
                          : 'No transactions recorded yet.'}
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
                        >
                          Reset all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-blue-50/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2 py-0.5 rounded-md inline-block group-hover:bg-blue-100/80 transition">
                        {tx.transactionNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(tx.transactionType || tx.type)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{tx.bankName || 'Enterprise Bank'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {tx.accountNumber ? `A/c: ..${tx.accountNumber.slice(-4)}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate max-w-[240px]">{tx.partyName || 'Direct / Internal'}</div>
                      {tx.referenceNumber && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[240px]">Ref: {tx.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      {tx.debit > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50/60 px-2 py-0.5 rounded border border-rose-100 inline-block">
                          -₹{Number(tx.debit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      {tx.credit > 0 ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                          +₹{Number(tx.credit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block">
                        ₹{(Number(tx.runningBalance) || Number(tx.credit) || Number(tx.debit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {tx.status === 'POSTED' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          POSTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold line-through">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
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

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 relative z-10 overflow-visible">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {filteredTxs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, filteredTxs.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{filteredTxs.length}</span> records
            </span>

            <div className="w-28 ml-2">
              <Combobox
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: '10', label: '10 / page' },
                  { value: '25', label: '25 / page' },
                  { value: '50', label: '50 / page' },
                  { value: '100', label: '100 / page' },
                ]}
                searchable={false}
                placement="top"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
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
                  {getTypeBadge(selectedTx.transactionType || selectedTx.type)}
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
                    ₹{(Number(selectedTx.runningBalance) || Number(selectedTx.credit) || Number(selectedTx.debit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
              {selectedTx.status === 'POSTED' && selectedTx.type !== 'REVERSAL' && canApprove && (
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

      {/* Export Ledger Modal */}
      <ExportModal<FinancialTransaction>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Financial Transactions Ledger Export"
        filenamePrefix="financial_transactions_ledger"
        columns={exportColumns}
        data={filteredTxs}
        dateField="transactionDate"
        statusField="status"
        statusOptions={[
          { value: 'POSTED', label: 'POSTED' },
          { value: 'REVERSED', label: 'REVERSED' },
        ]}
      />
    </div>
  );
};
