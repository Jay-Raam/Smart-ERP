import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Building2,
  Download,
} from 'lucide-react';
import { useErpStore, Bill } from '../../../store/erpStore';
import { DataTable, ColumnDef } from '../../shared/DataTable';
import { BillPdfDocument } from '../../pdf/BillPdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';
import { ExportModal, ExportColumn } from '../../shared/ExportModal';
import { BillDetailPage } from './BillDetailPage';
import { RecordPaymentModal } from '../../shared/RecordPaymentModal';
import { usePermissions } from '../../../hooks/usePermissions';

export const BillModule: React.FC = () => {
  const { bills, updateBill } = useErpStore();
  const { canAdd, canApprove } = usePermissions('bills');
  const [selectedBillForPdf, setSelectedBillForPdf] = useState<Bill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [viewingBillId, setViewingBillId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/bills/')) {
      const parts = window.location.pathname.split('/bills/');
      if (parts[1]) return parts[1];
    }
    return null;
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportColumns: ExportColumn<Bill>[] = [
    { key: 'billNumber', label: 'Bill No' },
    { key: 'billDate', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'poNumber', label: 'PO Reference' },
    { key: 'vendorName', label: 'Vendor Name' },
    { key: 'vendorGstin', label: 'Vendor GSTIN' },
    { key: 'vendorState', label: 'State' },
    {
      key: 'taxableAmount',
      label: 'Taxable Amount',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'cgstAmount',
      label: 'CGST',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'sgstAmount',
      label: 'SGST',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'igstAmount',
      label: 'IGST',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'shippingCharge',
      label: 'Shipping',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'totalAmount',
      label: 'Total Bill Amount',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    { key: 'status', label: 'Status' },
  ];

  const totalPayable = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPaid = bills.filter((b) => b.status === 'Paid').reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalOutstanding = bills.filter((b) => b.status !== 'Paid').reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const columns: ColumnDef<Bill>[] = [
    {
      key: 'billNumber',
      header: 'Bill Number',
      sortable: true,
      render: (b) => (
        <button
          type="button"
          onClick={() => {
            setViewingBillId(b.id);
            window.history.pushState(null, '', `/bills/${b.id}`);
          }}
          className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
        >
          {b.billNumber}
        </button>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor / Supplier',
      sortable: true,
      render: (b) => (
        <div>
          <div className="font-medium text-slate-900">{b.vendorName}</div>
          {b.vendorGstin && <div className="font-mono text-[11px] text-slate-400">GST: {b.vendorGstin}</div>}
        </div>
      ),
    },
    {
      key: 'purchaseOrderNumber',
      header: 'PO Reference',
      sortable: true,
      render: (b) => (
        <span className="font-mono text-slate-600">
          {b.purchaseOrderNumber || b.poNumber || <span className="text-slate-400 italic">Direct Bill</span>}
        </span>
      ),
    },
    {
      key: 'billDate',
      header: 'Bill Date',
      sortable: true,
      render: (b) => <span className="text-slate-600">{b.billDate}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{b.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'outstandingAmount',
      header: 'Outstanding',
      sortable: true,
      align: 'right',
      render: (b) => {
        const out = b.outstandingAmount !== undefined ? b.outstandingAmount : (b.totalAmount - (b.paidAmount || 0) - (b.advanceAdjusted || 0));
        return (
          <span className={`font-mono font-semibold ${out > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
            ₹{Math.max(0, out).toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      align: 'center',
      render: (b) => {
        const status = b.paymentStatus || (b.status === 'Paid' ? 'PAID' : 'UNPAID');
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : status === 'PARTIALLY_PAID'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'storeMovementStatus',
      header: 'Store Inward',
      sortable: true,
      align: 'center',
      render: (b) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            b.storeMovementStatus === 'FULLY_MOVED'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : b.storeMovementStatus === 'PARTIALLY_MOVED'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {b.storeMovementStatus === 'FULLY_MOVED'
            ? 'In Store'
            : b.storeMovementStatus === 'PARTIALLY_MOVED'
            ? 'Partial In'
            : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => {
        const out = b.status === 'Paid'
          ? 0
          : (b.outstandingAmount !== undefined && b.outstandingAmount > 0)
            ? b.outstandingAmount
            : Math.max(0, b.totalAmount - (b.paidAmount || 0) - (b.advanceAdjusted || 0));
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setViewingBillId(b.id);
                window.history.pushState(null, '', `/bills/${b.id}`);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
              title="View Complete Bill & Movement Details"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Details</span>
            </button>
            {out > 0 && canApprove && (
              <button
                type="button"
                onClick={() => setSelectedBillForPayment(b)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                title="Record Vendor Payment"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Pay</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedBillForPdf(b)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
              title="View Vector PDF"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
          </div>
        );
      },
    },
  ];

  const statusOptions = [
    { label: 'All Bills', value: 'ALL' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
  ];

  if (viewingBillId) {
    return (
      <BillDetailPage
        billId={viewingBillId}
        onBack={() => {
          setViewingBillId(null);
          window.history.pushState(null, '', '/bills');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Bills (Accounts Payable)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile procurement bills, convert purchase orders, track vendor liabilities & process payments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>
          {canAdd && (
            <button
              onClick={() => {
                window.history.pushState({}, '', '/bills/new');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Incurred</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            ₹{totalPayable.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Total vendor bills booked</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid / Settled</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">Reconciled vendor disbursements</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Payable</span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-amber-600 font-medium">Liabilities pending disbursement</div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={bills}
        columns={columns}
        searchPlaceholder="Search by bill number, vendor name, or PO reference..."
        searchKeys={['billNumber', 'vendorName', 'purchaseOrderNumber']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* PDF Modal */}
      {selectedBillForPdf && (
        <PdfPreviewModal
          isOpen={true}
          onClose={() => setSelectedBillForPdf(null)}
          title={`Vendor Bill #${selectedBillForPdf.billNumber}`}
          fileName={`Bill_${selectedBillForPdf.billNumber}.pdf`}
          document={<BillPdfDocument bill={selectedBillForPdf} />}
        />
      )}

      {/* Reusable Export Modal for Vendor Bills */}
      <ExportModal<Bill>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Vendor Bills (Accounts Payable)"
        filenamePrefix="Vendor-Bills"
        columns={exportColumns}
        data={bills}
        dateField="billDate"
        statusField="status"
        statusOptions={[
          { label: 'Pending', value: 'Pending' },
          { label: 'Paid', value: 'Paid' },
          { label: 'Approved', value: 'Approved' },
        ]}
      />

      {/* Record Payment Modal */}
      {selectedBillForPayment && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setSelectedBillForPayment(null)}
          targetType="BILL"
          documentId={selectedBillForPayment.id}
          documentNumber={selectedBillForPayment.billNumber}
          partyName={selectedBillForPayment.vendorName}
          totalAmount={selectedBillForPayment.totalAmount}
          paidAmount={(selectedBillForPayment.paidAmount || 0) + (selectedBillForPayment.advanceAdjusted || 0)}
          outstandingAmount={
            selectedBillForPayment.status === 'Paid'
              ? 0
              : (selectedBillForPayment.outstandingAmount !== undefined && selectedBillForPayment.outstandingAmount > 0)
                ? selectedBillForPayment.outstandingAmount
                : Math.max(0, selectedBillForPayment.totalAmount - (selectedBillForPayment.paidAmount || 0) - (selectedBillForPayment.advanceAdjusted || 0))
          }
        />
      )}
    </div>
  );
};
