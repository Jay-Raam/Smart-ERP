import React, { useState } from 'react';
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
} from 'lucide-react';
import { useErpStore, PurchaseOrder } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';

interface PurchaseModuleProps {
  initialOpenAdd?: boolean;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ initialOpenAdd = false }) => {
  const { purchaseOrders, activeBranchId, addPurchaseOrder } = useErpStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [vendorName, setVendorName] = useState('Midhani Metallurgical Alloys Ltd');
  const [vendorGstin, setVendorGstin] = useState('36AAACM2091J1ZB');
  const [expectedDate, setExpectedDate] = useState('2026-10-15');
  const [totalAmount, setTotalAmount] = useState(250000);

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    addPurchaseOrder({
      vendorName,
      vendorGstin,
      poDate: new Date().toISOString().split('T')[0],
      expectedDate,
      branchId: activeBranchId,
      totalAmount,
      status: 'Approved',
    });
    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
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
      render: (po) => <span className="font-mono text-slate-500">{po.vendorGstin}</span>,
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
      header: 'Total Amount',
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
              ? 'badge-success'
              : po.status === 'Approved'
              ? 'badge-info'
              : 'badge-warning'
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
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
          title="View PO Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const statusOptions = [
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
          <h2 className="text-lg font-bold text-slate-900">Purchase Orders Master</h2>
          <p className="text-xs text-slate-500">
            Procurement requisitions, raw material sourcing, and vendor delivery schedules
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Modern Tiaano ERP DataTable */}
      <DataTable
        data={purchaseOrders}
        columns={columns}
        searchPlaceholder="Search by PO number or vendor..."
        searchKeys={['poNumber', 'vendorName', 'vendorGstin']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* Modal: Create Purchase Order */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Purchase Order</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  required
                  value={vendorGstin}
                  onChange={(e) => setVendorGstin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total PO Value (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
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
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
