import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Barcode,
  X,
  Boxes,
} from 'lucide-react';
import { useErpStore, Product } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';

interface ProductsModuleProps {
  initialOpenAdd?: boolean;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ initialOpenAdd = false }) => {
  const { products, addProduct } = useErpStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsnCode, setHsnCode] = useState('84199090');
  const [category, setCategory] = useState('Titanium Anodes');
  const [uom, setUom] = useState('Nos');
  const [sellingPrice, setSellingPrice] = useState(15000);
  const [purchaseCost, setPurchaseCost] = useState(9500);
  const [currentStock, setCurrentStock] = useState(50);
  const [minReorderLevel, setMinReorderLevel] = useState(15);

  const categories = ['All', 'Titanium Anodes', 'Cathodic Protection', 'Raw Materials', 'Electronics & Control', 'Flanges & Fittings'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hsnCode.includes(searchQuery);
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      sku,
      name,
      hsnCode,
      category,
      uom,
      sellingPrice,
      purchaseCost,
      currentStock,
      minReorderLevel,
    });
    setIsAddModalOpen(false);
    setName('');
    setSku('');
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: (p) => <span className="font-mono font-bold text-blue-700">{p.sku}</span>,
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
      render: (p) => <span className="text-slate-500">{p.category}</span>,
    },
    {
      key: 'hsnCode',
      header: 'HSN Code',
      sortable: true,
      render: (p) => <span className="font-mono text-slate-500">{p.hsnCode}</span>,
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
      key: 'purchaseCost',
      header: 'Cost Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono text-slate-500">
          ₹{p.purchaseCost.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span
          className={`rounded px-1.5 py-0.5 font-mono font-bold ${
            p.currentStock <= p.minReorderLevel
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-800'
          }`}
        >
          {p.currentStock} {p.uom}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      sortable: true,
      align: 'right',
      render: (p) => {
        const marginPercent = ((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 100;
        return (
          <span className="font-mono text-emerald-600 font-semibold">
            +{marginPercent.toFixed(1)}%
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Product Item</span>
        </button>
      </div>

      {/* Modern Tiaano ERP DataTable */}
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
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TIA-ELC-309"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <Combobox
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={categories.filter((c) => c !== 'All').map((c) => ({
                      value: c,
                      label: c,
                    }))}
                    placeholder="Select category..."
                    searchable={true}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minReorderLevel}
                    onChange={(e) => setMinReorderLevel(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Save Item Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
