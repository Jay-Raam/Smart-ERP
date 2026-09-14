import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Pencil,
  History,
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  X,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useErpStore, Customer, CustomerAddress, Invoice } from '../../../store/erpStore';
import { DataTable, ColumnDef } from '../../shared/DataTable';
import { ExportModal, ExportColumn } from '../../shared/ExportModal';
import { RecordPaymentModal } from '../../shared/RecordPaymentModal';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { FALLBACK_INDIA_STATES } from '../../../utils/indiaStates';
import { showAppToast } from '../../../utils/handleApiError';
import { InvoiceHistoryModal } from '../invoices/InvoiceHistoryModal';

interface CustomerDetailPageProps {
  customerId?: string;
  onBack?: () => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({
  customerId: propCustomerId,
  onBack,
}) => {
  const {
    customers,
    invoices,
    updateCustomer,
    addCustomerAddress,
    activateCustomerAddress,
    updateCustomerAddress,
  } = useErpStore();

  // Extract ID from props or URL pathname (/customers/:id)
  const customerId = useMemo(() => {
    if (propCustomerId) return propCustomerId;
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'customers' && parts[2]) {
        return parts[2];
      }
    }
    return '';
  }, [propCustomerId]);

  const customer = useMemo(() => {
    return customers.find((c) => c.id === customerId || (c as any)._id === customerId);
  }, [customers, customerId]);

  // Invoices filtered for this specific customer
  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices.filter(
      (inv) => inv.customerId === customer.id || inv.customerName === customer.name
    );
  }, [invoices, customer]);

  // State for modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);

  // Address Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressTypeToAdd, setAddressTypeToAdd] = useState<'BILLING' | 'SHIPPING'>('BILLING');

  // Customer Basic Info Edit Modal
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    creditLimit: 0,
  });

  useEffect(() => {
    if (customer) {
      setEditFormData({
        name: customer.name || '',
        contactPerson: customer.contactPerson || '',
        email: customer.email || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        creditLimit: customer.creditLimit || 0,
      });
    }
  }, [customer]);

  // Address Form State
  const [addrForm, setAddrForm] = useState({
    type: 'BILLING' as 'BILLING' | 'SHIPPING',
    attention: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600032',
    country: 'India',
    phone: '',
  });

  // KPI calculations
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const outstanding = Math.max(0, customer?.outstandingBalance || totalInvoiced - totalPaid);

  // Addresses segmentation: Active vs Historical
  const allAddresses = customer?.addresses || [];
  const activeBilling = allAddresses.find((a) => a.type === 'BILLING' && a.isActive);
  const activeShipping = allAddresses.find((a) => a.type === 'SHIPPING' && a.isActive);
  const addressHistory = allAddresses.filter((a) => !a.isActive);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/customers');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleOpenAddAddress = (type: 'BILLING' | 'SHIPPING') => {
    setAddressTypeToAdd(type);
    setEditingAddress(null);
    setAddrForm({
      type,
      attention: customer?.contactPerson || '',
      addressLine1: '',
      addressLine2: '',
      city: customer?.city || 'Chennai',
      state: type === 'BILLING' ? (customer?.billingState || 'Tamil Nadu') : (customer?.shippingState || 'Tamil Nadu'),
      pincode: '600001',
      country: 'India',
      phone: customer?.phone || '',
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddrForm({
      type: addr.type,
      attention: addr.attention || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || 'Chennai',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      phone: addr.phone || '',
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!addrForm.addressLine1.trim() || !addrForm.city.trim() || !addrForm.pincode.trim()) {
      showAppToast('Please fill all mandatory address fields', 'warning');
      return;
    }

    try {
      if (editingAddress) {
        const addrId = editingAddress.id || editingAddress._id;
        await updateCustomerAddress(customer.id, addrId!, addrForm);
      } else {
        await addCustomerAddress(customer.id, addrForm);
      }
      setIsAddressModalOpen(false);
    } catch (err) {
      // toast shown by store
    }
  };

  const handleActivateAddress = async (addressId: string) => {
    if (!customer) return;
    try {
      await activateCustomerAddress(customer.id, addressId);
    } catch (err) {
      // toast shown by store
    }
  };

  const handleSaveCustomerBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    try {
      await updateCustomer(customer.id, editFormData);
      setIsEditCustomerModalOpen(false);
    } catch (err) {
      // handled
    }
  };

  const navigateToCreateInvoice = () => {
    if (!customer) return;
    window.history.pushState({}, '', `/invoices/new?customerId=${customer.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navigateToEditInvoice = (invId: string) => {
    window.history.pushState({}, '', `/invoices/${invId}/edit`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Columns for Customer\'s Invoices Table
  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice No',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
      render: (inv) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded whitespace-nowrap inline-block">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Date',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (inv) => <span className="font-mono text-slate-700 text-xs">{inv.invoiceDate}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (inv) => <span className="text-slate-500 text-xs">{inv.dueDate}</span>,
    },
    {
      key: 'taxableAmount',
      header: 'Taxable Amount',
      sortable: true,
      align: 'right',
      render: (inv) => (
        <span className="font-mono text-xs text-slate-700">
          ₹{(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'taxAmount',
      header: 'GST Tax',
      sortable: true,
      align: 'right',
      render: (inv) => (
        <span className="font-mono text-xs text-slate-600">
          ₹{(inv.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Grand Total',
      sortable: true,
      align: 'right',
      render: (inv) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (inv) => {
        const isPaid = inv.status === 'Paid' || inv.paymentStatus === 'PAID';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            <span>{isPaid ? 'Paid' : 'Pending'}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (inv) => {
        const isPaid = Boolean(inv.status === 'Paid' || ((inv.paidAmount || 0) > 0));
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* View / Print */}
            <button
              type="button"
              onClick={() => setPrintInvoice(inv)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Print / View PDF"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>

            {/* History */}
            <button
              type="button"
              onClick={() => setHistoryInvoice(inv)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="View Invoice History"
            >
              <History className="h-3.5 w-3.5" />
            </button>

            {/* Edit (Locked if Paid) */}
            <button
              type="button"
              disabled={isPaid}
              onClick={() => navigateToEditInvoice(inv.id)}
              className={`p-1.5 rounded-lg border transition ${
                isPaid
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 cursor-pointer'
              }`}
              title={isPaid ? 'Paid invoices cannot be edited' : 'Edit Tax Invoice'}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Record Payment */}
            {!isPaid && (
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(inv)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <CreditCard className="h-3 w-3" />
                <span>Pay</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const exportColumns: ExportColumn<Invoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice No' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'customerName', label: 'Customer' },
    {
      key: 'taxableAmount',
      label: 'Taxable Amount',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'taxAmount',
      label: 'GST Tax',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'totalAmount',
      label: 'Grand Total',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    { key: 'status', label: 'Status' },
  ];

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto mt-12">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Customer Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested customer profile could not be located in the current workspace.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
        >
          Return to Customer Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Back to Customers"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded whitespace-nowrap inline-block">
                {customer.code}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="font-mono font-medium">GSTIN: {customer.gstin || 'Unregistered'}</span>
              <span>&bull;</span>
              <span>Place of Supply: {customer.billingState || customer.state || 'Tamil Nadu'}</span>
              <span>&bull;</span>
              <span>Contact: {customer.contactPerson}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditCustomerModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={navigateToCreateInvoice}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>Generate Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</div>
          <div className="font-mono font-bold text-lg text-slate-900 mt-1">
            ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{customerInvoices.length} Total Invoices</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Received</div>
          <div className="font-mono font-bold text-emerald-600 mt-1">
            ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Settled Payments</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
          <div className="font-mono font-bold text-lg text-amber-600 mt-1">
            ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pending Receivables</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Credit Limit</div>
          <div className="font-mono font-bold text-lg text-blue-600 mt-1">
            ₹{(customer.creditLimit || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized Limit</div>
        </div>
      </div>

      {/* Address Management Section: Tiaano ERP Pattern (Single Active + History) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Address Records & Locations</h2>
          </div>
          <span className="text-xs text-slate-500">
            Strict single-active policy: only 1 billing and 1 shipping address active at a time
          </span>
        </div>

        {/* Current Active Addresses Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Billing Address Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
                    Billing Address
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Now
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {activeBilling && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddress(activeBilling)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Edit this address"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAddAddress('BILLING')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Billing Address</span>
                  </button>
                </div>
              </div>

              {activeBilling ? (
                <div className="text-xs space-y-1 text-slate-700">
                  {activeBilling.attention && (
                    <p className="font-semibold text-slate-900">Attn: {activeBilling.attention}</p>
                  )}
                  <p className="font-medium">{activeBilling.addressLine1}</p>
                  {activeBilling.addressLine2 && <p>{activeBilling.addressLine2}</p>}
                  <p>
                    {activeBilling.city}, {activeBilling.state} — <span className="font-mono">{activeBilling.pincode}</span>
                  </p>
                  <p className="text-slate-500">{activeBilling.country || 'India'}</p>
                  {activeBilling.phone && (
                    <p className="text-slate-500 flex items-center gap-1 pt-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{activeBilling.phone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  <p>{customer.billingAddress || customer.address || 'No billing address defined.'}</p>
                  <p className="text-slate-500 mt-1">
                    {customer.city}, {customer.billingState || customer.state}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Shipping Address Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
                    Shipping Address (Consignee)
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Now
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {activeShipping && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddress(activeShipping)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Edit this address"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAddAddress('SHIPPING')}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 px-2 py-1 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Shipping Address</span>
                  </button>
                </div>
              </div>

              {activeShipping ? (
                <div className="text-xs space-y-1 text-slate-700">
                  {activeShipping.attention && (
                    <p className="font-semibold text-slate-900">Attn: {activeShipping.attention}</p>
                  )}
                  <p className="font-medium">{activeShipping.addressLine1}</p>
                  {activeShipping.addressLine2 && <p>{activeShipping.addressLine2}</p>}
                  <p>
                    {activeShipping.city}, {activeShipping.state} — <span className="font-mono">{activeShipping.pincode}</span>
                  </p>
                  <p className="text-slate-500">{activeShipping.country || 'India'}</p>
                  {activeShipping.phone && (
                    <p className="text-slate-500 flex items-center gap-1 pt-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{activeShipping.phone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  <p>{customer.shippingAddress || customer.billingAddress || customer.address || 'No shipping address defined.'}</p>
                  <p className="text-slate-500 mt-1">
                    {customer.city}, {customer.shippingState || customer.state}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address History Accordion / List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <History className="h-4 w-4 text-slate-400" />
              <span>Address History & Historical Locations ({addressHistory.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Past addresses are preserved for tax compliance and can be reactivated anytime
            </span>
          </div>

          {addressHistory.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No historical addresses yet. When you add a new address, the previous address is automatically archived here.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {addressHistory.map((hist, idx) => {
                const hId = hist.id || hist._id || String(idx);
                return (
                  <div
                    key={hId}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col justify-between space-y-2 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hist.type === 'BILLING'
                              ? 'bg-blue-100/70 text-blue-800'
                              : 'bg-purple-100/70 text-purple-800'
                          }`}
                        >
                          {hist.type === 'BILLING' ? 'Past Billing Address' : 'Past Shipping Hub'}
                        </span>
                        <span className="text-[10px] text-slate-400">Inactive</span>
                      </div>
                      {hist.attention && (
                        <p className="font-semibold text-slate-800 text-[11px]">Attn: {hist.attention}</p>
                      )}
                      <p className="text-slate-700">
                        {hist.addressLine1}
                        {hist.addressLine2 ? `, ${hist.addressLine2}` : ''}
                      </p>
                      <p className="text-slate-500">
                        {hist.city}, {hist.state} — {hist.pincode}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400">
                        {hist.createdAt ? new Date(hist.createdAt).toLocaleDateString() : 'Archived'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleActivateAddress(hId)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-[11px] font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                      >
                        Set as Active
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoices Against This Customer Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>Tax Invoices Against {customer.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Showing all direct tax invoices generated for this customer across fiscal periods
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <DataTable
            data={customerInvoices}
            columns={invoiceColumns}
            searchPlaceholder="Search invoice no, date, total, status..."
            searchKeys={['invoiceNumber', 'invoiceDate', 'dueDate', 'status']}
            pageSizeDefault={10}
            onRowClick={(inv) => setPrintInvoice(inv)}
          />
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAddress
                    ? `Edit ${addrForm.type === 'BILLING' ? 'Billing' : 'Shipping'} Address`
                    : `Add New ${addrForm.type === 'BILLING' ? 'Billing' : 'Shipping'} Address`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Type *</label>
                  <select
                    value={addrForm.type}
                    onChange={(e) => setAddrForm({ ...addrForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="BILLING">Billing Address</option>
                    <option value="SHIPPING">Shipping Address</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attention / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Accounts Dept / Store Bay 2"
                    value={addrForm.attention}
                    onChange={(e) => setAddrForm({ ...addrForm, attention: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="Plot / Door No, Street / Industrial Zone"
                  value={addrForm.addressLine1}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Landmark, Area, Phase"
                  value={addrForm.addressLine2}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    required
                  >
                    {FALLBACK_INDIA_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label} ({s.stateCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={addrForm.pincode}
                    onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addrForm.country}
                    onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                Notice: Saving this address will automatically activate it as the primary{' '}
                {addrForm.type.toLowerCase()} address. The previous active address will be safely archived in
                Address History.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Basic Info Modal */}
      {isEditCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Customer Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerBasic} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    value={editFormData.contactPerson}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={editFormData.gstin}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹) *</label>
                <input
                  type="number"
                  value={editFormData.creditLimit}
                  onChange={(e) => setEditFormData({ ...editFormData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal with LOCKED Amount and Date for Customer Invoice */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          isOpen={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          targetType="INVOICE"
          documentId={selectedInvoiceForPayment.id}
          documentNumber={selectedInvoiceForPayment.invoiceNumber}
          partyName={selectedInvoiceForPayment.customerName}
          totalAmount={selectedInvoiceForPayment.totalAmount}
          paidAmount={selectedInvoiceForPayment.paidAmount || 0}
          outstandingAmount={
            selectedInvoiceForPayment.outstandingAmount !== undefined
              ? selectedInvoiceForPayment.outstandingAmount
              : Math.max(0, selectedInvoiceForPayment.totalAmount - (selectedInvoiceForPayment.paidAmount || 0))
          }
          onSuccess={() => setSelectedInvoiceForPayment(null)}
        />
      )}

      {/* Invoice PDF Print / Preview Modal */}
      {printInvoice && (
        <InvoicePrintModal invoice={printInvoice} onClose={() => setPrintInvoice(null)} />
      )}

      {/* Invoice History Modal */}
      {historyInvoice && (
        <InvoiceHistoryModal invoice={historyInvoice} onClose={() => setHistoryInvoice(null)} />
      )}

      {/* Invoices Export Modal */}
      <ExportModal<Invoice>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Tax Invoices - ${customer.name}`}
        data={customerInvoices}
        columns={exportColumns}
        filenamePrefix={`Tax_Invoices_${customer.code}`}
      />
    </div>
  );
};
