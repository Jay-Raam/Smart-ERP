import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Info,
  DollarSign,
  Edit,
  History,
  Lock,
  QrCode,
} from 'lucide-react';
import { useErpStore, Invoice, DocumentItem } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';
import { InvoicePrintModal } from './InvoicePrintModal';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../utils/taxCalculation';
import { ExportModal, ExportColumn } from '../shared/ExportModal';
import { RecordPaymentModal } from '../shared/RecordPaymentModal';
import { InvoiceHistoryModal } from './invoices/InvoiceHistoryModal';
import { usePermissions } from '../../hooks/usePermissions';

interface InvoiceModuleProps {
  initialOpenAdd?: boolean;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({ initialOpenAdd = false }) => {
  const { invoices, customers, products, organisation, addInvoice, generateEInvoice } = useErpStore();
  const { canAdd, canEdit, canHistory, canApprove } = usePermissions('invoices');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForHistory, setSelectedInvoiceForHistory] = useState<Invoice | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportColumns: ExportColumn<Invoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice No' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerGstin', label: 'Customer GSTIN' },
    { key: 'customerState', label: 'Place of Supply' },
    {
      key: 'taxableAmount',
      label: 'Taxable Value',
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
      label: 'Grand Total',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    { key: 'status', label: 'Status' },
  ];

  useEffect(() => {
    if (initialOpenAdd) {
      window.history.pushState({}, '', '/invoices/new');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [initialOpenAdd]);

  // Filter ONLY Approved products
  const approvedProducts = useMemo(() => {
    return products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }, [products]);

  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerState, setCustomerState] = useState('Tamil Nadu');
  const [customerGstin, setCustomerGstin] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState<Array<{
    productId: string;
    productName: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    uom: string;
    discountPercent: number;
    taxRate: number;
  }>>([]);

  // Auto-populate customer addresses when customer changes
  useEffect(() => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setBillingAddress(cust.billingAddress || cust.address || '');
      setShippingAddress(cust.shippingAddress || cust.billingAddress || cust.address || '');
      setCustomerState(cust.billingState || cust.state || 'Tamil Nadu');
      setCustomerGstin(cust.gstin || '');
    }
  }, [customerId, customers]);

  // Initialize first line item if empty and approved products available
  useEffect(() => {
    if (lineItems.length === 0 && approvedProducts.length > 0) {
      const p = approvedProducts[0];
      setLineItems([
        {
          productId: p.id,
          productName: p.name,
          hsnCode: p.hsnCode || '84199090',
          quantity: 1,
          unitPrice: p.sellingPrice || 15000,
          uom: p.uom || 'Nos',
          discountPercent: 0,
          taxRate: p.taxRate ?? 18,
        },
      ]);
    }
  }, [approvedProducts]);

  const isTN = isStateTamilNadu(customerState, customerGstin);

  // Live tax calculations
  const taxCalculation = useMemo(() => {
    return calculateDocumentTaxes({
      items: lineItems,
      billingState: customerState,
      partyGstin: customerGstin,
    });
  }, [lineItems, customerState, customerGstin]);

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalOutstanding = invoices.filter((i) => i.status !== 'Paid').reduce((acc, inv) => acc + inv.totalAmount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    addInvoice({
      customerId: cust.id,
      customerName: cust.name,
      customerGstin: customerGstin || cust.gstin,
      customerState: customerState || cust.state,
      billingAddress,
      shippingAddress,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate,
      items: taxCalculation.items as DocumentItem[],
      subtotal: taxCalculation.subtotal,
      taxableAmount: taxCalculation.taxableAmount,
      totalDiscount: taxCalculation.totalDiscount,
      gstRate: lineItems[0]?.taxRate || 18,
      shippingCharge: 0,
      shippingTax: 0,
      cgstAmount: taxCalculation.cgstAmount,
      sgstAmount: taxCalculation.sgstAmount,
      igstAmount: taxCalculation.igstAmount,
      taxAmount: taxCalculation.totalTax,
      totalAmount: taxCalculation.grandTotal,
      totalInWords: taxCalculation.totalInWords,
      status: 'Pending',
    });

    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice No',
      render: (inv) => <span className="font-mono font-bold text-slate-900 whitespace-nowrap">{inv.invoiceNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (inv) => <span className="font-medium text-slate-900 whitespace-nowrap">{inv.customerName}</span>,
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      render: (inv) => <span className="text-slate-500 whitespace-nowrap">{inv.invoiceDate}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (inv) => <span className="text-slate-500 whitespace-nowrap">{inv.dueDate}</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (inv) => <span className="font-mono whitespace-nowrap">₹{inv.subtotal.toLocaleString('en-IN')}</span>,
      align: 'right',
    },
    {
      key: 'taxAmount',
      header: 'GST (18%)',
      render: (inv) => <span className="font-mono text-slate-500 whitespace-nowrap">₹{inv.taxAmount.toLocaleString('en-IN')}</span>,
      align: 'right',
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (inv) => (
        <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
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
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
            inv.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : inv.status === 'Pending'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {inv.status === 'Paid' && <CheckCircle2 className="h-3 w-3 shrink-0" />}
          {inv.status === 'Pending' && <Clock className="h-3 w-3 shrink-0" />}
          {inv.status === 'Overdue' && <AlertCircle className="h-3 w-3 shrink-0" />}
          <span>{inv.status}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (inv) => {
        const out = inv.status === 'Paid'
          ? 0
          : (inv.outstandingAmount !== undefined && inv.outstandingAmount > 0)
            ? inv.outstandingAmount
            : Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
        const isUnpaid = inv.status !== 'Paid' && (inv.paidAmount || 0) === 0;

        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            {/* Edit Direct Tax Invoice (Locked if paid) */}
            {canEdit && (
              isUnpaid ? (
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', `/invoices/${inv.id}/edit`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shrink-0"
                  title="Edit Direct Tax Invoice"
                >
                  <Edit className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60 shrink-0"
                  title="Editing locked: Invoice has recorded payments"
                >
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Edit</span>
                </button>
              )
            )}

            {/* Audit History Timeline */}
            {canHistory && (
              <button
                type="button"
                onClick={() => setSelectedInvoiceForHistory(inv)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer shrink-0"
                title="View Invoice Audit History"
              >
                <History className="h-3.5 w-3.5 text-indigo-500" />
                <span>History</span>
              </button>
            )}

            {/* E-Invoice IRN Generator Button */}
            {canEdit && !inv.irn && (
              <button
                type="button"
                onClick={async () => {
                  await generateEInvoice(inv.id);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition cursor-pointer shrink-0"
                title="Generate Official Statutory IRN & Signed QR Code"
              >
                <QrCode className="h-3.5 w-3.5 text-purple-600" />
                <span>IRN</span>
              </button>
            )}
            {inv.irn && (
              <span
                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-1.5 py-1 text-[11px] font-semibold text-purple-700 shrink-0"
                title={`IRN: ${inv.irn}`}
              >
                <CheckCircle2 className="h-3 w-3 text-purple-600" />
                <span>E-Inv</span>
              </span>
            )}

            {out > 0 && canApprove && (
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(inv)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shrink-0"
                title="Record Customer Payment"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Pay</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewInvoice(inv)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View</span>
            </button>
          </div>
        );
      },
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
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>
          {canAdd && (
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/invoices/new');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Generate Invoice</span>
            </button>
          )}
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

      {/* Modern Smart ERP DataTable */}
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

      {/* Modern PDF Print & View Modal */}
      {viewInvoice && (
        <InvoicePrintModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
        />
      )}

      {/* Reusable Export Modal for Tax Invoices */}
      <ExportModal<Invoice>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Tax Invoices"
        filenamePrefix="Tax-Invoices"
        columns={exportColumns}
        data={invoices}
        dateField="invoiceDate"
        statusField="status"
        statusOptions={[
          { label: 'Paid', value: 'Paid' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Overdue', value: 'Overdue' },
        ]}
      />

      {/* Generate Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate New Tax Invoice</h3>
                <p className="text-xs text-slate-500">
                  Select customer and approved products. Live GST & HSN calculations will be generated automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4 text-xs">
              {/* Customer & Order Reference Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Client</label>
                  <Combobox
                    value={customerId}
                    onChange={(val) => setCustomerId(val)}
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      sublabel: `GSTIN: ${c.gstin} • ${c.billingState || c.state}`,
                    }))}
                    placeholder="Select customer..."
                    searchable={true}
                  />
                </div>



                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Auto-populated Billing & Shipping Address Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-50/70 border border-slate-200 p-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 text-[11px]">Billed To Address & State</label>
                    <span className="font-mono text-[10px] text-blue-700 font-semibold">{customerGstin || 'No GSTIN'}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 bg-white text-slate-800 resize-none"
                    placeholder="Billing address..."
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Billing State: <strong className="text-slate-800">{customerState}</strong></span>
                    <span className={`font-semibold ${isTN ? 'text-emerald-700' : 'text-blue-700'}`}>
                      {isTN ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST Only)'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 text-[11px]">Shipped To Destination Address</label>
                    <span className="text-[10px] text-slate-500">Delivery Location</span>
                  </div>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 bg-white text-slate-800 resize-none"
                    placeholder="Shipping address..."
                  />
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Invoice Line Items (Approved Catalog Items Only)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (approvedProducts.length > 0) {
                        const p = approvedProducts[0];
                        setLineItems([
                          ...lineItems,
                          {
                            productId: p.id,
                            productName: p.name,
                            hsnCode: p.hsnCode || '84199090',
                            quantity: 1,
                            unitPrice: p.sellingPrice || 10000,
                            uom: p.uom || 'Nos',
                            discountPercent: 0,
                            taxRate: p.taxRate ?? 18,
                          },
                        ]);
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="p-3 space-y-2.5 max-h-60 overflow-y-auto">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      {/* Product Selector */}
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Approved Item</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const p = approvedProducts.find((prod) => prod.id === e.target.value);
                            if (p) {
                              const updated = [...lineItems];
                              updated[idx] = {
                                ...updated[idx],
                                productId: p.id,
                                productName: p.name,
                                hsnCode: p.hsnCode || '84199090',
                                unitPrice: p.sellingPrice,
                                uom: p.uom || 'Nos',
                                taxRate: p.taxRate ?? 18,
                              };
                              setLineItems(updated);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                        >
                          {approvedProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* HSN Code */}
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">HSN Code</label>
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].hsnCode = e.target.value;
                            setLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                            setLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Unit Rate (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
                            setLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Tax Rate % */}
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">GST %</label>
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].taxRate = Math.max(0, parseFloat(e.target.value) || 0);
                            setLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Line Subtotal & Delete */}
                      <div className="col-span-2 flex items-center justify-between pl-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Subtotal</label>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLineItems(lineItems.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Calculations Summary Box */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                  <span className="font-bold text-slate-900">GST Jurisdiction Breakdown:</span>
                  <span className="font-semibold text-blue-800">
                    {isTN ? 'Intra-State: Tamil Nadu -> CGST (50%) + SGST (50%)' : `Inter-State: ${customerState} -> IGST (100%)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Subtotal (Gross):</span>
                    <span className="font-bold text-slate-900">₹{taxCalculation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {isTN ? (
                    <>
                      <div>
                        <span className="text-slate-500 block">CGST Split:</span>
                        <span className="font-bold text-slate-800">₹{taxCalculation.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SGST Split:</span>
                        <span className="font-bold text-slate-800">₹{taxCalculation.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-slate-500 block">Integrated GST:</span>
                      <span className="font-bold text-slate-800">₹{taxCalculation.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Grand Total:</span>
                    <span className="font-bold text-blue-700 text-sm">₹{taxCalculation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-1.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-600">Amount in Words: </span>
                  <span className="font-bold text-slate-900">{taxCalculation.totalInWords}</span>
                </div>
              </div>

              {/* Modal Footer */}
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
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Generate Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setSelectedInvoiceForPayment(null)}
          targetType="INVOICE"
          documentId={selectedInvoiceForPayment.id}
          documentNumber={selectedInvoiceForPayment.invoiceNumber}
          partyName={selectedInvoiceForPayment.customerName}
          totalAmount={selectedInvoiceForPayment.totalAmount}
          paidAmount={selectedInvoiceForPayment.paidAmount || (selectedInvoiceForPayment.status === 'Paid' ? selectedInvoiceForPayment.totalAmount : 0)}
          outstandingAmount={
            selectedInvoiceForPayment.status === 'Paid'
              ? 0
              : (selectedInvoiceForPayment.outstandingAmount !== undefined && selectedInvoiceForPayment.outstandingAmount > 0)
                ? selectedInvoiceForPayment.outstandingAmount
                : Math.max(0, selectedInvoiceForPayment.totalAmount - (selectedInvoiceForPayment.paidAmount || 0))
          }
        />
      )}

      {/* Invoice Audit History Timeline Modal */}
      {selectedInvoiceForHistory && (
        <InvoiceHistoryModal
          invoice={selectedInvoiceForHistory}
          isOpen={true}
          onClose={() => setSelectedInvoiceForHistory(null)}
        />
      )}
    </div>
  );
};
