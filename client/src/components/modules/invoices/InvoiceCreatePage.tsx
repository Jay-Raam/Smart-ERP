import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  FileCheck,
  Building2,
  Truck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Eye,
  AlertTriangle,
  Lock,
  Landmark,
  FileText,
  MapPin,
  Save,
} from 'lucide-react';
import { useErpStore, DocumentItem, Invoice, CustomerAddress } from '../../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../../utils/taxCalculation';
import { isValidQuantity } from '../../../utils/validation';
import { Combobox } from '../../shared/Combobox';
import { TaxInvoicePdfDocument } from './TaxInvoicePdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';
import { usePermissions } from '../../../hooks/usePermissions';

export interface InvoiceCreatePageProps {
  isEdit?: boolean;
  invoiceId?: string;
}

const DEFAULT_BANK_DETAILS = {
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200048192831',
  ifscCode: 'HDFC0001234',
  branchName: 'Guindy Industrial Estate, Chennai',
  accountName: 'Smart ERP Enterprise Solutions Pvt Ltd',
};

const DEFAULT_TERMS = [
  '1. Payment due strictly within 30 days of invoice date.',
  '2. Interest @ 18% p.a. will be levied on delayed payments beyond credit period.',
  '3. Goods once sold cannot be returned without prior written authorization.',
  '4. Subject to Chennai, Tamil Nadu jurisdiction only.',
  '5. This is a computer-generated tax invoice and requires no physical signature.',
];

export const InvoiceCreatePage: React.FC<InvoiceCreatePageProps> = ({ isEdit, invoiceId }) => {
  const {
    customers,
    products,
    invoices,
    bankAccounts,
    organisation,
    branches,
    activeBranchId,
    addInvoice,
    updateInvoice,
  } = useErpStore();

  // Detect Edit mode from props or URL (/invoices/:id/edit)
  const urlMatch = typeof window !== 'undefined' ? window.location.pathname.match(/\/invoices\/([^/]+)\/edit/) : null;
  const editId = invoiceId || (urlMatch ? urlMatch[1] : null);
  const isEditMode = Boolean(isEdit || editId);

  const { canAdd, canEdit } = usePermissions('invoices');
  const isPermitted = isEditMode ? canEdit : canAdd;

  // Parse query parameter for preselected customer (?customerId=...)
  const queryCustomerId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('customerId');
  }, []);

  const existingInvoice = useMemo(() => {
    if (!isEditMode || !editId) return null;
    return invoices.find((i) => i.id === editId || (i as any)._id === editId) || null;
  }, [invoices, isEditMode, editId]);

  // Payment and Statutory IRN locking check
  const hasIrn = Boolean(existingInvoice?.irn);
  const isPaidOrHasPayment = Boolean(
    existingInvoice &&
    (((existingInvoice.paidAmount || 0) > 0) || existingInvoice.status === 'Paid' || hasIrn)
  );

  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);

  // Filter approved products only
  const approvedProducts = useMemo(() => {
    return products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }, [products]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shippingCharge, setShippingCharge] = useState<number>(0);

  // Address states
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>('');
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>('');
  const [customBillingAddress, setCustomBillingAddress] = useState<string>('');
  const [customShippingAddress, setCustomShippingAddress] = useState<string>('');
  const [selectedBillingState, setSelectedBillingState] = useState<string>('Tamil Nadu');
  const [selectedShippingState, setSelectedShippingState] = useState<string>('Tamil Nadu');

  // Bank details & terms states
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS.join('\n'));

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

  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial customer selection
  useEffect(() => {
    if (existingInvoice) {
      setSelectedCustomerId(existingInvoice.customerId);
      setDueDate(existingInvoice.dueDate || new Date().toISOString().split('T')[0]);
      setShippingCharge(existingInvoice.shippingCharge || 0);
      setCustomBillingAddress(existingInvoice.billingAddress || '');
      setCustomShippingAddress(existingInvoice.shippingAddress || existingInvoice.billingAddress || '');
      setSelectedBillingState(existingInvoice.billingState || existingInvoice.customerState || 'Tamil Nadu');
      setSelectedShippingState(existingInvoice.shippingState || existingInvoice.customerState || 'Tamil Nadu');

      if (existingInvoice.bankDetails) {
        setBankDetails({
          bankName: existingInvoice.bankDetails.bankName || DEFAULT_BANK_DETAILS.bankName,
          accountNumber: existingInvoice.bankDetails.accountNumber || DEFAULT_BANK_DETAILS.accountNumber,
          ifscCode: existingInvoice.bankDetails.ifscCode || DEFAULT_BANK_DETAILS.ifscCode,
          branchName: existingInvoice.bankDetails.branchName || DEFAULT_BANK_DETAILS.branchName,
          accountName: existingInvoice.bankDetails.accountName || DEFAULT_BANK_DETAILS.accountName,
        });
      }
      if (existingInvoice.termsAndConditions) {
        setTermsText(
          Array.isArray(existingInvoice.termsAndConditions)
            ? (existingInvoice.termsAndConditions as string[]).join('\n')
            : String(existingInvoice.termsAndConditions)
        );
      }

      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setLineItems(
          existingInvoice.items.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            hsnCode: it.hsnCode || '84713010',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            uom: it.uom || 'Nos',
            discountPercent: it.discountPercent || 0,
            taxRate: it.taxRate ?? 18,
          }))
        );
      }
    } else if (queryCustomerId && customers.some((c) => c.id === queryCustomerId)) {
      setSelectedCustomerId(queryCustomerId);
    } else if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [existingInvoice, queryCustomerId, customers]);

  // Selected customer master details
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Customer addresses lists
  const billingAddresses = useMemo(() => {
    if (!activeCustomer) return [];
    return (activeCustomer.addresses || []).filter((a) => a.type === 'BILLING');
  }, [activeCustomer]);

  const shippingAddresses = useMemo(() => {
    if (!activeCustomer) return [];
    return (activeCustomer.addresses || []).filter((a) => a.type === 'SHIPPING');
  }, [activeCustomer]);

  // Update address selectors when activeCustomer changes in CREATE mode
  useEffect(() => {
    if (isEditMode && existingInvoice) return;
    if (!activeCustomer) return;

    // Billing address default setup
    const activeBilling = billingAddresses.find((a) => a.isActive) || billingAddresses[0];
    if (activeBilling) {
      setSelectedBillingAddressId(activeBilling._id || (activeBilling as any).id || 'active');
      const formatted = [
        activeBilling.attention ? `Attn: ${activeBilling.attention}` : '',
        activeBilling.addressLine1,
        activeBilling.addressLine2,
        activeBilling.city,
        activeBilling.state,
        activeBilling.pincode,
      ]
        .filter(Boolean)
        .join(', ');
      setCustomBillingAddress(formatted);
      setSelectedBillingState(activeBilling.state || activeCustomer.billingState || activeCustomer.state || 'Tamil Nadu');
    } else {
      setSelectedBillingAddressId('default');
      setCustomBillingAddress(activeCustomer.billingAddress || activeCustomer.address || '');
      setSelectedBillingState(activeCustomer.billingState || activeCustomer.state || 'Tamil Nadu');
    }

    // Shipping address default setup
    const activeShipping = shippingAddresses.find((a) => a.isActive) || shippingAddresses[0];
    if (activeShipping) {
      setSelectedShippingAddressId(activeShipping._id || (activeShipping as any).id || 'active');
      const formatted = [
        activeShipping.attention ? `Attn: ${activeShipping.attention}` : '',
        activeShipping.addressLine1,
        activeShipping.addressLine2,
        activeShipping.city,
        activeShipping.state,
        activeShipping.pincode,
      ]
        .filter(Boolean)
        .join(', ');
      setCustomShippingAddress(formatted);
      setSelectedShippingState(activeShipping.state || activeCustomer.shippingState || activeCustomer.billingState || 'Tamil Nadu');
    } else {
      setSelectedShippingAddressId('default');
      setCustomShippingAddress(
        activeCustomer.shippingAddress || activeCustomer.billingAddress || activeCustomer.address || ''
      );
      setSelectedShippingState(
        activeCustomer.shippingState || activeCustomer.billingState || activeCustomer.state || 'Tamil Nadu'
      );
    }
  }, [activeCustomer, billingAddresses, shippingAddresses, isEditMode, existingInvoice]);

  // Initialize first item if empty
  useEffect(() => {
    if (lineItems.length === 0 && approvedProducts.length > 0 && !isEditMode) {
      const p = approvedProducts[0];
      setLineItems([
        {
          productId: p.id,
          productName: p.name,
          hsnCode: p.hsnCode || '84713010',
          quantity: 1,
          unitPrice: p.sellingPrice || 1000,
          uom: p.uom || 'Nos',
          discountPercent: 0,
          taxRate: p.taxRate ?? 18,
        },
      ]);
    }
  }, [approvedProducts, isEditMode, lineItems.length]);

  const customerGstin = activeCustomer?.gstin || '';
  const isTN = isStateTamilNadu(selectedBillingState, customerGstin);

  // Live tax calculations driven strictly by selected billing state
  const taxCalculation = useMemo(() => {
    return calculateDocumentTaxes({
      items: lineItems,
      billingState: selectedBillingState,
      partyGstin: customerGstin,
      shippingCharge: Number(shippingCharge) || 0,
    });
  }, [lineItems, selectedBillingState, customerGstin, shippingCharge]);

  const handleProductSelect = (index: number, productId: string) => {
    const prod = approvedProducts.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      hsnCode: prod.hsnCode || '84713010',
      unitPrice: prod.sellingPrice || 1000,
      uom: prod.uom || 'Nos',
      taxRate: prod.taxRate ?? 18,
    };
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, qtyStr: string) => {
    const num = Math.max(1, parseInt(qtyStr) || 1);
    const updated = [...lineItems];
    updated[index].quantity = num;
    setLineItems(updated);
  };

  const handleRateChange = (index: number, rateStr: string) => {
    const num = Math.max(0, parseFloat(rateStr) || 0);
    const updated = [...lineItems];
    updated[index].unitPrice = num;
    setLineItems(updated);
  };

  const addLineItem = () => {
    if (approvedProducts.length === 0) return;
    const prod = approvedProducts[0];
    setLineItems([
      ...lineItems,
      {
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '84713010',
        quantity: 1,
        unitPrice: prod.sellingPrice || 1000,
        uom: prod.uom || 'Nos',
        discountPercent: 0,
        taxRate: prod.taxRate ?? 18,
      },
    ]);
  };

  // Modifying / removing items ONLY modifies local state
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    }
  };

  // Handle Billing Address Combobox Change
  const handleBillingAddressChange = (addrId: string) => {
    setSelectedBillingAddressId(addrId);
    if (addrId === 'default') {
      setCustomBillingAddress(activeCustomer?.billingAddress || activeCustomer?.address || '');
      setSelectedBillingState(activeCustomer?.billingState || activeCustomer?.state || 'Tamil Nadu');
      return;
    }
    const found = billingAddresses.find((a) => (a._id || (a as any).id) === addrId);
    if (found) {
      const formatted = [
        found.attention ? `Attn: ${found.attention}` : '',
        found.addressLine1,
        found.addressLine2,
        found.city,
        found.state,
        found.pincode,
      ]
        .filter(Boolean)
        .join(', ');
      setCustomBillingAddress(formatted);
      setSelectedBillingState(found.state || 'Tamil Nadu');
    }
  };

  // Handle Shipping Address Combobox Change
  const handleShippingAddressChange = (addrId: string) => {
    setSelectedShippingAddressId(addrId);
    if (addrId === 'default') {
      setCustomShippingAddress(
        activeCustomer?.shippingAddress || activeCustomer?.billingAddress || activeCustomer?.address || ''
      );
      setSelectedShippingState(
        activeCustomer?.shippingState || activeCustomer?.billingState || activeCustomer?.state || 'Tamil Nadu'
      );
      return;
    }
    const found = shippingAddresses.find((a) => (a._id || (a as any).id) === addrId);
    if (found) {
      const formatted = [
        found.attention ? `Attn: ${found.attention}` : '',
        found.addressLine1,
        found.addressLine2,
        found.city,
        found.state,
        found.pincode,
      ]
        .filter(Boolean)
        .join(', ');
      setCustomShippingAddress(formatted);
      setSelectedShippingState(found.state || 'Tamil Nadu');
    }
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    if (!isPermitted) {
      alert(`Permission denied: You do not have permission to ${isEditMode ? 'edit' : 'create'} invoices.`);
      return;
    }

    if (hasIrn) {
      alert('Cannot modify an invoice with a registered statutory GST IRN.');
      return;
    }

    if (isPaidOrHasPayment) {
      alert('Cannot modify an invoice with recorded payments.');
      return;
    }

    // Validate line items
    const hasInvalidQty = lineItems.some((item) => !isValidQuantity(item.quantity));
    if (hasInvalidQty) {
      alert('All line item quantities must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoicePayload = {
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        customerGstin: activeCustomer.gstin || '',
        customerState: selectedBillingState,
        billingState: selectedBillingState,
        shippingState: selectedShippingState,
        billingAddress: customBillingAddress,
        shippingAddress: customShippingAddress,
        dueDate: dueDate,
        items: taxCalculation.items as DocumentItem[],
        subtotal: taxCalculation.subtotal,
        taxableAmount: taxCalculation.taxableAmount,
        totalDiscount: taxCalculation.totalDiscount,
        gstRate: lineItems[0]?.taxRate || 18,
        shippingCharge: Number(shippingCharge) || 0,
        shippingTax: taxCalculation.shippingTax,
        cgstAmount: taxCalculation.cgstAmount,
        sgstAmount: taxCalculation.sgstAmount,
        igstAmount: taxCalculation.igstAmount,
        taxAmount: taxCalculation.totalTax,
        totalAmount: taxCalculation.grandTotal,
        totalInWords: taxCalculation.totalInWords,
        bankDetails: bankDetails,
        termsAndConditions: termsText,
      };

      if (isEditMode && existingInvoice) {
        const updated = await updateInvoice(existingInvoice.id, invoicePayload);
        if (updated) {
          setCreatedInvoice(updated);
          setIsPdfModalOpen(true);
        }
      } else {
        const created = await addInvoice({
          ...invoicePayload,
          invoiceDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
        });
        if (created) {
          setCreatedInvoice(created);
          setIsPdfModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateBack = () => {
    window.history.pushState({}, '', '/invoices');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Options for Combobox components
  const customerComboboxOptions = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.code})`,
      sublabel: `GSTIN: ${c.gstin || 'None'} • ${c.billingState || c.state || 'Tamil Nadu'}`,
    }));
  }, [customers]);

  const billingComboboxOptions = useMemo(() => {
    return [
      {
        value: 'default',
        label: `Primary: ${activeCustomer?.billingAddress || 'Primary Billing Address on file'}`,
        sublabel: `State: ${activeCustomer?.billingState || activeCustomer?.state || 'Tamil Nadu'}`,
      },
      ...billingAddresses.map((addr) => ({
        value: addr._id || (addr as any).id,
        label: `${addr.attention ? `${addr.attention} - ` : ''}${addr.addressLine1}, ${addr.city}`,
        sublabel: `${addr.state} - ${addr.pincode} (${addr.isActive ? 'Active' : 'Archived'})`,
      })),
    ];
  }, [activeCustomer, billingAddresses]);

  const shippingComboboxOptions = useMemo(() => {
    return [
      {
        value: 'default',
        label: `Primary: ${activeCustomer?.shippingAddress || activeCustomer?.billingAddress || 'Primary Shipping Address on file'}`,
        sublabel: `State: ${activeCustomer?.shippingState || activeCustomer?.billingState || activeCustomer?.state || 'Tamil Nadu'}`,
      },
      ...shippingAddresses.map((addr) => ({
        value: addr._id || (addr as any).id,
        label: `${addr.attention ? `${addr.attention} - ` : ''}${addr.addressLine1}, ${addr.city}`,
        sublabel: `${addr.state} - ${addr.pincode} (${addr.isActive ? 'Active' : 'Archived'})`,
      })),
    ];
  }, [activeCustomer, shippingAddresses]);

  const productComboboxOptions = useMemo(() => {
    return approvedProducts.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `SKU: ${p.sku} • HSN: ${p.hsnCode} • Rate: ₹${(p.sellingPrice || 0).toLocaleString('en-IN')}`,
    }));
  }, [approvedProducts]);

  const bankComboboxOptions = useMemo(() => {
    return (bankAccounts || []).map((b) => ({
      value: b.id,
      label: `${b.bankName} - ${b.accountNumber}`,
      sublabel: `${b.branchName ? `${b.branchName} • ` : ''}${b.accountHolderName || organisation.name}`,
    }));
  }, [bankAccounts, organisation.name]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={navigateBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Back to Invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isEditMode ? `Edit Tax Invoice #${existingInvoice?.invoiceNumber || ''}` : 'Generate Direct Tax Invoice'}
              </h1>
              {isEditMode && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Edit Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Restriction Banner */}
      {!isPermitted && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-rose-700" />
              <span>Permission Required: {isEditMode ? 'Edit Invoices' : 'Create Invoices'}</span>
            </h3>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              Your account lacks the <span className="font-semibold">{isEditMode ? 'edit' : 'add'}</span> permission for the Invoices module. You can review the invoice details, but modifications and issuance are restricted.
            </p>
          </div>
        </div>
      )}

      {/* Statutory IRN Lock Warning Banner if invoice has generated IRN */}
      {hasIrn && (
        <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4 shadow-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-purple-700" />
              <span>Invoice Immutable: Statutory E-Invoice IRN Registered</span>
            </h3>
            <p className="text-xs text-purple-800 mt-1 leading-relaxed">
              This invoice has already been registered with an official statutory IRN:{' '}
              <span className="font-mono font-bold text-purple-900">{existingInvoice?.irn}</span>.
              Under Indian GST e-Invoicing regulations, invoices with a registered IRN are legally permanent and cannot be modified.
            </p>
          </div>
        </div>
      )}

      {/* Payment Lock Warning Banner if invoice has recorded payment */}
      {isPaidOrHasPayment && !hasIrn && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-amber-700" />
              <span>Invoice Locked: Recorded Payments Detected</span>
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              This invoice has recorded customer payments of{' '}
              <span className="font-mono font-bold">
                ₹{(existingInvoice?.paidAmount || 0).toLocaleString('en-IN')}
              </span>{' '}
              and is in status <span className="font-semibold">{existingInvoice?.status}</span>. In accordance with
              statutory GST and financial accounting compliance, invoices with active payments cannot be modified.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onFormSubmit} className="space-y-6">
        {/* Customer & Address Integration Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Customer & Master Data Integration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Customer Combobox */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <Combobox
                disabled={isEditMode || isPaidOrHasPayment}
                value={selectedCustomerId}
                onChange={(val) => setSelectedCustomerId(val)}
                options={customerComboboxOptions}
                placeholder="Search or select customer..."
                searchable={true}
              />
            </div>

            {/* Payment Due Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled={isPaidOrHasPayment}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800 disabled:bg-slate-100"
                required
              />
            </div>

            {/* GSTIN & Place of Supply */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1">GSTIN & Calculated Place of Supply</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 text-xs flex items-center justify-between">
                <span>{customerGstin || 'Unregistered'}</span>
                <span className="font-bold text-blue-700">{selectedBillingState}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Address Comboboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
            {/* Billed To Address Combobox */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>Billed To Address (Combobox)</span>
                </span>
                <span className="text-[11px] font-mono text-blue-600 font-normal">
                  State: {selectedBillingState}
                </span>
              </label>
              <Combobox
                disabled={isPaidOrHasPayment}
                value={selectedBillingAddressId}
                onChange={(val) => handleBillingAddressChange(val)}
                options={billingComboboxOptions}
                placeholder="Search or select billing address..."
                searchable={true}
              />
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs min-h-[44px]">
                {customBillingAddress || 'No billing address selected'}
              </div>
            </div>

            {/* Shipped To Address Combobox */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Shipped To Address (Combobox)</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 font-normal">
                  State: {selectedShippingState}
                </span>
              </label>
              <Combobox
                disabled={isPaidOrHasPayment}
                value={selectedShippingAddressId}
                onChange={(val) => handleShippingAddressChange(val)}
                options={shippingComboboxOptions}
                placeholder="Search or select shipping address..."
                searchable={true}
              />
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs min-h-[44px]">
                {customShippingAddress || 'No shipping address selected'}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tax Invoice Line Items ({lineItems.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Modifications and deletions are preserved locally until final invoice save.
              </p>
            </div>
            {!isPaidOrHasPayment && (
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-center rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-xs"
              >
                {/* Product Combobox */}
                <div className="col-span-4">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Product Master</label>
                  <Combobox
                    disabled={isPaidOrHasPayment}
                    value={item.productId}
                    onChange={(val) => handleProductSelect(idx, val)}
                    options={productComboboxOptions}
                    placeholder="Search or select product..."
                    searchable={true}
                  />
                </div>

                {/* Locked HSN Code */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">HSN Code</label>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-600 text-center">
                    {item.hsnCode}
                  </div>
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Qty ({item.uom})</label>
                  <input
                    type="number"
                    min="1"
                    disabled={isPaidOrHasPayment}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-right outline-none focus:border-blue-500 text-slate-800 disabled:bg-slate-100"
                  />
                </div>

                {/* GST Rate */}
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">GST %</label>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-center text-slate-700">
                    {item.taxRate}%
                  </div>
                </div>


                {/* Rate */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={isPaidOrHasPayment}
                    value={item.unitPrice}
                    onChange={(e) => handleRateChange(idx, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-right outline-none focus:border-blue-500 text-slate-800 disabled:bg-slate-100"
                  />
                </div>


                {/* Action */}
                <div className="col-span-1 flex items-center justify-end pt-4">
                  {lineItems.length > 1 && !isPaidOrHasPayment && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                      title="Remove item from invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Freight Charges */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-blue-600" />
            <span>Freight & Shipping Logistics (SAC 9965 @ 18% GST)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Freight Amount (INR)</label>
              <input
                type="number"
                min="0"
                step="any"
                disabled={isPaidOrHasPayment}
                value={shippingCharge}
                onChange={(e) => setShippingCharge(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-center">
              <span className="text-[11px] text-slate-500">Logistics Tax Breakdown:</span>
              <span className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                SAC 9965 @ 18% = ₹{(taxCalculation.shippingTax || 0).toFixed(2)} ({isTN ? '9% CGST + 9% SGST' : '18% IGST'})
              </span>
            </div>
          </div>
        </div>

        {/* Editable Bank Details & Terms and Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editable Bank Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-indigo-600" />
                <span>Company Bank Details (Editable per Invoice)</span>
              </div>
              {bankAccounts && bankAccounts.length > 0 && (
                <div className="w-56">
                  <Combobox
                    disabled={isPaidOrHasPayment}
                    value=""
                    onChange={(val) => {
                      const acc = bankAccounts.find((b) => b.id === val);
                      if (acc) {
                        setBankDetails({
                          bankName: acc.bankName,
                          accountNumber: acc.accountNumber,
                          ifscCode: acc.ifscCode,
                          branchName: acc.branchName,
                          accountName: acc.accountHolderName || organisation.name,
                        });
                      }
                    }}
                    options={bankComboboxOptions}
                    placeholder="Quick Fill Bank..."
                    searchable={true}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-0.5">Account Name / Beneficiary</label>
                <input
                  type="text"
                  disabled={isPaidOrHasPayment}
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    disabled={isPaidOrHasPayment}
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Branch Name</label>
                  <input
                    type="text"
                    disabled={isPaidOrHasPayment}
                    value={bankDetails.branchName}
                    onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Account Number</label>
                  <input
                    type="text"
                    disabled={isPaidOrHasPayment}
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    disabled={isPaidOrHasPayment}
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-slate-800 outline-none focus:border-blue-500 uppercase disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editable Terms & Conditions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-600" />
                <span>Terms & Conditions (Editable per Invoice)</span>
              </div>
              <button
                type="button"
                disabled={isPaidOrHasPayment}
                onClick={() => setTermsText(DEFAULT_TERMS.join('\n'))}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer disabled:text-slate-400"
              >
                Reset Defaults
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter each condition on a separate line. These will be formatted and printed directly onto the tax invoice PDF.
            </p>
            <textarea
              rows={6}
              disabled={isPaidOrHasPayment}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-700 font-mono leading-relaxed outline-none focus:border-blue-500 disabled:bg-slate-100"
              placeholder="Enter terms and conditions line by line..."
            />
          </div>
        </div>

        {/* Summary & Totals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Place of Supply</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {selectedBillingState} ({isTN ? 'Intra-State: CGST + SGST Split' : 'Inter-State: Full IGST'})
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-semibold">Invoice Grand Total</span>
              <div className="text-2xl font-bold font-mono text-blue-600">
                ₹{taxCalculation.grandTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Taxable Subtotal</span>
              <div className="font-mono font-bold text-slate-900 mt-1">
                ₹{taxCalculation.taxableAmount.toFixed(2)}
              </div>
            </div>

            {isTN ? (
              <>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">CGST</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">
                    ₹{taxCalculation.cgstAmount.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">SGST</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">
                    ₹{taxCalculation.sgstAmount.toFixed(2)}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-slate-500">IGST (Integrated Tax)</span>
                <div className="font-mono font-bold text-slate-900 mt-1">
                  ₹{taxCalculation.igstAmount.toFixed(2)}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Total GST</span>
              <div className="font-mono font-bold text-slate-900 mt-1">
                ₹{taxCalculation.totalTax.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="text-xs text-slate-500 italic">
            Amount in words: <span className="font-semibold text-slate-700">{taxCalculation.totalInWords}</span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={navigateBack}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPaidOrHasPayment || !isPermitted}
              title={!isPermitted ? `Permission required to ${isEditMode ? 'edit' : 'create'} invoices` : undefined}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Tax Invoice'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? 'Issuing...' : 'Confirm & Issue Invoice'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Vector PDF Modal */}
      {createdInvoice && (
        <PdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => {
            setIsPdfModalOpen(false);
            navigateBack();
          }}
          title={`Tax Invoice #${createdInvoice.invoiceNumber}`}
          fileName={`Invoice_${createdInvoice.invoiceNumber}.pdf`}
          document={
            <TaxInvoicePdfDocument
              invoice={createdInvoice}
              organisation={organisation}
              branch={activeBranch}
              bankAccount={bankAccounts[0]}
            />
          }
        />
      )}
    </div>
  );
};
