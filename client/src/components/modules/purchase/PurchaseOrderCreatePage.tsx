import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileCheck,
  Building2,
  Truck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Eye,
  Lock,
  Clock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useErpStore, DocumentItem, PurchaseOrder } from '../../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../../utils/taxCalculation';
import { useFormValidation, isValidQuantity } from '../../../utils/validation';
import { PurchaseOrderPdfDocument } from '../../pdf/PurchaseOrderPdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';
import { showAppToast } from '../../../utils/handleApiError';

interface PoFormData {
  vendorId: string;
  vendorAddress: string;
  poDate: string;
  expectedDate: string;
  shippingCharge: number;
}

export const PurchaseOrderCreatePage: React.FC = () => {
  const {
    vendors,
    products,
    purchaseOrders,
    activeBranchId,
    addPurchaseOrder,
    updatePurchaseOrder,
  } = useErpStore();

  // Determine if Edit Mode from URL path e.g. /purchase-orders/:id/edit
  const editPoId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'purchase-orders' && parts[3] === 'edit' && parts[2]) {
        return parts[2];
      }
    }
    return null;
  }, []);

  const existingPo = useMemo(() => {
    if (!editPoId) return null;
    return purchaseOrders.find((p) => p.id === editPoId || (p as any)._id === editPoId) || null;
  }, [editPoId, purchaseOrders]);

  const isEditMode = Boolean(editPoId && existingPo);

  // Check lock rules: cannot edit if advance payment recorded or converted to bill
  const isEditLocked = useMemo(() => {
    if (!existingPo) return false;
    const hasAdvance = (existingPo.paidAmount || 0) > 0;
    const isBilled =
      existingPo.status === 'Billed' ||
      existingPo.status === 'PARTIALLY_BILLED' ||
      existingPo.status === 'FULLY_BILLED';
    return hasAdvance || isBilled;
  }, [existingPo]);

  // Read vendorId from query param if available (e.g. /purchase-orders/new?vendorId=...)
  const queryVendorId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('vendorId');
    }
    return null;
  }, []);

  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    existingPo?.vendorId || queryVendorId || vendors[0]?.id || ''
  );

  const [customVendorAddress, setCustomVendorAddress] = useState<string>(
    existingPo?.vendorAddress || ''
  );

  const [createdPo, setCreatedPo] = useState<PurchaseOrder | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Filter approved products only
  const approvedProducts = useMemo(() => {
    return products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }, [products]);

  // Selected vendor master details
  const activeVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  }, [vendors, selectedVendorId]);

  // When vendor changes and not editing existing PO, reset address to vendor default
  useEffect(() => {
    if (!isEditMode && activeVendor) {
      const defaultAddr =
        activeVendor.billingAddress ||
        activeVendor.address ||
        (activeVendor.addresses && activeVendor.addresses.length > 0 ? activeVendor.addresses[0].addressLine1 : '') ||
        '';
      setCustomVendorAddress(defaultAddr);
    }
  }, [activeVendor, isEditMode]);

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

  // Initialize line items from existing PO (if editing) or first approved product
  useEffect(() => {
    if (isEditMode && existingPo && existingPo.items) {
      setLineItems(
        existingPo.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          hsnCode: it.hsnCode || '81089010',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          uom: it.uom || 'Nos',
          discountPercent: it.discountPercent || 0,
          taxRate: it.taxRate ?? 18,
        }))
      );
      if (existingPo.vendorId) {
        setSelectedVendorId(existingPo.vendorId);
      }
      if (existingPo.vendorAddress) {
        setCustomVendorAddress(existingPo.vendorAddress);
      }
    } else if (lineItems.length === 0 && approvedProducts.length > 0) {
      const p = approvedProducts[0];
      setLineItems([
        {
          productId: p.id,
          productName: p.name,
          hsnCode: p.hsnCode || '81089010',
          quantity: 10,
          unitPrice: p.purchaseCost || p.sellingPrice || 1000,
          uom: p.uom || 'Nos',
          discountPercent: 0,
          taxRate: p.taxRate ?? 18,
        },
      ]);
    }
  }, [isEditMode, existingPo, approvedProducts]);

  // Locked PO Date: today's date for new PO or existing PO date if editing
  const poDate = useMemo(() => {
    if (isEditMode && existingPo?.poDate) return existingPo.poDate;
    return new Date().toISOString().split('T')[0];
  }, [isEditMode, existingPo]);

  // Form Validation
  const {
    values: formVals,
    errors: formErrors,
    touched: formTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useFormValidation<PoFormData>({
    initialValues: {
      vendorId: selectedVendorId,
      vendorAddress: customVendorAddress,
      poDate: poDate,
      expectedDate:
        existingPo?.expectedDate ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharge: existingPo?.shippingCharge || 0,
    },
    validationSchema: {
      expectedDate: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'Expected Delivery Date is mandatory.',
        },
      ],
    },
  });

  const vendorState = activeVendor?.billingState || activeVendor?.state || 'Tamil Nadu';
  const vendorGstin = activeVendor?.gstin || '';

  // Live tax calculations
  const taxCalculation = useMemo(() => {
    return calculateDocumentTaxes({
      items: lineItems,
      billingState: vendorState,
      partyGstin: vendorGstin,
      shippingCharge: Number(formVals.shippingCharge) || 0,
    });
  }, [lineItems, vendorState, vendorGstin, formVals.shippingCharge]);

  const handleProductSelect = (index: number, productId: string) => {
    const prod = approvedProducts.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      hsnCode: prod.hsnCode || '81089010',
      unitPrice: prod.purchaseCost || prod.sellingPrice || 1000,
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

  const addLineItem = () => {
    if (approvedProducts.length === 0) return;
    const prod = approvedProducts[0];
    setLineItems([
      ...lineItems,
      {
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode || '81089010',
        quantity: 1,
        unitPrice: prod.purchaseCost || prod.sellingPrice || 1000,
        uom: prod.uom || 'Nos',
        discountPercent: 0,
        taxRate: prod.taxRate ?? 18,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    }
  };

  const onFormSubmit = async (data: PoFormData) => {
    if (!activeVendor) return;

    if (isEditLocked) {
      showAppToast('Editing is locked because payment or bills have been recorded.', 'error');
      return;
    }

    // Validate quantities
    const hasInvalidQty = lineItems.some((item) => !isValidQuantity(item.quantity));
    if (hasInvalidQty) {
      showAppToast('All line item quantities must be greater than 0.', 'warning');
      return;
    }

    const payload = {
      vendorId: activeVendor.id,
      vendorName: activeVendor.name,
      vendorGstin: activeVendor.gstin || '',
      vendorAddress: customVendorAddress.trim() || activeVendor.billingAddress || activeVendor.address || '',
      vendorState: vendorState,
      poDate: poDate, // Locked PO date saved to backend
      expectedDate: data.expectedDate,
      branchId: activeBranchId,
      items: taxCalculation.items as DocumentItem[],
      subtotal: taxCalculation.subtotal,
      taxableAmount: taxCalculation.taxableAmount,
      totalDiscount: taxCalculation.totalDiscount,
      shippingCharge: Number(data.shippingCharge) || 0,
      shippingTax: taxCalculation.shippingTax,
      cgstAmount: taxCalculation.cgstAmount,
      sgstAmount: taxCalculation.sgstAmount,
      igstAmount: taxCalculation.igstAmount,
      taxAmount: taxCalculation.totalTax,
      totalAmount: taxCalculation.grandTotal,
      totalInWords: taxCalculation.totalInWords,
    };

    if (isEditMode && existingPo) {
      const updated = await updatePurchaseOrder(existingPo.id, payload);
      if (updated) {
        setCreatedPo(updated);
        setIsPdfModalOpen(true);
      }
    } else {
      const po = await addPurchaseOrder({
        ...payload,
        status: 'Approved',
      });
      if (po) {
        setCreatedPo(po);
        setIsPdfModalOpen(true);
      }
    }
  };

  const navigateBack = () => {
    window.history.pushState({}, '', '/purchases');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={navigateBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Back to Procurement"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isEditMode ? `Edit Purchase Order: ${existingPo?.poNumber}` : 'Create New Purchase Order'}
              </h1>
              {isEditLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <Lock className="w-3 h-3 text-rose-600" />
                  Locked (Financial Inward)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? 'Modify purchase requisition items and logistics parameters prior to bill execution'
                : 'Procure raw materials & components from approved vendor directory with locked catalog pricing'}
            </p>
          </div>
        </div>

        {isEditMode && existingPo?.history && existingPo.history.length > 0 && (
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit History ({existingPo.history.length})</span>
          </button>
        )}
      </div>

      {/* Lock Alert Banner */}
      {isEditLocked && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 flex items-start gap-3 text-xs text-rose-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Purchase Order Immutability Enforced</h4>
            <p className="mt-0.5 text-rose-700">
              This Purchase Order cannot be edited because advance disbursements (₹
              {(existingPo?.paidAmount || 0).toLocaleString('en-IN')}) or Vendor Bills ({existingPo?.status}) have
              already been booked against it. Requisitions cannot be altered once commercial ledger vouchers are created.
            </p>
          </div>
        </div>
      )}

      {/* History Drawer / Panel */}
      {isHistoryOpen && existingPo?.history && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
          <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            PO Audit Trail & Modifications
          </h4>
          <div className="space-y-2">
            {existingPo.history.map((h, idx) => (
              <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-blue-100 flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800">{h.action}</span>
                  {h.details && <p className="text-slate-600 text-[11px] mt-0.5">{h.details}</p>}
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                  <div>{new Date(h.timestamp).toLocaleDateString('en-IN')}</div>
                  <div>{new Date(h.timestamp).toLocaleTimeString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Vendor & Logistics Details Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>Vendor Selection & Delivery Timeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Vendor Selector - Standard SELECT box */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVendorId}
                disabled={isEditLocked}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVendorId(val);
                  setFieldValue('vendorId', val);
                  const selectedV = vendors.find((v) => v.id === val);
                  if (selectedV) {
                    const addr =
                      selectedV.billingAddress ||
                      selectedV.address ||
                      (selectedV.addresses && selectedV.addresses.length > 0 ? selectedV.addresses[0].addressLine1 : '') ||
                      '';
                    setCustomVendorAddress(addr);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>

            {/* PO Date (Locked Field, Saved to Backend) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  PO Date (Locked) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Auto
                </span>
              </div>
              <input
                type="date"
                value={poDate}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-100 text-slate-600 font-mono text-xs cursor-not-allowed shadow-inner"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expectedDate"
                disabled={isEditLocked}
                value={formVals.expectedDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Locked Vendor GSTIN & State */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Vendor GSTIN & State</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 text-xs">
                {vendorGstin || 'Unregistered'} • {vendorState}
              </div>
            </div>
          </div>

          {/* Changeable Vendor Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Vendor Dispatch / Plant Address (Changeable)
                </label>
                {activeVendor?.addresses && activeVendor.addresses.length > 1 && (
                  <select
                    disabled={isEditLocked}
                    onChange={(e) => {
                      const addr = activeVendor.addresses?.find((a) => a.id === e.target.value);
                      if (addr) {
                        setCustomVendorAddress(
                          `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`
                        );
                      }
                    }}
                    className="text-[11px] bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
                  >
                    <option value="">Load from address master...</option>
                    {activeVendor.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.type}: {a.addressLine1}, {a.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                rows={2}
                disabled={isEditLocked}
                value={customVendorAddress}
                onChange={(e) => setCustomVendorAddress(e.target.value)}
                placeholder="Enter or customize vendor plant / dispatch address..."
                className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Delivery Destination (Factory Stores)</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs h-[64px] flex items-center">
                Plot 14-B, SIDCO Industrial Estate, Ambattur, Chennai - 600058 (Tamil Nadu)
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table - Using Standard SELECT instead of Combobox */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procurement Items ({lineItems.length})
            </div>
            {!isEditLocked && (
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

          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-center rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-xs"
              >
                {/* Product Select - Standard SELECT Box */}
                <div className="col-span-4">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Product Master</label>
                  <select
                    disabled={isEditLocked}
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {approvedProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Locked HSN Code */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">HSN Code (Locked)</label>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-600 text-center">
                    {item.hsnCode}
                  </div>
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Qty ({item.uom})</label>
                  <input
                    type="number"
                    min="1"
                    disabled={isEditLocked}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-right text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Rate */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Rate (₹)</label>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-right text-slate-700">
                    ₹{item.unitPrice.toFixed(2)}
                  </div>
                </div>

                {/* GST Rate */}
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">GST %</label>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-center text-slate-700">
                    {item.taxRate}%
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1 flex items-center justify-end pt-4">
                  {!isEditLocked && lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercials Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Freight & Handling</div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shipping / Freight Charge (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isEditLocked}
                name="shippingCharge"
                value={formVals.shippingCharge}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Applicable 18% GST on inbound freight is auto-computed in the tax assessment ledger.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5 text-xs">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              Commercial Assessment (Statutory INR)
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal:</span>
              <span className="font-mono">₹{taxCalculation.subtotal.toFixed(2)}</span>
            </div>
            {taxCalculation.shippingCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Inbound Freight:</span>
                <span className="font-mono">₹{taxCalculation.shippingCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>Taxable Value:</span>
              <span className="font-mono">₹{taxCalculation.taxableAmount.toFixed(2)}</span>
            </div>
            {taxCalculation.cgstAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono">₹{taxCalculation.cgstAmount.toFixed(2)}</span>
              </div>
            )}
            {taxCalculation.sgstAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono">₹{taxCalculation.sgstAmount.toFixed(2)}</span>
              </div>
            )}
            {taxCalculation.igstAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>IGST:</span>
                <span className="font-mono">₹{taxCalculation.igstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Purchase Requisition Total:</span>
              <span className="font-mono text-blue-700">₹{taxCalculation.grandTotal.toFixed(2)}</span>
            </div>
            <div className="text-[11px] text-slate-400 italic text-right">
              {taxCalculation.totalInWords}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={navigateBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEditLocked}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
          >
            {isEditMode ? 'Update Purchase Order' : 'Authorize & Issue PO'}
          </button>
        </div>
      </form>

      {/* PDF Modal */}
      {isPdfModalOpen && createdPo && (
        <PdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => {
            setIsPdfModalOpen(false);
            navigateBack();
          }}
          title={`Purchase Order - ${createdPo.poNumber}`}
          fileName={`PO_${createdPo.poNumber}.pdf`}
          document={<PurchaseOrderPdfDocument po={createdPo} />}
        />
      )}
    </div>
  );
};
