import React, { useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  Warehouse,
  History,
  Calendar,
  Layers,
  FileText,
  Building2,
  Clock,
  X,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useErpStore, StoreItem } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { usePermissions } from '../../hooks/usePermissions';
import { showAppToast } from '../../utils/handleApiError';

export const StoreModule: React.FC = () => {
  const { storeItems, issueStoreStock } = useErpStore();
  const { canEdit, canApprove } = usePermissions('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  // Stock Adjustment State (Issue / Deduct ONLY)
  const [stockAdjustItem, setStockAdjustItem] = useState<StoreItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Quality Rejection');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Stock Lineage / Provenance Modal State
  const [selectedStockForLineage, setSelectedStockForLineage] = useState<StoreItem | null>(null);

  const handleApplyDeduction = async () => {
    if (!stockAdjustItem) return;
    if (adjustQty <= 0) {
      showAppToast('Deduction quantity must be greater than 0', 'warning');
      return;
    }
    if (adjustQty > stockAdjustItem.availableStock) {
      showAppToast(`Cannot deduct more than current stock (${stockAdjustItem.availableStock})`, 'error');
      return;
    }

    try {
      setIsSubmittingAdjust(true);
      await issueStoreStock({
        storeItemId: stockAdjustItem.id,
        quantity: adjustQty,
        reason: adjustReason,
        remarks: adjustRemarks.trim() || undefined,
      });
      setStockAdjustItem(null);
      setAdjustRemarks('');
    } catch (err: any) {
      // Toast shown by store
    } finally {
      setIsSubmittingAdjust(false);
    }
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
      render: (item) => (
        <div>
          <span className="font-medium text-slate-900 block">{item.productName}</span>
          {item.batchNumber && (
            <span className="font-mono text-[10px] text-slate-400">Batch: {item.batchNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      render: (item) => {
        if (!item.expiryDate) {
          return <span className="text-slate-400 font-mono text-[11px]">No Expiry</span>;
        }
        const expDate = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isExpired = expDate <= today;
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded ${
              isExpired
                ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                : 'text-slate-700 bg-slate-50 border border-slate-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {item.expiryDate}
            {isExpired && <span className="text-[10px] uppercase font-bold text-rose-700 ml-1">(Expired)</span>}
          </span>
        );
      },
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setStockAdjustItem(item);
              setAdjustQty(1);
              setAdjustReason('Quality Rejection');
              setAdjustRemarks('');
            }}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition cursor-pointer"
            title="Deduct Stock & Post Scrap Record"
          >
            Issue / Deduct
          </button>
        </div>
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
            Real-time multi-warehouse stock levels, batch traceability, expiry tracking, and lineage records. Click any row to view stock provenance.
          </p>
        </div>
      </div>

      {/* Modern Smart ERP DataTable with Red Expiry Row Highlight & Click to Lineage */}
      <DataTable
        data={storeItems}
        columns={columns}
        searchPlaceholder="Search by SKU, item name or bin location..."
        searchKeys={['sku', 'productName', 'warehouse', 'binLocation', 'batchNumber', 'sourceBillNumber', 'sourceVendorName']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
        onRowClick={(item) => setSelectedStockForLineage(item)}
        getRowClassName={(item) => {
          if (item.expiryDate) {
            const expDate = new Date(item.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expDate <= today) {
              return 'bg-rose-50/80 hover:bg-rose-100/90 border-l-4 border-l-rose-500 text-rose-950 font-medium';
            }
          }
          return 'hover:bg-blue-50/40';
        }}
      />

      {/* Modal: Stock Lineage & Provenance */}
      {selectedStockForLineage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Stock Lineage & Inward Source</h3>
              </div>
              <button
                onClick={() => setSelectedStockForLineage(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Material Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedStockForLineage.productName}</h4>
                    <span className="font-mono text-blue-700 text-xs">{selectedStockForLineage.sku}</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-900">
                    {selectedStockForLineage.availableStock} <span className="text-xs text-slate-500 font-normal">Units</span>
                  </span>
                </div>
              </div>

              {/* Provenance Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-purple-600" />
                    Inward Vendor Bill #
                  </span>
                  <p className="font-mono font-bold text-purple-700 text-xs">
                    {selectedStockForLineage.sourceBillNumber || 'Direct Opening Stock'}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-blue-600" />
                    Source Purchase Order #
                  </span>
                  <p className="font-mono font-bold text-blue-700 text-xs">
                    {selectedStockForLineage.sourcePoNumber || 'Direct Inward'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    Sourcing Vendor
                  </span>
                  <p className="font-semibold text-slate-800 text-xs">
                    {selectedStockForLineage.sourceVendorName || 'Procurement Depot'}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-600" />
                    Batch / Lot Number
                  </span>
                  <p className="font-mono font-bold text-amber-700 text-xs">
                    {selectedStockForLineage.batchNumber || 'BATCH-STD'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-500" />
                    Shelf Life Expiry Date
                  </span>
                  <p className="font-mono font-semibold text-slate-800 text-xs">
                    {selectedStockForLineage.expiryDate || 'No Expiry Tracked'}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-indigo-600" />
                    Location & Depot
                  </span>
                  <p className="font-medium text-slate-800 text-xs">
                    {selectedStockForLineage.warehouse} ({selectedStockForLineage.binLocation})
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last Physical Stock Audit:
                </span>
                <span className="font-mono font-medium text-slate-700">{selectedStockForLineage.lastAudited || 'Recent'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setSelectedStockForLineage(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close Provenance View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock (ONLY Red Issue / Deduct Button) */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Stock Inventory Deduction</h3>
              </div>
              <button
                onClick={() => setStockAdjustItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {stockAdjustItem.productName} ({stockAdjustItem.sku})
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 font-mono border border-slate-200">
                Current Available Stock: <span className="font-bold text-slate-900">{stockAdjustItem.availableStock}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deduction Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={stockAdjustItem.availableStock}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-rose-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deduction / Scrap Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-rose-500 bg-white"
                >
                  <option value="Quality Rejection">Quality Rejection (QC Failed)</option>
                  <option value="Scrap / Breakage">Scrap / Breakage in Store</option>
                  <option value="Expired Stock Disposal">Expired Shelf-Life Disposal</option>
                  <option value="Internal Production Issue">Internal Production Issuance</option>
                  <option value="Physical Stock Audit Shortage">Physical Stock Audit Shortage</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Auditor Reference</label>
                <input
                  type="text"
                  placeholder="Optional audit voucher or scrap ticket ref..."
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* ONLY RED ISSUE / DEDUCT BUTTON AS REQUESTED */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setStockAdjustItem(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAdjust}
                onClick={handleApplyDeduction}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50 text-xs transition shadow-sm cursor-pointer"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span>{isSubmittingAdjust ? 'Deducting...' : 'Issue / Deduct'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
