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
} from 'lucide-react';
import { useErpStore, Bill } from '../../../store/erpStore';
import { DataTable, ColumnDef } from '../../shared/DataTable';
import { BillPdfDocument } from '../../pdf/BillPdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';

export const BillModule: React.FC = () => {
  const { bills, updateBill } = useErpStore();
  const [selectedBillForPdf, setSelectedBillForPdf] = useState<Bill | null>(null);

  const totalPayable = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPaid = bills.filter((b) => b.status === 'Paid').reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalOutstanding = bills.filter((b) => b.status !== 'Paid').reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const columns: ColumnDef<Bill>[] = [
    {
      key: 'billNumber',
      header: 'Bill Number',
      sortable: true,
      render: (b) => <span className="font-mono font-bold text-blue-700">{b.billNumber}</span>,
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
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (b) => <span className="text-slate-600">{b.dueDate || 'Immediate'}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Payable Amount',
      sortable: true,
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{b.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (b) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            b.status === 'Paid'
              ? 'badge-success'
              : b.status === 'Pending'
              ? 'badge-warning'
              : 'badge-danger'
          }`}
        >
          {b.status === 'Paid' && <CheckCircle2 className="h-3 w-3" />}
          {b.status === 'Pending' && <Clock className="h-3 w-3" />}
          {b.status === 'Overdue' && <AlertCircle className="h-3 w-3" />}
          {b.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          {b.status === 'Pending' && (
            <button
              onClick={() => updateBill(b.id, { status: 'Paid' })}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              title="Mark Bill as Paid"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Paid</span>
            </button>
          )}
          <button
            onClick={() => setSelectedBillForPdf(b)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
            title="View Vector PDF"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All Bills', value: 'ALL' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
  ];

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

        <button
          onClick={() => {
            window.history.pushState({}, '', '/bills/new');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Bill</span>
        </button>
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
    </div>
  );
};
