import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Barcode,
  X,
  Boxes,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useErpStore, Product } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';
import { ExportModal, ExportColumn } from '../shared/ExportModal';

interface ProductsModuleProps {
  initialOpenAdd?: boolean;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ initialOpenAdd = false }) => {
  const { products, addProduct, approveProduct, rejectProduct, updateProductStatus } = useErpStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportColumns: ExportColumn<Product>[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'hsnCode', label: 'HSN / SAC Code' },
    { key: 'uom', label: 'UOM' },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'purchaseCost',
      label: 'Purchase Cost',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    { key: 'currentStock', label: 'Current Stock' },
    {
      key: 'taxRate',
      label: 'GST Rate',
      transform: (v) => `${v ?? 18}%`,
    },
    { key: 'approvalStatus', label: 'Approval Status' },
  ];

  // Form State
  const [name, setName] = useState('');
  const [skuHsn, setSkuHsn] = useState('');
  const [category, setCategory] = useState('');
  const [uom, setUom] = useState('Nos');
  const [sellingPrice, setSellingPrice] = useState(15000);
  const [taxRate, setTaxRate] = useState(18);
  const [minReorderLevel, setMinReorderLevel] = useState(15);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse SKU / HSN Code
    let skuVal = skuHsn.trim();
    let hsnVal = '84199090';

    if (skuHsn.includes('/')) {
      const parts = skuHsn.split('/').map((s) => s.trim());
      skuVal = parts[0] || skuHsn.trim();
      hsnVal = parts[1] || '84199090';
    } else if (skuHsn.includes(' - ')) {
      const parts = skuHsn.split(' - ').map((s) => s.trim());
      skuVal = parts[0] || skuHsn.trim();
      hsnVal = parts[1] || '84199090';
    } else if (/^\d{6,8}$/.test(skuHsn.trim())) {
      // If user typed only an 8-digit HSN code
      hsnVal = skuHsn.trim();
      skuVal = `SKU-${hsnVal}`;
    }

    addProduct({
      sku: skuVal,
      name,
      hsnCode: hsnVal,
      category: category.trim() || 'General',
      uom,
      sellingPrice,
      purchaseCost: 0,
      currentStock: 0,
      minReorderLevel,
      taxRate: Number(taxRate) || 18,
      approvalStatus: 'Pending',
    });

    setIsAddModalOpen(false);
    setName('');
    setSkuHsn('');
    setCategory('');
    setSellingPrice(15000);
    setTaxRate(18);
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'sku',
      header: 'SKU / HSN Code',
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-blue-700">{p.sku}</span>
          <span className="text-[10px] text-slate-400 font-mono">HSN: {p.hsnCode || '—'}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Item Name',
      sortable: true,
      render: (p) => <span className="font-medium text-slate-900">{p.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
          {p.category}
        </span>
      ),
    },
    {
      key: 'taxRate',
      header: 'Tax Rate',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-semibold text-slate-700">
          {p.taxRate ?? 18}% GST
        </span>
      ),
    },
    {
      key: 'uom',
      header: 'UOM',
      render: (p) => <span className="font-medium text-slate-600">{p.uom}</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{p.sellingPrice.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Status',
      sortable: true,
      render: (p) => {
        const status = p.approvalStatus || 'Approved';
        if (status === 'Approved') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Approved
            </span>
          );
        }
        if (status === 'Pending') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Rejected
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Active State',
      sortable: true,
      align: 'center',
      render: (p) => {
        const isActive = (p.status || 'ACTIVE') === 'ACTIVE';
        return (
          <button
            type="button"
            onClick={async () => {
              const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
              await updateProductStatus(p.id, newStatus);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
            }`}
            title={`Click to switch to ${isActive ? 'INACTIVE' : 'ACTIVE'}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: 'SuperAdmin Actions',
      align: 'right',
      render: (p) => {
        const status = p.approvalStatus || 'Approved';
        if (!isSuperAdmin) {
          return <span className="text-xs text-slate-400">Restricted</span>;
        }

        if (status === 'Pending') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => approveProduct(p.id)}
                title="Approve Product"
                className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => rejectProduct(p.id)}
                title="Reject Product"
                className="flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            </div>
          );
        }

        return (
          <span className="text-xs font-medium text-slate-500">
            {status === 'Approved' ? 'Verified' : 'Declined'}
          </span>
        );
      },
    },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Titanium Anodes', value: 'Titanium Anodes' },
    { label: 'Cathodic Protection', value: 'Cathodic Protection' },
    { label: 'Raw Materials', value: 'Raw Materials' },
    { label: 'Electronics & Control', value: 'Electronics & Control' },
    { label: 'Flanges & Fittings', value: 'Flanges & Fittings' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Products & Items Master</h2>
          <p className="text-xs text-slate-500">
            Catalog of manufactured titanium components, assemblies, raw materials, and HSN codes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Product Item</span>
          </button>
        </div>
      </div>

      {/* Modern Smart ERP DataTable */}
      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search product name, SKU or HSN..."
        searchKeys={['name', 'sku', 'hsnCode', 'category']}
        statusOptions={categoryOptions}
        statusKey="category"
        pageSizeDefault={10}
      />

      {/* Modal: Add Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Master Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixed Metal Oxide Coated Titanium Mesh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SKU / HSN Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMART-MMO-101 / 84199090"
                  value={skuHsn}
                  onChange={(e) => setSkuHsn(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono text-slate-800 uppercase"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Format as <span className="font-mono font-medium">SKU / HSN</span> or enter your SKU code
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titanium Anodes"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Tax (GST %)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      placeholder="18"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono text-slate-800 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UOM)</label>
                  <Combobox
                    value={uom}
                    onChange={(val) => setUom(val)}
                    options={[
                      { value: 'Nos', label: 'Nos (Number)' },
                      { value: 'Kg', label: 'Kg (Kilograms)' },
                      { value: 'Mtr', label: 'Mtr (Meters)' },
                      { value: 'Box', label: 'Box (Set)' },
                    ]}
                    placeholder="Select UOM..."
                    searchable={false}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Reorder Level</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minReorderLevel}
                  onChange={(e) => setMinReorderLevel(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono text-slate-800"
                />
              </div>

              <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 flex items-start gap-2 text-[11px] text-blue-800">
                <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  New products are submitted with <span className="font-semibold">Pending</span> status. Only Super Admins can approve items for inclusion in Invoices and POs.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  Submit For Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Export Modal */}
      <ExportModal<Product>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Products Catalog Master"
        filenamePrefix="Products-Master"
        columns={exportColumns}
        data={products}
        dateField="createdAt"
        statusField="approvalStatus"
        statusOptions={[
          { label: 'Approved', value: 'Approved' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Rejected', value: 'Rejected' },
        ]}
      />
    </div>
  );
};
