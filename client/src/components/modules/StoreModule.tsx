import React, { useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Warehouse,
  History,
} from 'lucide-react';
import { useErpStore, StoreItem } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { usePermissions } from '../../hooks/usePermissions';

export const StoreModule: React.FC = () => {
  const { storeItems, updateStoreStock } = useErpStore();
  const { canEdit, canApprove } = usePermissions('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [stockAdjustItem, setStockAdjustItem] = useState<StoreItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Physical Stock Count Adjustment');

  const filteredItems = storeItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.binLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'All' || item.warehouse === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const warehouses = ['All', 'Chennai Central Depot', 'Coimbatore Fabrication Bay', 'Bengaluru Tech Logistics'];

  const handleApplyAdjustment = (direction: 'add' | 'remove') => {
    if (!stockAdjustItem) return;
    const delta = direction === 'add' ? adjustQty : -adjustQty;
    updateStoreStock(stockAdjustItem.productId, delta);
    setStockAdjustItem(null);
  };

  const columns: ColumnDef<StoreItem>[] = [
    {
      key: 'sku',
      header: 'SKU Code',
      sortable: true,
      render: (item) => <span className="font-mono font-bold text-blue-700">{item.sku}</span>,
    },
    {
      key: 'productName',
      header: 'Product Name',
      sortable: true,
      render: (item) => <span className="font-medium text-slate-900">{item.productName}</span>,
    },
    {
      key: 'warehouse',
      header: 'Warehouse Depot',
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 flex items-center gap-1.5">
          <Warehouse className="h-3.5 w-3.5 text-slate-400" />
          <span>{item.warehouse}</span>
        </span>
      ),
    },
    {
      key: 'binLocation',
      header: 'Bin / Location',
      sortable: true,
      render: (item) => <span className="font-mono text-slate-500">{item.binLocation}</span>,
    },
    {
      key: 'availableStock',
      header: 'Available Stock',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {item.availableStock}
        </span>
      ),
    },
    {
      key: 'minLevel',
      header: 'Min Reorder Level',
      sortable: true,
      align: 'right',
      render: (item) => <span className="font-mono text-slate-500">{item.minLevel}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            item.status === 'In Stock'
              ? 'badge-success'
              : item.status === 'Low Stock'
              ? 'badge-warning'
              : 'badge-error'
          }`}
        >
          {item.status === 'In Stock' && <CheckCircle2 className="h-3 w-3" />}
          {item.status === 'Low Stock' && <AlertTriangle className="h-3 w-3" />}
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (canEdit || canApprove) ? (
        <button
          onClick={() => setStockAdjustItem(item)}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
        >
          Adjust Stock
        </button>
      ) : (
        <span className="text-xs text-slate-400 font-medium">—</span>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All Items', value: 'ALL' },
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Low Stock', value: 'Low Stock' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Store & Stock Inventory</h2>
          <p className="text-xs text-slate-500">
            Real-time multi-warehouse stock levels, bin allocations, and low inventory reorder triggers
          </p>
        </div>
      </div>

      {/* Modern Smart ERP DataTable */}
      <DataTable
        data={storeItems}
        columns={columns}
        searchPlaceholder="Search by SKU, item name or bin location..."
        searchKeys={['sku', 'productName', 'warehouse', 'binLocation']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* Modal: Adjust Stock */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Stock Inventory Adjustment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {stockAdjustItem.productName} ({stockAdjustItem.sku})
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 font-mono">
                Current Available Stock: <span className="font-bold text-slate-900">{stockAdjustItem.availableStock}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setStockAdjustItem(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyAdjustment('remove')}
                className="flex items-center gap-1 rounded-lg bg-rose-600 px-3.5 py-1.5 font-semibold text-white hover:bg-rose-700 text-xs"
              >
                <ArrowDown className="h-3 w-3" />
                <span>Issue / Deduct</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyAdjustment('add')}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-semibold text-white hover:bg-emerald-700 text-xs"
              >
                <ArrowUp className="h-3 w-3" />
                <span>Receive / Add</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
