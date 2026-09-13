import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Calendar,
  ChevronDown,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useErpStore, SalesOrder, SalesOrderItem } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';

interface SalesModuleProps {
  initialOpenAdd?: boolean;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ initialOpenAdd = false }) => {
  const { salesOrders, customers, products, activeBranchId, addSalesOrder } = useErpStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form State for New Sales Order
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [deliveryDate, setDeliveryDate] = useState('2026-10-15');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [orderQuantity, setOrderQuantity] = useState(5);

  const filteredOrders = salesOrders.filter((so) => {
    const matchesSearch =
      so.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || so.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    const product = products.find((p) => p.id === selectedProductId);
    if (!customer || !product) return;

    const lineTotal = product.sellingPrice * orderQuantity;
    const item: SalesOrderItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: orderQuantity,
      unitPrice: product.sellingPrice,
      total: lineTotal,
    };

    const subtotal = lineTotal;
    const taxAmount = subtotal * 0.18;
    const totalAmount = subtotal + taxAmount;

    addSalesOrder({
      customerId: customer.id,
      customerName: customer.name,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate,
      branchId: activeBranchId,
      items: [item],
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Confirmed',
    });

    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      key: 'orderNumber',
      header: 'Order No',
      sortable: true,
      render: (so) => <span className="font-mono font-bold text-blue-700">{so.orderNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (so) => <span className="font-medium text-slate-900">{so.customerName}</span>,
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      sortable: true,
      render: (so) => <span className="text-slate-500">{so.orderDate}</span>,
    },
    {
      key: 'deliveryDate',
      header: 'Target Delivery',
      sortable: true,
      render: (so) => <span className="text-slate-500">{so.deliveryDate}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      render: (so) => <span>{so.items.length} item(s)</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      sortable: true,
      align: 'right',
      render: (so) => <span className="font-mono">₹{so.subtotal.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total (Incl GST)',
      sortable: true,
      align: 'right',
      render: (so) => <span className="font-mono font-bold text-slate-900">₹{so.totalAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (so) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            so.status === 'Completed'
              ? 'badge-success'
              : so.status === 'In Production'
              ? 'badge-info'
              : 'badge-warning'
          }`}
        >
          {so.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (so) => (
        <button
          onClick={() => setSelectedOrder(so)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
          title="View Order Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'In Production', value: 'In Production' },
    { label: 'Dispatched', value: 'Dispatched' },
    { label: 'Completed', value: 'Completed' },
  ];

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales Orders Master</h2>
          <p className="text-xs text-slate-500">
            Manage customer quotations, work-in-progress production orders, and deliveries
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Modern Tiaano ERP DataTable */}
      <DataTable
        data={salesOrders}
        columns={columns}
        searchPlaceholder="Search by SO number or customer..."
        searchKeys={['orderNumber', 'customerName']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* Modal: Create Sales Order */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Sales Order</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer</label>
                <Combobox
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    sublabel: `${c.city}, ${c.state}`,
                  }))}
                  placeholder="Select customer..."
                  searchable={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product / Item Master</label>
                <Combobox
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={products.map((p) => ({
                    value: p.id,
                    label: p.name,
                    sublabel: `₹${p.sellingPrice.toLocaleString('en-IN')} / ${p.uom} • SKU: ${p.sku}`,
                  }))}
                  placeholder="Select product..."
                  searchable={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Target Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              {(() => {
                const p = products.find((x) => x.id === selectedProductId);
                const sub = (p?.sellingPrice || 0) * orderQuantity;
                const gst = sub * 0.18;
                return (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span>₹{sub.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST Tax (18%):</span>
                      <span>₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                      <span>Total Quotation:</span>
                      <span className="text-blue-600">₹{(sub + gst).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

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
                  Save & Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Sales Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">Customer: {selectedOrder.customerName}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 text-slate-600">
                <div><span className="font-semibold text-slate-800">Order Date:</span> {selectedOrder.orderDate}</div>
                <div><span className="font-semibold text-slate-800">Delivery Date:</span> {selectedOrder.deliveryDate}</div>
                <div><span className="font-semibold text-slate-800">Status:</span> {selectedOrder.status}</div>
              </div>

              <div className="mt-4 font-semibold text-slate-800">Item Breakdown:</div>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between p-3">
                    <div>
                      <div className="font-semibold text-slate-800">{it.productName}</div>
                      <div className="text-[11px] text-slate-400">{it.sku} · Qty: {it.quantity} @ ₹{it.unitPrice}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">₹{it.total.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-slate-50 p-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST (18%):</span>
                  <span>₹{selectedOrder.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Final Invoice Amount:</span>
                  <span className="text-blue-600">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
