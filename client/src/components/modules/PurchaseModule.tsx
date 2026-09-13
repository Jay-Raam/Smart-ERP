import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Eye,
  Trash2,
  Truck,
  Users,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { useErpStore, PurchaseOrder, Vendor, DocumentItem } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';
import { PurchasePrintModal } from './PurchasePrintModal';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../utils/taxCalculation';

interface PurchaseModuleProps {
  initialOpenAdd?: boolean;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ initialOpenAdd = false }) => {
  const {
    purchaseOrders,
    vendors,
    products,
    activeBranchId,
    addPurchaseOrder,
    addVendor,
  } = useErpStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'vendors'>('orders');
  const [isAddPOModalOpen, setIsAddPOModalOpen] = useState(initialOpenAdd);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Filter ONLY Approved products for Purchase Order item selection
  const approvedProducts = useMemo(() => {
    return products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }, [products]);

  // Form State: PO Creation
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [vendorName, setVendorName] = useState(vendors[0]?.name || '');
  const [vendorGstin, setVendorGstin] = useState(vendors[0]?.gstin || '');
  const [vendorAddress, setVendorAddress] = useState(vendors[0]?.address || '');
  const [vendorState, setVendorState] = useState(vendors[0]?.state || 'Telangana');
  const [expectedDate, setExpectedDate] = useState('2026-10-15');

  // Form State: Line items
  const [poLineItems, setPoLineItems] = useState<Array<{
    productId: string;
    productName: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    uom: string;
    discountPercent: number;
    taxRate: number;
  }>>([]);

  // Form State: New Vendor Modal
  const [vName, setVName] = useState('');
  const [vContactPerson, setVContactPerson] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vCity, setVCity] = useState('Chennai');
  const [vState, setVState] = useState('Tamil Nadu');
  const [vGstin, setVGstin] = useState('');
  const [vPan, setVPan] = useState('');

  // Update vendor info when selected vendor changes
  useEffect(() => {
    const v = vendors.find((vend) => vend.id === selectedVendorId);
    if (v) {
      setVendorName(v.name);
      setVendorGstin(v.gstin || '');
      setVendorAddress(v.address || '');
      setVendorState(v.state || 'Tamil Nadu');
    }
  }, [selectedVendorId, vendors]);

  // Initialize first line item if empty and approved products available
  useEffect(() => {
    if (poLineItems.length === 0 && approvedProducts.length > 0) {
      const p = approvedProducts[0];
      setPoLineItems([
        {
          productId: p.id,
          productName: p.name,
          hsnCode: p.hsnCode || '81089010',
          quantity: 10,
          unitPrice: p.purchaseCost || 3000,
          uom: p.uom || 'Nos',
          discountPercent: 0,
          taxRate: p.taxRate ?? 18,
        },
      ]);
    }
  }, [approvedProducts]);

  const isTN = isStateTamilNadu(vendorState, vendorGstin);

  // Live tax calculations for PO
  const taxCalculation = useMemo(() => {
    return calculateDocumentTaxes({
      items: poLineItems,
      billingState: vendorState,
      partyGstin: vendorGstin,
    });
  }, [poLineItems, vendorState, vendorGstin]);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    addPurchaseOrder({
      vendorId: selectedVendorId,
      vendorName,
      vendorGstin,
      vendorAddress,
      vendorState,
      poDate: new Date().toISOString().split('T')[0],
      expectedDate,
      branchId: activeBranchId,
      items: taxCalculation.items as DocumentItem[],
      subtotal: taxCalculation.subtotal,
      taxableAmount: taxCalculation.taxableAmount,
      totalDiscount: taxCalculation.totalDiscount,
      cgstAmount: taxCalculation.cgstAmount,
      sgstAmount: taxCalculation.sgstAmount,
      igstAmount: taxCalculation.igstAmount,
      taxAmount: taxCalculation.totalTax,
      totalAmount: taxCalculation.grandTotal,
      totalInWords: taxCalculation.totalInWords,
      status: 'Approved',
    });
    setIsAddPOModalOpen(false);
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    addVendor({
      name: vName,
      contactPerson: vContactPerson,
      email: vEmail,
      phone: vPhone,
      address: vAddress,
      city: vCity,
      state: vState,
      gstin: vGstin,
      pan: vPan,
    });
    setIsAddVendorModalOpen(false);
    setVName('');
    setVContactPerson('');
    setVEmail('');
    setVPhone('');
    setVAddress('');
    setVGstin('');
  };

  const poColumns: ColumnDef<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      sortable: true,
      render: (po) => <span className="font-mono font-bold text-blue-700">{po.poNumber}</span>,
    },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: true,
      render: (po) => <span className="font-medium text-slate-900">{po.vendorName}</span>,
    },
    {
      key: 'vendorGstin',
      header: 'Vendor GSTIN',
      sortable: true,
      render: (po) => <span className="font-mono text-slate-500">{po.vendorGstin || '—'}</span>,
    },
    {
      key: 'poDate',
      header: 'PO Date',
      sortable: true,
      render: (po) => <span className="text-slate-500">{po.poDate}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Expected Delivery',
      sortable: true,
      render: (po) => <span className="text-slate-500">{po.expectedDate}</span>,
    },
    {
      key: 'totalAmount',
      header: 'PO Total Value',
      sortable: true,
      align: 'right',
      render: (po) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{po.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (po) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            po.status === 'Received'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : po.status === 'Approved'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {po.status === 'Received' && <CheckCircle2 className="h-3 w-3" />}
          {po.status === 'Pending Approval' && <Clock className="h-3 w-3" />}
          {po.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (po) => (
        <button
          onClick={() => setSelectedPO(po)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
          title="View & Print PO"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  const vendorColumns: ColumnDef<Vendor>[] = [
    {
      key: 'code',
      header: 'Vendor Code',
      sortable: true,
      render: (v) => <span className="font-mono font-bold text-blue-700">{v.code}</span>,
    },
    {
      key: 'name',
      header: 'Vendor Name',
      sortable: true,
      render: (v) => <span className="font-bold text-slate-900">{v.name}</span>,
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      sortable: true,
      render: (v) => <span className="text-slate-700">{v.contactPerson || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Phone / Email',
      render: (v) => (
        <div className="text-xs">
          <div className="text-slate-800">{v.email || '—'}</div>
          <div className="text-slate-400 font-mono text-[11px]">{v.phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'State & City',
      sortable: true,
      render: (v) => (
        <span className="text-slate-600 flex items-center gap-1">
          <MapPin className="h-3 w-3 text-slate-400" />
          <span>{v.city || '—'}, {v.state || 'Tamil Nadu'}</span>
        </span>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      sortable: true,
      render: (v) => <span className="font-mono text-slate-600">{v.gstin || '—'}</span>,
    },
  ];

  const poStatusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Received', value: 'Received' },
  ];

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Procurement & Vendor Master</h2>
          <p className="text-xs text-slate-500">
            Requisitions, approved catalog sourcing, vendor directory, and Purchase Order PDF generation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'vendors' ? (
            <button
              onClick={() => setIsAddVendorModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register Vendor</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddPOModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition cursor-pointer ${
            activeTab === 'vendors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Vendor Directory ({vendors.length})</span>
        </button>
      </div>

      {/* Tab 1: Purchase Orders DataTable */}
      {activeTab === 'orders' && (
        <DataTable
          data={purchaseOrders}
          columns={poColumns}
          searchPlaceholder="Search by PO number or vendor..."
          searchKeys={['poNumber', 'vendorName', 'vendorGstin']}
          statusOptions={poStatusOptions}
          statusKey="status"
          pageSizeDefault={10}
        />
      )}

      {/* Tab 2: Vendor Directory DataTable */}
      {activeTab === 'vendors' && (
        <DataTable
          data={vendors}
          columns={vendorColumns}
          searchPlaceholder="Search vendor name, code, contact or GSTIN..."
          searchKeys={['name', 'code', 'contactPerson', 'gstin', 'city']}
          pageSizeDefault={10}
        />
      )}

      {/* Printable PO Modal */}
      {selectedPO && (
        <PurchasePrintModal
          purchaseOrder={selectedPO}
          onClose={() => setSelectedPO(null)}
        />
      )}

      {/* Modal: Create Purchase Order with Approved Products & Live GST */}
      {isAddPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Purchase Order</h3>
                <p className="text-xs text-slate-500">
                  Select supplier and approved items to generate a compliant PO with automated state-based GST calculations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPOModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 mt-4 text-xs">
              {/* Vendor & Delivery Date Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Registered Vendor</label>
                  <Combobox
                    value={selectedVendorId}
                    onChange={(val) => setSelectedVendorId(val)}
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: v.name,
                      sublabel: `GSTIN: ${v.gstin} • ${v.city}, ${v.state}`,
                    }))}
                    placeholder="Select vendor..."
                    searchable={true}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Vendor Address & Tax Breakdown Summary */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Vendor Dispatch Address & Tax Status</label>
                  <span className="font-mono text-[10px] text-blue-700 font-semibold">{vendorGstin || 'No GSTIN'}</span>
                </div>
                <p className="text-slate-600 text-xs">{vendorAddress || 'No address registered'}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Vendor State: <strong className="text-slate-800">{vendorState}</strong></span>
                  <span className={`font-semibold ${isTN ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {isTN ? 'Intra-State: CGST (50%) + SGST (50%)' : 'Inter-State: IGST (100%)'}
                  </span>
                </div>
              </div>

              {/* Approved Line Items Editor */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Procurement Items (Approved Catalog Only)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (approvedProducts.length > 0) {
                        const p = approvedProducts[0];
                        setPoLineItems([
                          ...poLineItems,
                          {
                            productId: p.id,
                            productName: p.name,
                            hsnCode: p.hsnCode || '81089010',
                            quantity: 1,
                            unitPrice: p.purchaseCost || 5000,
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
                  {poLineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      {/* Approved Product Selector */}
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Approved Item</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const p = approvedProducts.find((prod) => prod.id === e.target.value);
                            if (p) {
                              const updated = [...poLineItems];
                              updated[idx] = {
                                ...updated[idx],
                                productId: p.id,
                                productName: p.name,
                                hsnCode: p.hsnCode || '81089010',
                                unitPrice: p.purchaseCost || p.sellingPrice,
                                uom: p.uom || 'Nos',
                                taxRate: p.taxRate ?? 18,
                              };
                              setPoLineItems(updated);
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
                            const updated = [...poLineItems];
                            updated[idx].hsnCode = e.target.value;
                            setPoLineItems(updated);
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
                            const updated = [...poLineItems];
                            updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                            setPoLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...poLineItems];
                            updated[idx].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
                            setPoLineItems(updated);
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
                            const updated = [...poLineItems];
                            updated[idx].taxRate = Math.max(0, parseFloat(e.target.value) || 0);
                            setPoLineItems(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Line Subtotal & Remove */}
                      <div className="col-span-2 flex items-center justify-between pl-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Subtotal</label>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {poLineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPoLineItems(poLineItems.filter((_, i) => i !== idx));
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

              {/* Real-time Taxes Box */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                  <span className="font-bold text-slate-900">GST Jurisdiction Breakdown:</span>
                  <span className="font-semibold text-blue-800">
                    {isTN ? 'Intra-State: Tamil Nadu -> CGST (50%) + SGST (50%)' : `Inter-State: ${vendorState} -> IGST (100%)`}
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
                    <span className="text-slate-500 block">Total PO Value:</span>
                    <span className="font-bold text-blue-700 text-sm">₹{taxCalculation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-1.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-600">Amount in Words: </span>
                  <span className="font-bold text-slate-900">{taxCalculation.totalInWords}</span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddPOModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register New Vendor */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Vendor</h3>
              <button onClick={() => setIsAddVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor / Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midhani Metallurgical Alloys Ltd"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Key Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kulkarni"
                    value={vContactPerson}
                    onChange={(e) => setVContactPerson(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    required
                    placeholder="36AAACM1234P1Z1"
                    value={vGstin}
                    onChange={(e) => setVGstin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sales@vendor.com"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 40 2434 0001"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={vCity}
                    onChange={(e) => setVCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={vState}
                    onChange={(e) => setVState(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plant / Dispatch Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. PO Kanchanbagh, Hyderabad - 500058"
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddVendorModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
