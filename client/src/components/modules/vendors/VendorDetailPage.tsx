import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Pencil,
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Clock,
  Lock,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useErpStore, Vendor, CustomerAddress, PurchaseOrder, Bill } from '../../../store/erpStore';
import { DataTable, ColumnDef } from '../../shared/DataTable';
import { FALLBACK_INDIA_STATES } from '../../../utils/indiaStates';
import { showAppToast } from '../../../utils/handleApiError';
import { usePermissions } from '../../../hooks/usePermissions';
import { PermissionGate } from '../../shared/PermissionGate';

interface VendorDetailPageProps {
  vendorId?: string;
  onBack?: () => void;
}

export const VendorDetailPage: React.FC<VendorDetailPageProps> = ({
  vendorId: propVendorId,
  onBack,
}) => {
  const purchasePerms = usePermissions('purchases');

  const {
    vendors,
    purchaseOrders,
    bills,
    updateVendor,
    addVendorAddress,
    activateVendorAddress,
    updateVendorAddress,
  } = useErpStore();

  // Extract ID from props or URL pathname (/vendors/:id)
  const vendorId = useMemo(() => {
    if (propVendorId) return propVendorId;
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'vendors' && parts[2]) {
        return parts[2];
      }
    }
    return '';
  }, [propVendorId]);

  const vendor = useMemo(() => {
    return vendors.find((v) => v.id === vendorId || (v as any)._id === vendorId);
  }, [vendors, vendorId]);

  // POs and Bills filtered for this vendor
  const vendorPOs = useMemo(() => {
    if (!vendor) return [];
    return purchaseOrders.filter(
      (po) => po.vendorId === vendor.id || po.vendorName?.toLowerCase() === vendor.name?.toLowerCase()
    );
  }, [purchaseOrders, vendor]);

  const vendorBills = useMemo(() => {
    if (!vendor) return [];
    return bills.filter(
      (b) => b.vendorId === vendor.id || b.vendorName?.toLowerCase() === vendor.name?.toLowerCase()
    );
  }, [bills, vendor]);

  // Tab State: 'pos' | 'bills' | 'history'
  const [activeTab, setActiveTab] = useState<'pos' | 'bills' | 'history'>('pos');

  // Address Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressTypeToAdd, setAddressTypeToAdd] = useState<'BILLING' | 'SHIPPING'>('BILLING');

  // Vendor Basic Info Edit Modal
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    city: '',
    state: 'Tamil Nadu',
  });

  useEffect(() => {
    if (vendor) {
      setEditFormData({
        name: vendor.name || '',
        contactPerson: vendor.contactPerson || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        gstin: vendor.gstin || '',
        pan: vendor.pan || '',
        city: vendor.city || '',
        state: vendor.state || 'Tamil Nadu',
      });
    }
  }, [vendor]);

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
  const totalBilled = vendorBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = vendorBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const outstandingDue = Math.max(0, totalBilled - totalPaid);

  // Addresses segmentation: Active vs Historical
  const allAddresses = vendor?.addresses || [];
  const activeBilling = allAddresses.find((a) => a.type === 'BILLING' && a.isActive);
  const activeShipping = allAddresses.find((a) => a.type === 'SHIPPING' && a.isActive);
  const addressHistory = allAddresses.filter((a) => !a.isActive);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/purchases');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleOpenAddAddress = (type: 'BILLING' | 'SHIPPING') => {
    setAddressTypeToAdd(type);
    setEditingAddress(null);
    setAddrForm({
      type,
      attention: vendor?.contactPerson || '',
      addressLine1: '',
      addressLine2: '',
      city: vendor?.city || 'Chennai',
      state: vendor?.state || 'Tamil Nadu',
      pincode: '',
      country: 'India',
      phone: vendor?.phone || '',
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddressTypeToAdd(addr.type);
    setAddrForm({
      type: addr.type,
      attention: addr.attention || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      phone: addr.phone || '',
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    if (!addrForm.addressLine1.trim() || !addrForm.city.trim() || !addrForm.pincode.trim()) {
      showAppToast('Please fill in Address Line 1, City and Pincode', 'warning');
      return;
    }

    try {
      if (!vendor) return;
      if (editingAddress && editingAddress.id) {
        await updateVendorAddress(vendor.id, editingAddress.id, addrForm);
      } else {
        await addVendorAddress(vendor.id, addrForm);
      }
      setIsAddressModalOpen(false);
    } catch (err) {
      // Toast already shown in store
    }
  };

  const handleActivateAddress = async (addressId: string) => {
    if (!vendor) return;
    try {
      await activateVendorAddress(vendor.id, addressId);
    } catch (err) {
      // Handled in store
    }
  };

  const handleSaveVendorBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    try {
      // Exclude gstin from updates to preserve statutory lock
      const { gstin, ...safeUpdates } = editFormData;
      await updateVendor(vendor.id, safeUpdates);
      setIsEditVendorModalOpen(false);
    } catch (err) {
      // Handled in store
    }
  };

  const navigateToCreatePO = () => {
    if (!vendor) return;
    window.history.pushState({}, '', `/purchase-orders/new?vendorId=${vendor.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navigateToEditPO = (poId: string) => {
    window.history.pushState({}, '', `/purchase-orders/${poId}/edit`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // PO Columns
  const poColumns: ColumnDef<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
      render: (po) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded whitespace-nowrap inline-block">
          {po.poNumber}
        </span>
      ),
    },
    {
      key: 'poDate',
      header: 'PO Date',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (po) => <span className="font-mono text-slate-700 text-xs">{po.poDate}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Expected By',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (po) => <span className="text-slate-500 text-xs">{po.expectedDate}</span>,
    },
    {
      key: 'taxableAmount',
      header: 'Taxable (₹)',
      sortable: true,
      align: 'right',
      render: (po) => (
        <span className="font-mono text-xs text-slate-700">
          ₹{(po.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'taxAmount',
      header: 'Tax (₹)',
      sortable: true,
      align: 'right',
      render: (po) => (
        <span className="font-mono text-xs text-slate-600">
          ₹{(po.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Grand Total (₹)',
      sortable: true,
      align: 'right',
      render: (po) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹{(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (po) => {
        const isApproved = po.status === 'Approved' || po.status === 'Received' || po.status === 'FULLY_BILLED';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : po.status === 'Cancelled'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {po.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-24 whitespace-nowrap',
      render: (po) => {
        const hasBills = po.status === 'Billed' || po.status === 'PARTIALLY_BILLED' || po.status === 'FULLY_BILLED';
        const hasPaid = (po.paidAmount || 0) > 0;
        const isLocked = hasBills || hasPaid;

        return (
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            {isLocked ? (
              <span
                className="p-1 text-slate-300 cursor-not-allowed"
                title="Editing locked: PO has bills or payments recorded"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            ) : (
              <button
                onClick={() => navigateToEditPO(po.id)}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition-colors"
                title="Edit Purchase Order"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Bill Columns
  const billColumns: ColumnDef<Bill>[] = [
    {
      key: 'billNumber',
      header: 'Bill Number',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
      render: (b) => (
        <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded whitespace-nowrap inline-block">
          {b.billNumber}
        </span>
      ),
    },
    {
      key: 'vendorInvoiceNumber',
      header: 'Vendor Inv #',
      sortable: true,
      className: 'w-32 whitespace-nowrap',
      render: (b) => <span className="font-mono text-slate-700 text-xs">{b.vendorInvoiceNumber || '—'}</span>,
    },
    {
      key: 'billDate',
      header: 'Bill Date',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (b) => <span className="font-mono text-slate-600 text-xs">{b.billDate}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (b) => <span className="font-mono text-slate-500 text-xs">{b.dueDate}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Grand Total (₹)',
      sortable: true,
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹{(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid (₹)',
      sortable: true,
      align: 'right',
      render: (b) => (
        <span className="font-mono text-xs text-emerald-700">
          ₹{(b.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (b) => {
        const isPaid = b.paymentStatus === 'PAID' || b.status === 'Paid';
        const isPartial = b.paymentStatus === 'PARTIALLY_PAID';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isPartial
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {b.paymentStatus || b.status}
          </span>
        );
      },
    },
    {
      key: 'storeMovementStatus',
      header: 'Store Status',
      sortable: true,
      render: (b) => {
        const isMoved = b.storeMovementStatus === 'FULLY_MOVED';
        const isPartial = b.storeMovementStatus === 'PARTIALLY_MOVED';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
              isMoved
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : isPartial
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {b.storeMovementStatus || 'NOT_MOVED'}
          </span>
        );
      },
    },
  ];

  if (!vendor) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Register
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Vendor Not Found</h2>
          <p className="text-slate-500 text-sm mb-4">
            The requested vendor profile could not be located in the current database.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Vendor Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={handleBack}
            className="mt-1 p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
            title="Back to Purchase Register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                {vendor.code}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{vendor.name}</h1>
              {vendor.gstin && (
                <span
                  className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300"
                  title="Statutory GSTIN Registered"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  GST: {vendor.gstin}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-4 flex-wrap">
              {vendor.contactPerson && (
                <span>Contact: <strong className="text-slate-700 font-semibold">{vendor.contactPerson}</strong></span>
              )}
              {vendor.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {vendor.phone}
                </span>
              )}
              {vendor.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {vendor.email}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <PermissionGate hasPermission={purchasePerms.canEdit} actionLabel="edit vendor" moduleName="vendors">
            <button
              onClick={() => setIsEditVendorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              Edit Vendor Profile
            </button>
          </PermissionGate>
          <PermissionGate hasPermission={purchasePerms.canAdd} actionLabel="create purchase order" moduleName="purchases">
            <button
              onClick={navigateToCreatePO}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{vendorPOs.length}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">{vendorBills.length} Bills Generated</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Billed</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-2 font-mono">
            ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-indigo-500 mt-0.5 block">Total Vendor Claims</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Disbursed</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-500 mt-0.5 block">Disbursements Completed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding Payable</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            ₹{outstandingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-rose-400 mt-0.5 block">Net Balance Due</span>
        </div>
      </div>

      {/* Address Master: Multiple Addresses with Single Active Default */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Vendor Addresses Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory billing and dispatch addresses. Exactly one address per classification is active for transactions.
            </p>
          </div>
          <PermissionGate hasPermission={purchasePerms.canEdit} actionLabel="manage addresses" moduleName="vendors">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAddAddress('BILLING')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Billing Address
              </button>
              <button
                onClick={() => handleOpenAddAddress('SHIPPING')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Shipping Address
              </button>
            </div>
          </PermissionGate>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Billing Address Card */}
          <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Active Billing Address
              </span>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Default
                </span>
                {activeBilling && (
                  <button
                    onClick={() => handleOpenEditAddress(activeBilling)}
                    className="p-1 hover:bg-blue-100/70 text-blue-600 rounded transition-colors"
                    title="Edit Billing Address"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {activeBilling ? (
              <div className="text-xs text-slate-700 space-y-1">
                {activeBilling.attention && (
                  <p className="font-semibold text-slate-900">Attn: {activeBilling.attention}</p>
                )}
                <p>{activeBilling.addressLine1}</p>
                {activeBilling.addressLine2 && <p>{activeBilling.addressLine2}</p>}
                <p>
                  {activeBilling.city}, {activeBilling.state} - {activeBilling.pincode}
                </p>
                <p className="text-slate-500">{activeBilling.country || 'India'}</p>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">
                <p>{vendor.billingAddress || vendor.address || 'No billing address defined yet.'}</p>
                {vendor.city && (
                  <p className="mt-1 font-medium text-slate-700">
                    {vendor.city}, {vendor.state || 'Tamil Nadu'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Shipping Address Card */}
          <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Active Dispatch / Shipping Address
              </span>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Default
                </span>
                {activeShipping && (
                  <button
                    onClick={() => handleOpenEditAddress(activeShipping)}
                    className="p-1 hover:bg-purple-100/70 text-purple-600 rounded transition-colors"
                    title="Edit Shipping Address"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {activeShipping ? (
              <div className="text-xs text-slate-700 space-y-1">
                {activeShipping.attention && (
                  <p className="font-semibold text-slate-900">Attn: {activeShipping.attention}</p>
                )}
                <p>{activeShipping.addressLine1}</p>
                {activeShipping.addressLine2 && <p>{activeShipping.addressLine2}</p>}
                <p>
                  {activeShipping.city}, {activeShipping.state} - {activeShipping.pincode}
                </p>
                <p className="text-slate-500">{activeShipping.country || 'India'}</p>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">
                <p>{vendor.shippingAddress || vendor.address || 'Same as billing address.'}</p>
                {vendor.city && (
                  <p className="mt-1 font-medium text-slate-700">
                    {vendor.city}, {vendor.state || 'Tamil Nadu'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Address History / Previous Inactive Addresses */}
        {addressHistory.length > 0 && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Address History ({addressHistory.length} archived / secondary)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {addressHistory.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded mr-2">
                      {addr.type}
                    </span>
                    <span className="font-medium text-slate-800">{addr.addressLine1}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => addr.id && handleActivateAddress(addr.id)}
                      className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors whitespace-nowrap shadow-2xs"
                      title="Make this address the active default"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleOpenEditAddress(addr)}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
                      title="Edit this address"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Purchase Orders | Vendor Bills | Audit Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Orders ({vendorPOs.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'bills'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Vendor Bills ({vendorBills.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Audit History & Logs
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'pos' && (
            <div>
              <DataTable
                data={vendorPOs}
                columns={poColumns}
                searchKeys={['poNumber']}
                searchPlaceholder="Search PO number..."
              />
            </div>
          )}

          {activeTab === 'bills' && (
            <div>
              <DataTable
                data={vendorBills}
                columns={billColumns}
                searchKeys={['billNumber', 'vendorInvoiceNumber']}
                searchPlaceholder="Search bill number or vendor invoice..."
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="py-4 px-2 space-y-4 max-w-3xl">
              {vendor.history && vendor.history.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {vendor.history.map((h, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{h.action}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(h.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {h.user && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Performed by: <span className="font-medium text-slate-700">{h.user}</span>
                          </p>
                        )}
                        {h.details && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-150">
                            {h.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No audit history records registered for this vendor.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Vendor Master Modal (GSTIN STRICTLY LOCKED) */}
      {isEditVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Vendor Profile</h3>
              </div>
              <button
                onClick={() => setIsEditVendorModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorBasic} className="p-6 space-y-4">
              {/* GSTIN Field - STRICTLY LOCKED */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    Statutory GSTIN (Locked)
                  </label>
                  <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Statutory Immutability
                  </span>
                </div>
                <input
                  type="text"
                  value={editFormData.gstin}
                  disabled
                  readOnly
                  className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed shadow-inner"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                  GSTIN cannot be edited after master creation to prevent invalidation of ITC claims and audit trails.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactPerson}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.pan}
                    onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value.toUpperCase() })}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {FALLBACK_INDIA_STATES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditVendorModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingAddress ? 'Edit Address' : `Add New ${addressTypeToAdd} Address`}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Type
                </label>
                <select
                  value={addrForm.type}
                  onChange={(e) => setAddrForm({ ...addrForm, type: e.target.value as any })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="BILLING">Billing Address</option>
                  <option value="SHIPPING">Shipping / Dispatch Address</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attention / Dept
                </label>
                <input
                  type="text"
                  value={addrForm.attention}
                  onChange={(e) => setAddrForm({ ...addrForm, attention: e.target.value })}
                  placeholder="e.g. Accounts Dept, Store Room"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={addrForm.addressLine1}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                  placeholder="Building, Plot, Street"
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addrForm.addressLine2}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })}
                  placeholder="Area, Landmark"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    required
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={addrForm.pincode}
                    onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                    required
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <select
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {FALLBACK_INDIA_STATES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
