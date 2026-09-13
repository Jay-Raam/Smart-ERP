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
} from 'lucide-react';
import { useErpStore, DocumentItem, Bill } from '../../../store/erpStore';
import { Combobox } from '../../shared/Combobox';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../../utils/taxCalculation';
import { useFormValidation, isValidQuantity } from '../../../utils/validation';
import { BillPdfDocument } from '../../pdf/BillPdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';
import { showAppToast } from '../../../utils/handleApiError';

interface BillFormData {
  vendorId: string;
  vendorInvoiceNumber: string;
  billDate: string;
  dueDate: string;
  shippingCharge: number;
}

export const BillCreatePage: React.FC = () => {
  const {
    vendors,
    purchaseOrders,
    products,
    bills,
    addBill,
    convertPoToBill,
  } = useErpStore();

  // Mode: PO Conversion or Direct Bill
  const [creationMode, setCreationMode] = useState<'po' | 'direct'>('direct');
  const [selectedPoId, setSelectedPoId] = useState<string>('');

  // Selected Vendor
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');

  // Line items state
  const [lineItems, setLineItems] = useState<Array<{
    productId: string;
    productName: string;
    hsnCode: string;
    quantity: number;
    orderedQuantity?: number;
    billedQuantity?: number;
    remainingQuantity?: number;
    unitPrice: number;
    uom: string;
    discountPercent: number;
    taxRate: number;
  }>>([]);

  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter approved and ACTIVE products only
  const approvedProducts = useMemo(() => {
    return products.filter(
      (p) => (p.approvalStatus || 'Approved') === 'Approved' && (p.status || 'ACTIVE') === 'ACTIVE'
    );
  }, [products]);

  // Read URL query params on mount (e.g. ?poId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poId = params.get('poId');
    if (poId) {
      setCreationMode('po');
      setSelectedPoId(poId);
    }
  }, []);

  // Approved POs available for conversion (exclude fully billed)
  const approvedPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (po.status === 'FULLY_BILLED' || po.status === 'Cancelled' || po.status === 'AUTO_REORDER_PENDING') {
        return false;
      }
      const hasRemaining = (po.items || []).some((item) => {
        const billed = item.billedQuantity ?? 0;
        const rem = item.remainingQuantity !== undefined ? item.remainingQuantity : item.quantity - billed;
        return rem > 0;
      });
      return hasRemaining || po.status === 'Approved' || po.status === 'PARTIALLY_BILLED';
    });
  }, [purchaseOrders]);

  // Form Validation
  const {
    values: formVals,
    errors: formErrors,
    touched: formTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useFormValidation<BillFormData>({
    initialValues: {
      vendorId: selectedVendorId,
      vendorInvoiceNumber: 'INV-VEN-' + Math.floor(1000 + Math.random() * 9000),
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharge: 0,
    },
    validationSchema: {
      vendorInvoiceNumber: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length >= 2),
          message: 'Vendor invoice/reference number is required.',
        },
      ],
      billDate: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'Bill Date is mandatory.',
        },
      ],
      dueDate: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'Due Date is mandatory.',
        },
      ],
    },
  });

  // Handle PO selection change in PO mode
  useEffect(() => {
    if (creationMode === 'po' && selectedPoId) {
      const po = purchaseOrders.find((p) => p.id === selectedPoId);
      if (po) {
        setSelectedVendorId(po.vendorId || '');
        setFieldValue('vendorId', po.vendorId || '');
        setFieldValue('shippingCharge', po.shippingCharge || 0);
        setLineItems(
          (po.items || [])
            .map((item) => {
              const billed = item.billedQuantity ?? 0;
              const remaining =
                item.remainingQuantity !== undefined
                  ? item.remainingQuantity
                  : Math.max(0, item.quantity - billed);
              return {
                productId: item.productId,
                productName: item.productName,
                hsnCode: item.hsnCode || '81089010',
                orderedQuantity: item.orderedQuantity ?? item.quantity,
                billedQuantity: billed,
                remainingQuantity: remaining,
                quantity: remaining,
                unitPrice: item.unitPrice,
                uom: item.uom || 'Nos',
                discountPercent: item.discountPercent || 0,
                taxRate: item.taxRate ?? 18,
              };
            })
            .filter((i) => (i.remainingQuantity ?? 0) > 0)
        );
      }
    }
  }, [creationMode, selectedPoId, purchaseOrders, setFieldValue]);

  // Handle Direct mode default line item
  useEffect(() => {
    if (creationMode === 'direct' && lineItems.length === 0 && approvedProducts.length > 0) {
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
  }, [creationMode, approvedProducts]);

  // Active vendor details
  const activeVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  }, [vendors, selectedVendorId]);

  const selectedPo = useMemo(() => {
    return creationMode === 'po' ? purchaseOrders.find((p) => p.id === selectedPoId) : null;
  }, [creationMode, selectedPoId, purchaseOrders]);

  const vendorState = activeVendor?.billingState || activeVendor?.state || 'Tamil Nadu';
  const vendorGstin = activeVendor?.gstin || '';
  const isTN = isStateTamilNadu(vendorState, vendorGstin);

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

  const onFormSubmit = async (data: BillFormData) => {
    if (!activeVendor) return;

    // Validate quantities
    const hasInvalidQty = lineItems.some((item) => !isValidQuantity(item.quantity));
    if (hasInvalidQty) {
      alert('All line item quantities must be greater than 0.');
      return;
    }

    if (creationMode === 'po' && selectedPoId) {
      const bill = await convertPoToBill(
        selectedPoId,
        data.vendorInvoiceNumber.trim(),
        data.billDate,
        data.dueDate
      );
      if (bill) {
        setCreatedBill(bill);
        setIsPdfModalOpen(true);
      }
    } else {
      const bill = await addBill({
        vendorId: activeVendor.id,
        vendorName: activeVendor.name,
        vendorGstin: activeVendor.gstin || '',
        vendorAddress: activeVendor.billingAddress || activeVendor.address || '',
        vendorState: activeVendor.billingState || activeVendor.state || 'Tamil Nadu',
        billDate: data.billDate,
        dueDate: data.dueDate,
        vendorInvoiceNumber: data.vendorInvoiceNumber.trim(),
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
        status: 'Pending',
      });
      if (bill) {
        setCreatedBill(bill);
        setIsPdfModalOpen(true);
      }
    }
  };

  const navigateBack = () => {
    window.history.pushState({}, '', '/bills');
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
            title="Back to Vendor Bills"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Record New Vendor Bill</h1>
            <p className="text-xs text-slate-500">
              Direct procurement entry or conversion from approved Purchase Order
            </p>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold self-start">
          <button
            type="button"
            onClick={() => setCreationMode('direct')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              creationMode === 'direct' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct Vendor Bill
          </button>
          <button
            type="button"
            onClick={() => {
              setCreationMode('po');
              if (approvedPOs.length > 0 && !selectedPoId) {
                setSelectedPoId(approvedPOs[0].id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              creationMode === 'po' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Convert From PO ({approvedPOs.length})
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Source PO Banner (if PO Mode) */}
        {creationMode === 'po' && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>Select Source Purchase Order to Convert</span>
            </div>

            {approvedPOs.length === 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                No Approved Purchase Orders available to convert. Switch to "Direct Vendor Bill" or approve a PO in Procurement first.
              </div>
            ) : (
              <div className="w-full">
                <Combobox
                  value={selectedPoId}
                  onChange={(val) => setSelectedPoId(val)}
                  options={approvedPOs.map((po) => ({
                    value: po.id,
                    label: `${po.poNumber} — ${po.vendorName}`,
                    sublabel: `PO Value: ₹${po.totalAmount.toLocaleString('en-IN')} • Date: ${po.poDate}`,
                  }))}
                  placeholder="Select approved PO..."
                  searchable={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Vendor & Bill Metadata Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>Vendor & Document Identification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Vendor Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Supplier <span className="text-red-500">*</span>
              </label>
              <Combobox
                value={selectedVendorId}
                onChange={(val) => {
                  setSelectedVendorId(val);
                  setFieldValue('vendorId', val);
                }}
                disabled={creationMode === 'po'}
                options={vendors.map((v) => ({
                  value: v.id,
                  label: v.name,
                  sublabel: `GST: ${v.gstin || 'None'} • ${v.billingState || v.state || 'Tamil Nadu'}`,
                }))}
                placeholder="Select vendor..."
                searchable={true}
              />
            </div>

            {/* Vendor Invoice / Ref Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor Bill Ref / Inv No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vendorInvoiceNumber"
                value={formVals.vendorInvoiceNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. INV-2026-981"
                className={`w-full rounded-xl border p-2.5 outline-none font-mono text-slate-800 ${
                  formErrors.vendorInvoiceNumber ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.vendorInvoiceNumber && (
                <p className="mt-1 text-[11px] text-red-600">{formErrors.vendorInvoiceNumber}</p>
              )}
            </div>

            {/* Bill Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bill Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="billDate"
                value={formVals.billDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Due Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formVals.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Locked Vendor GSTIN & State */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1">GSTIN & State (Master Record)</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 text-xs">
                {vendorGstin || 'Unregistered'} • {vendorState}
              </div>
            </div>

            {/* Locked Plant Address */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Vendor Plant / Dispatch Address</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs truncate">
                {activeVendor?.billingAddress || activeVendor?.address || 'Address on record'}
              </div>
            </div>
          </div>
        </div>

        {/* Advance Payment Banner */}
        {creationMode === 'po' && selectedPo && (selectedPo.paidAmount || 0) > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-medium">
              <DollarSign className="h-5 w-5 text-indigo-600 shrink-0" />
              <span>
                <strong>Vendor Advance Available on PO:</strong> ₹{(selectedPo.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold bg-white/80 border border-indigo-200 px-2.5 py-1 rounded-lg">
              Will be automatically adjusted against this Bill
            </span>
          </div>
        )}

        {/* Line Items Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procured Materials & Billed Items ({lineItems.length})
            </div>
            {creationMode === 'direct' && (
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
                {/* Product Select */}
                <div className="col-span-4">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Product Master</label>
                  {creationMode === 'po' ? (
                    <div className="p-2 rounded-lg bg-white border border-slate-200 font-medium text-slate-800">
                      {item.productName}
                    </div>
                  ) : (
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none focus:border-blue-500 text-slate-800 font-medium"
                    >
                      {approvedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  )}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-slate-500 font-medium">Qty ({item.uom})</label>
                    {creationMode === 'po' && item.remainingQuantity !== undefined && (
                      <span className="text-[9px] font-mono text-blue-600 font-bold">
                        Rem: {item.remainingQuantity}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={creationMode === 'po' && item.remainingQuantity !== undefined ? item.remainingQuantity : undefined}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (creationMode === 'po' && item.remainingQuantity !== undefined && val > item.remainingQuantity) {
                        showAppToast(`Quantity cannot exceed remaining PO quantity of ${item.remainingQuantity}`, 'warning');
                        return;
                      }
                      handleQuantityChange(idx, e.target.value);
                    }}
                    className={`w-full rounded-lg border bg-white p-2 font-mono text-right outline-none text-slate-800 ${
                      creationMode === 'po' && item.remainingQuantity !== undefined && item.quantity > item.remainingQuantity
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {creationMode === 'po' && (
                    <div className="text-[9px] text-slate-400 mt-0.5 text-right font-mono">
                      Ord: {item.orderedQuantity ?? item.quantity} &bull; Billed: {item.billedQuantity ?? 0}
                    </div>
                  )}
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
                  {creationMode === 'direct' && lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
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

        {/* Shipping & Freight Charges (SAC 9965 @ 18%) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-blue-600" />
            <span>Freight / Logistics Charges (SAC 9965 @ 18% GST)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Freight Amount (INR)</label>
              <input
                type="number"
                min="0"
                step="any"
                name="shippingCharge"
                value={formVals.shippingCharge}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-slate-800 outline-none focus:border-blue-500"
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

        {/* Summary & Totals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Place of Supply</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {vendorState} ({isTN ? 'Intra-State: CGST + SGST Split' : 'Inter-State: Full IGST'})
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-semibold">Grand Total Payable</span>
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
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Record Bill</span>
            </button>
          </div>
        </div>
      </form>

      {/* Vector PDF Modal */}
      {createdBill && (
        <PdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => {
            setIsPdfModalOpen(false);
            navigateBack();
          }}
          title={`Vendor Bill #${createdBill.billNumber}`}
          fileName={`Bill_${createdBill.billNumber}.pdf`}
          document={<BillPdfDocument bill={createdBill} />}
        />
      )}
    </div>
  );
};
