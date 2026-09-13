import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  Building,
} from 'lucide-react';
import { useErpStore, Invoice } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';

interface InvoiceModuleProps {
  initialOpenAdd?: boolean;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({ initialOpenAdd = false }) => {
  const { invoices, customers, salesOrders, organisation, addInvoice } = useErpStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [subtotal, setSubtotal] = useState(150000);
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [selectedSoNumber, setSelectedSoNumber] = useState(salesOrders[0]?.orderNumber || 'SO-2026-081');

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalOutstanding = invoices.filter((i) => i.status !== 'Paid').reduce((acc, inv) => acc + inv.totalAmount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const taxAmount = subtotal * 0.18;
    const totalAmount = subtotal + taxAmount;

    addInvoice({
      salesOrderNumber: selectedSoNumber,
      customerId: cust.id,
      customerName: cust.name,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate,
      subtotal,
      gstRate: 18,
      taxAmount,
      totalAmount,
      status: 'Pending',
    });

    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice No',
      render: (inv) => <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>,
    },
    {
      key: 'salesOrderNumber',
      header: 'SO Reference',
      render: (inv) => <span className="font-mono text-blue-600 font-medium">{inv.salesOrderNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (inv) => <span className="font-medium text-slate-900">{inv.customerName}</span>,
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      render: (inv) => <span className="text-slate-500">{inv.invoiceDate}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (inv) => <span className="text-slate-500">{inv.dueDate}</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (inv) => <span className="font-mono">₹{inv.subtotal.toLocaleString('en-IN')}</span>,
      align: 'right',
    },
    {
      key: 'taxAmount',
      header: 'GST (18%)',
      render: (inv) => <span className="font-mono text-slate-500">₹{inv.taxAmount.toLocaleString('en-IN')}</span>,
      align: 'right',
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (inv) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{inv.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (inv) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            inv.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : inv.status === 'Pending'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {inv.status === 'Paid' && <CheckCircle2 className="h-3 w-3" />}
          {inv.status === 'Pending' && <Clock className="h-3 w-3" />}
          {inv.status === 'Overdue' && <AlertCircle className="h-3 w-3" />}
          {inv.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (inv) => (
        <button
          type="button"
          onClick={() => setViewInvoice(inv)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tax Invoices (GST)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Compliant e-Invoicing, automatic GST split calculation & payment tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Across all branches</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Received / Paid</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">Reconciled in bank ledger</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-rose-500">Requires collection follow-up</div>
        </div>
      </div>

      {/* Modern Tiaano DataTable */}
      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoice #, customer, SO..."
        searchKeys={['invoiceNumber', 'customerName', 'salesOrderNumber']}
        statusKey="status"
        statusOptions={[
          { label: 'Paid', value: 'Paid' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Overdue', value: 'Overdue' },
        ]}
      />

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{organisation.name}</h3>
                  <p className="text-[11px] text-slate-500">GSTIN: {organisation.gstin}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Billed To:</p>
                <p className="font-bold text-slate-900 mt-0.5">{viewInvoice.customerName}</p>
                <p className="text-slate-500">Invoice: {viewInvoice.invoiceNumber}</p>
                <p className="text-slate-500">SO Ref: {viewInvoice.salesOrderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">Invoice Date:</p>
                <p className="font-semibold text-slate-900">{viewInvoice.invoiceDate}</p>
                <p className="text-slate-400 font-medium mt-2">Due Date:</p>
                <p className="font-semibold text-slate-900">{viewInvoice.dueDate}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden mb-6">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">SO Reference</th>
                  <th className="p-3 text-right">Taxable Subtotal</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium">Standard Industrial Titanium Product Batch</td>
                  <td className="p-3 text-center font-mono text-blue-600">{viewInvoice.salesOrderNumber}</td>
                  <td className="p-3 text-right font-mono">₹{viewInvoice.subtotal.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-mono">₹{viewInvoice.subtotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-4 flex flex-col items-end gap-1.5 text-xs font-mono">
              <div className="flex justify-between w-56 text-slate-600">
                <span>Subtotal:</span>
                <span>₹{viewInvoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-56 text-slate-600">
                <span>GST (18%):</span>
                <span>₹{viewInvoice.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-56 text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total Amount:</span>
                <span>₹{viewInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Generate New Tax Invoice</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer</label>
                <Combobox
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    sublabel: `GSTIN: ${c.gstin} • ${c.city}`,
                  }))}
                  placeholder="Select customer..."
                  searchable={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SO Reference Number</label>
                <Combobox
                  value={selectedSoNumber}
                  onChange={(val) => setSelectedSoNumber(val)}
                  options={salesOrders.map((so) => ({
                    value: so.orderNumber,
                    label: `${so.orderNumber} — ${so.customerName}`,
                    sublabel: `Total: ₹${so.totalAmount.toLocaleString('en-IN')}`,
                  }))}
                  placeholder="Select sales order reference..."
                  searchable={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taxable Subtotal (₹)</label>
                  <input
                    type="number"
                    value={subtotal}
                    onChange={(e) => setSubtotal(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Integrated GST (18%):</span>
                  <span>₹{(subtotal * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-blue-200 pt-1">
                  <span>Gross Invoice Total:</span>
                  <span>₹{(subtotal * 1.18).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  Confirm & Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
