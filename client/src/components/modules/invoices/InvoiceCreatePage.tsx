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
import { useErpStore, DocumentItem, Invoice } from '../../../store/erpStore';
import { Combobox } from '../../shared/Combobox';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../../utils/taxCalculation';
import { useFormValidation, isValidQuantity } from '../../../utils/validation';
import { InvoicePdfDocument } from '../../pdf/InvoicePdfDocument';
import { PdfPreviewModal } from '../../pdf/PdfPreviewModal';

interface InvoiceFormData {
  customerId: string;
  dueDate: string;
  shippingCharge: number;
}

export const InvoiceCreatePage: React.FC = () => {
  const {
    customers,
    products,
    addInvoice,
  } = useErpStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter approved products only
  const approvedProducts = useMemo(() => {
    return products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }, [products]);

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

  // Initialize first item
  useEffect(() => {
    if (lineItems.length === 0 && approvedProducts.length > 0) {
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
  }, [approvedProducts]);

  // Form Validation
  const {
    values: formVals,
    errors: formErrors,
    touched: formTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useFormValidation<InvoiceFormData>({
    initialValues: {
      customerId: selectedCustomerId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharge: 0,
    },
    validationSchema: {
      dueDate: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'Due Date is mandatory.',
        },
      ],
    },
  });

  // Selected customer master details
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  const customerState = activeCustomer?.billingState || activeCustomer?.state || 'Tamil Nadu';
  const customerGstin = activeCustomer?.gstin || '';
  const isTN = isStateTamilNadu(customerState, customerGstin);

  // Live tax calculations
  const taxCalculation = useMemo(() => {
    return calculateDocumentTaxes({
      items: lineItems,
      billingState: customerState,
      partyGstin: customerGstin,
      shippingCharge: Number(formVals.shippingCharge) || 0,
    });
  }, [lineItems, customerState, customerGstin, formVals.shippingCharge]);

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

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    }
  };

  const onFormSubmit = async (data: InvoiceFormData) => {
    if (!activeCustomer) return;

    // Validate quantities
    const hasInvalidQty = lineItems.some((item) => !isValidQuantity(item.quantity));
    if (hasInvalidQty) {
      alert('All line item quantities must be greater than 0.');
      return;
    }

    const invoice = await addInvoice({
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerGstin: activeCustomer.gstin || '',
      customerState: customerState,
      billingAddress: activeCustomer.billingAddress || activeCustomer.address || '',
      shippingAddress: activeCustomer.shippingAddress || activeCustomer.billingAddress || activeCustomer.address || '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      items: taxCalculation.items as DocumentItem[],
      subtotal: taxCalculation.subtotal,
      taxableAmount: taxCalculation.taxableAmount,
      totalDiscount: taxCalculation.totalDiscount,
      gstRate: lineItems[0]?.taxRate || 18,
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

    if (invoice) {
      setCreatedInvoice(invoice);
      setIsPdfModalOpen(true);
    }
  };

  const navigateBack = () => {
    window.history.pushState({}, '', '/invoices');
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
            title="Back to Invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Generate Direct Tax Invoice</h1>
            <p className="text-xs text-slate-500">
              GST compliant invoice generation, verified product catalog rates & automatic tax breakdown
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Customer Identification Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>Customer & Master Data Integration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Customer Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <Combobox
                value={selectedCustomerId}
                onChange={(val) => {
                  setSelectedCustomerId(val);
                  setFieldValue('customerId', val);
                }}
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: `GSTIN: ${c.gstin || 'None'} • ${c.billingState || c.state || 'Tamil Nadu'}`,
                }))}
                placeholder="Select customer..."
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
                name="dueDate"
                value={formVals.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Locked Customer GSTIN & Place of Supply */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1">GSTIN & State (Master Record)</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 text-xs">
                {customerGstin || 'Unregistered'} • {customerState}
              </div>
            </div>
          </div>

          {/* Locked Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Billed To Address (Locked from Master)</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                {activeCustomer?.billingAddress || activeCustomer?.address || 'Billing address on record'}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Shipped To Address (Destination)</label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                {activeCustomer?.shippingAddress || activeCustomer?.billingAddress || activeCustomer?.address || 'Shipping address on record'}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Invoice Line Items ({lineItems.length})
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
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
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-right outline-none focus:border-blue-500 text-slate-800"
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
                  {lineItems.length > 1 && (
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
            <span>Freight & Shipping Logistics (SAC 9965 @ 18% GST)</span>
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
                {customerState} ({isTN ? 'Intra-State: CGST + SGST Split' : 'Inter-State: Full IGST'})
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
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Issue Invoice</span>
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
          document={<InvoicePdfDocument invoice={createdInvoice} />}
        />
      )}
    </div>
  );
};
