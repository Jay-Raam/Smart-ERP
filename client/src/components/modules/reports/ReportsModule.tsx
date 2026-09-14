import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Building2,
  Receipt,
  Package,
  FileSpreadsheet,
  Calculator,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useErpStore } from '../../../store/erpStore';
import { ExportModal, ExportColumn } from '../../shared/ExportModal';
import { showAppToast } from '../../../utils/handleApiError';

type ReportTab =
  | 'customer-balance'
  | 'vendor-balance'
  | 'sales-tax-invoice'
  | 'products'
  | 'gst'
  | 'hsn-summary'
  | 'balance-sheet'
  | 'scrap-wastage';

interface TabItem {
  id: ReportTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const REPORT_TABS: TabItem[] = [
  {
    id: 'customer-balance',
    label: 'Customer Balance',
    icon: Users,
    description: 'Outstanding customer receivables, credit terms, and invoiced vs collected totals',
  },
  {
    id: 'vendor-balance',
    label: 'Vendor Balance',
    icon: Building2,
    description: 'Accounts payable liabilities, vendor disbursements, and unsettled bills',
  },
  {
    id: 'sales-tax-invoice',
    label: 'Sales Report',
    icon: Receipt,
    description: 'Tax Invoices ledger, state-level supply breakdown, and total revenue',
  },
  {
    id: 'products',
    label: 'Product Catalog',
    icon: Package,
    description: 'Master items stock valuation, purchase costs, selling prices, and approval statuses',
  },
  {
    id: 'gst',
    label: 'GST Report',
    icon: FileSpreadsheet,
    description: 'Intra-State (Tamil Nadu CGST+SGST) vs Inter-State (IGST) tax split & reconciliation',
  },
  {
    id: 'hsn-summary',
    label: 'HSN-Wise Summary',
    icon: Calculator,
    description: 'Server-side aggregation grouped by HSN code with tax split and reconciliation totals',
  },
  {
    id: 'balance-sheet',
    label: 'Balance Sheet',
    icon: BarChart3,
    description: 'Executive financial statement: Assets, Liabilities, and Owner Equity balance',
  },
  {
    id: 'scrap-wastage',
    label: 'Scrap & Wastage',
    icon: Trash2,
    description: 'Material write-offs, quality rejections, shelf-life expiries, and store scrap audit register',
  },
];

export const ReportsModule: React.FC = () => {
  const { user } = useAuthStore();
  const { activeBranchId, organisation } = useErpStore();

  const isSuperAdmin = Boolean(
    user?.role?.toLowerCase().replace(/\s+/g, '') === 'superadmin' ||
      user?.role?.toLowerCase().includes('admin')
  );

  const [activeTab, setActiveTab] = useState<ReportTab>('customer-balance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Common Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [taxTypeFilter, setTaxTypeFilter] = useState('all');
  const [hsnFilter, setHsnFilter] = useState('All');

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (organisation?.id) params.append('organisationId', organisation.id);
      if (activeBranchId) params.append('branchId', activeBranchId);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      if (taxTypeFilter && taxTypeFilter !== 'all') params.append('taxType', taxTypeFilter);
      if (hsnFilter && hsnFilter !== 'All') params.append('hsnCode', hsnFilter);

      const endpoint = `/api/erp/reports/${activeTab}?${params.toString()}`;
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'x-demo-role': user?.role || 'SuperAdmin',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to load report.`);
      }

      const json = await res.json();
      setReportData(json);
    } catch (err: any) {
      showAppToast(err.message || 'Failed to fetch report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, isSuperAdmin, organisation?.id, activeBranchId, fromDate, toDate, searchQuery, statusFilter, taxTypeFilter, hsnFilter, user?.role]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mb-4 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Super Admin Authorization Required</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
          The Executive Reports & Financial Analytics module contains confidential multi-branch ledgers,
          GST audits, and balance sheets. Access is restricted strictly to accounts with the <strong>Super Admin</strong> role.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
          >
            <span>Return to Operations Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Define Columns for ExportModal based on activeTab
  const getExportColumns = (): ExportColumn[] => {
    switch (activeTab) {
      case 'customer-balance':
        return [
          { key: 'customerCode', label: 'Customer Code' },
          { key: 'customerName', label: 'Company / Customer Name' },
          { key: 'contactPerson', label: 'Contact Person' },
          { key: 'phone', label: 'Phone' },
          { key: 'billingState', label: 'State' },
          {
            key: 'creditLimit',
            label: 'Credit Limit',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalInvoiced',
            label: 'Total Invoiced',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalPaid',
            label: 'Total Paid',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'outstandingBalance',
            label: 'Outstanding Balance',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          { key: 'status', label: 'Status' },
        ];
      case 'vendor-balance':
        return [
          { key: 'vendorCode', label: 'Vendor Code' },
          { key: 'vendorName', label: 'Vendor Name' },
          { key: 'contactPerson', label: 'Contact Person' },
          { key: 'phone', label: 'Phone' },
          { key: 'gstin', label: 'GSTIN' },
          {
            key: 'totalBilled',
            label: 'Total Billed',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalPaid',
            label: 'Disbursed Paid',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'outstandingLiability',
            label: 'Outstanding Payable',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          { key: 'status', label: 'Status' },
        ];
      case 'sales-tax-invoice':
        return [
          { key: 'invoiceNumber', label: 'Invoice No' },
          { key: 'invoiceDate', label: 'Date' },
          { key: 'customerName', label: 'Customer' },
          { key: 'placeOfSupply', label: 'Place of Supply' },
          { key: 'supplyType', label: 'Supply Classification' },
          {
            key: 'taxableAmount',
            label: 'Taxable Amount',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'cgstAmount',
            label: 'CGST',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'sgstAmount',
            label: 'SGST',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'igstAmount',
            label: 'IGST',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalTax',
            label: 'Total Tax',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'grandTotal',
            label: 'Grand Total',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          { key: 'status', label: 'Status' },
        ];
      case 'products':
        return [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product Name' },
          { key: 'category', label: 'Category' },
          { key: 'hsnCode', label: 'HSN / SAC Code' },
          { key: 'currentStock', label: 'Stock Quantity' },
          {
            key: 'sellingPrice',
            label: 'Selling Price',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'stockValuation',
            label: 'Inventory Valuation',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          { key: 'approvalStatus', label: 'Approval Status' },
        ];
      case 'gst':
        return [
          { key: 'invoiceNumber', label: 'Invoice No' },
          { key: 'invoiceDate', label: 'Date' },
          { key: 'partyName', label: 'Customer' },
          { key: 'placeOfSupply', label: 'State' },
          { key: 'taxType', label: 'Tax Split Type' },
          {
            key: 'taxableAmount',
            label: 'Taxable Amount',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'cgstAmount',
            label: 'CGST Amount',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'sgstAmount',
            label: 'SGST Amount',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'igstAmount',
            label: 'IGST Amount',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalTax',
            label: 'Total GST',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalAmount',
            label: 'Invoice Total',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
        ];
      case 'hsn-summary':
        return [
          { key: 'hsnCode', label: 'HSN / SAC' },
          { key: 'description', label: 'Description' },
          { key: 'uom', label: 'UOM' },
          { key: 'totalQuantity', label: 'Total Quantity' },
          {
            key: 'totalTaxableAmount',
            label: 'Taxable Value',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalCGST',
            label: 'CGST (₹)',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalSGST',
            label: 'SGST (₹)',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalIGST',
            label: 'IGST (₹)',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalTaxAmount',
            label: 'Total Tax',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'totalValue',
            label: 'Total Value',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
          },
        ];
      case 'scrap-wastage':
        return [
          { key: 'date', label: 'Date', transform: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
          { key: 'itemCode', label: 'SKU Code' },
          { key: 'itemName', label: 'Item Name' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'quantity', label: 'Deducted Qty' },
          {
            key: 'unitPrice',
            label: 'Unit Cost',
            transform: (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
          {
            key: 'totalLoss',
            label: 'Total Value Loss',
            transform: (v, row) => `₹${Number((row.quantity || 0) * (row.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
          { key: 'reason', label: 'Scrap Reason' },
          { key: 'warehouse', label: 'Depot' },
          { key: 'issuedBy', label: 'Authorized By' },
          { key: 'remarks', label: 'Remarks / Ref' },
        ];
      default:
        return [];
    }
  };

  const currentTabInfo = REPORT_TABS.find((t) => t.id === activeTab);
  const rows = reportData?.data || reportData?.records || [];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Executive Reports & Business Audits
              </h1>
              <p className="text-xs text-slate-500">
                Live multi-tenant reporting engine with server-side database aggregations (Super Admin Only)
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab !== 'balance-sheet' && (
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setReportData(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Header Banner */}
      {currentTabInfo && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{currentTabInfo.label}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{currentTabInfo.description}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[11px] font-semibold text-blue-800 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Direct MongoDB Aggregation</span>
          </span>
        </div>
      )}

      {/* Filter Toolbar (Applicable to tabular reports) */}
      {activeTab !== 'balance-sheet' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">To Date</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {activeTab === 'gst' ? (
              <div>
                <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Tax Split Classification</span>
                <select
                  value={taxTypeFilter}
                  onChange={(e) => setTaxTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All (Intra + Inter-State)</option>
                  <option value="intra">Tamil Nadu Intra-State (CGST + SGST)</option>
                  <option value="inter">Other States Inter-State (IGST)</option>
                </select>
              </div>
            ) : (
              <div>
                <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Search</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter records..."
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearchQuery('');
                  setStatusFilter('All');
                  setTaxTypeFilter('all');
                  setHsnFilter('All');
                }}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards / Report Summaries */}
      {(reportData?.totals || reportData?.summary) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activeTab === 'customer-balance' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                  ₹{Number(reportData.totals.totalInvoiced || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{reportData.totals.totalCustomers} Customers</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Received</span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
                  ₹{Number(reportData.totals.totalPaid || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Cleared invoices</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Receivables</span>
                <div className="mt-1 text-xl font-bold font-mono text-rose-600">
                  ₹{Number(reportData.totals.totalOutstanding || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-rose-500 mt-0.5">Pending collection</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Credit Limit</span>
                <div className="mt-1 text-xl font-bold font-mono text-blue-600">
                  ₹{Number(reportData.totals.totalCreditLimit || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-blue-500 mt-0.5">Authorized exposure</div>
              </div>
            </>
          )}

          {activeTab === 'vendor-balance' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Incurred</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                  ₹{Number(reportData.totals.totalBilled || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{reportData.totals.totalVendors} Vendors</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disbursements Paid</span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
                  ₹{Number(reportData.totals.totalPaid || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Bank settlements</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Payable</span>
                <div className="mt-1 text-xl font-bold font-mono text-amber-600">
                  ₹{Number(reportData.totals.totalLiability || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">Liabilities pending</div>
              </div>
            </>
          )}

          {activeTab === 'sales-tax-invoice' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Taxable Revenue</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                  ₹{Number(reportData.totals.totalTaxable || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{reportData.totals.invoiceCount} Invoices</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Output GST</span>
                <div className="mt-1 text-xl font-bold font-mono text-blue-600">
                  ₹{Number(reportData.totals.totalTax || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">CGST+SGST+IGST</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Shipping & Freight</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-700">
                  ₹{Number(reportData.totals.totalShipping || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Logistics charges</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Invoiced Total</span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
                  ₹{Number(reportData.totals.totalGrand || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Inclusive of taxes</div>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Catalog Items</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                  {reportData.totals.totalProducts} Products
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Stock Quantity</span>
                <div className="mt-1 text-xl font-bold font-mono text-blue-600">
                  {reportData.totals.totalStockUnits} Units
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs col-span-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Inventory Valuation</span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-600">
                  ₹{Number(reportData.totals.totalStockValuation || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </>
          )}

          {activeTab === 'scrap-wastage' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Deduction Events</span>
                <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                  {reportData?.summary?.totalDeductionsCount ?? rows.length} Records
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Scrap & wastage entries</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Quantity Scrapped</span>
                <div className="mt-1 text-xl font-bold font-mono text-rose-600">
                  {reportData?.summary?.totalQuantityScrapped ?? 0} Units
                </div>
                <div className="text-[11px] text-rose-500 mt-0.5">Stock written off</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs col-span-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Material Valuation Loss</span>
                <div className="mt-1 text-xl font-bold font-mono text-amber-600">
                  ₹{Number(reportData?.summary?.totalValueLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">Calculated at unit inward cost</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab-Specific Content Renderers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-semibold">Executing server-side MongoDB aggregation...</p>
          </div>
        ) : activeTab === 'balance-sheet' ? (
          /* ================= BALANCE SHEET ================= */
          <div className="p-6 space-y-8">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Executive Balance Sheet Statement</h3>
                <p className="text-xs text-slate-500">
                  As of Date: {reportData?.asOfDate || new Date().toISOString().split('T')[0]} • Financial Year: {reportData?.financialYear || '2026-2027'}
                </p>
              </div>
              {reportData?.reconciliation?.isBalanced && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Statement Reconciled (Assets = Liabilities + Equity)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ASSETS */}
              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">Assets (Current & Liquid)</h4>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    ₹{Number(reportData?.assets?.totalCurrentAssets || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-600">Bank & Cash Working Balances</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{Number(reportData?.assets?.bankAndCashBalances || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-600">Accounts Receivable (Unpaid Invoices)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{Number(reportData?.assets?.accountsReceivable || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-600">Inventory Stock Valuation</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{Number(reportData?.assets?.inventoryStockValuation || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {Number(reportData?.assets?.gstInputCreditAvailable || 0) > 0 && (
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">GST Input Tax Credit (ITC Available)</span>
                      <span className="font-mono font-bold text-emerald-600">
                        ₹{Number(reportData?.assets?.gstInputCreditAvailable || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900">Total Assets</span>
                  <span className="font-mono text-blue-700">
                    ₹{Number(reportData?.assets?.totalCurrentAssets || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div className="space-y-6">
                {/* Liabilities */}
                <div className="space-y-4">
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Liabilities (Current Obligations)</h4>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      ₹{Number(reportData?.liabilities?.totalCurrentLiabilities || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Accounts Payable (Unpaid Vendor Bills)</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(reportData?.liabilities?.accountsPayable || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Net GST Output Tax Payable</span>
                      <span className="font-mono font-bold text-rose-600">
                        ₹{Number(reportData?.liabilities?.netGstPayable || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Other Statutory Accruals & Payables</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(reportData?.liabilities?.otherCurrentLiabilities || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Owner Equity & Retained Earnings</h4>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{Number(reportData?.equity?.totalEquity || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Baseline Working Capital</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(reportData?.equity?.initialCapital || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Operating Net Profit (Revenue - Procurement)</span>
                      <span className="font-mono font-bold text-emerald-600">
                        ₹{Number(reportData?.equity?.netOperatingProfit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-600">Retained Surplus Balance</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(reportData?.equity?.retainedEarnings || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900">Total Liabilities & Equity</span>
                  <span className="font-mono text-emerald-700">
                    ₹{Number(reportData?.reconciliation?.totalLiabilitiesAndEquity || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= TABULAR REPORTS ================= */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  {getExportColumns().map((col) => (
                    <th key={col.key} className="px-4 py-3">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={getExportColumns().length} className="px-6 py-12 text-center text-slate-400">
                      No report records found for the specified period.
                    </td>
                  </tr>
                ) : (
                  rows.map((row: any, rIdx: number) => (
                    <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors">
                      {getExportColumns().map((col) => {
                        const val = row[col.key];
                        return (
                          <td key={col.key} className="px-4 py-3">
                            {col.key === 'status' || col.key === 'approvalStatus' ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  val === 'Paid' || val === 'Cleared' || val === 'Approved' || val === 'Settled'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : val === 'Pending Payment' || val === 'Pending' || val === 'Pending Settlement'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {val}
                              </span>
                            ) : col.transform ? (
                              <span className="font-mono">{col.transform(val, row)}</span>
                            ) : (
                              val ?? '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Bottom Reconciliation Summary Row */}
              {reportData?.reconciliationTotals && (
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-blue-50/40 text-xs font-bold text-slate-900">
                    <td className="px-4 py-3">Reconciliation Total</td>
                    <td className="px-4 py-3">{reportData.reconciliationTotals.totalHSNCodes} HSN Codes</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">{reportData.reconciliationTotals.totalQuantity} Units</td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(reportData.reconciliationTotals.totalTaxableAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(reportData.reconciliationTotals.totalCGST || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(reportData.reconciliationTotals.totalSGST || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(reportData.reconciliationTotals.totalIGST || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(reportData.reconciliationTotals.totalTaxAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-700">
                      ₹{Number(reportData.reconciliationTotals.totalValue || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Export Modal for Reports */}
      <ExportModal
        show={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={`Export ${currentTabInfo?.label || 'Report'}`}
        filenamePrefix={activeTab}
        columns={getExportColumns()}
        data={rows}
      />
    </div>
  );
};
