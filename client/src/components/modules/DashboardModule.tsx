import React from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Boxes,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';

interface DashboardProps {
  onNavigate: (module: any) => void;
}

export const DashboardModule: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { salesOrders, invoices, purchaseOrders, storeItems, customers, branches, activeBranchId, activeFinancialYear } = useErpStore();

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalSalesBooked = salesOrders.reduce((acc, so) => acc + so.totalAmount, 0);
  const totalPurchaseSpend = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);
  const lowStockItems = storeItems.filter((i) => i.status === 'Low Stock' || i.status === 'Critical');

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || {
    id: 'hq',
    code: 'HQ',
    name: 'All Operating Branches',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Branch Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Smart Enterprise ERP — Operational Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational dashboard for <span className="font-semibold text-blue-700">{activeBranch.name}</span> ({activeBranch.code})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            Financial Year: {activeFinancialYear || '2026-2027'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Sales Booked */}
        <div className="erp-card p-5 transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('sales')}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Orders</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{totalSalesBooked.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{salesOrders.length} Confirmed Orders</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Invoiced */}
        <div className="erp-card p-5 transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('invoices')}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tax Invoices (GST)</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{totalInvoiced.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span>{invoices.filter((i) => i.status === 'Paid').length} Paid · {invoices.filter((i) => i.status === 'Pending').length} Pending</span>
            </div>
          </div>
        </div>

        {/* Card 3: Purchase Spend */}
        <div className="erp-card p-5 transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('purchase')}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Purchase Orders</span>
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{totalPurchaseSpend.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span>{purchaseOrders.length} Vendor Purchase Orders</span>
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="erp-card p-5 transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('store')}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Health</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {lowStockItems.length} Low Stock
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <span>{storeItems.length} Total SKUs in Warehouse</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900">
                Low Inventory Reorder Notice
              </div>
              <div className="text-xs text-amber-700">
                {lowStockItems[0].productName} ({lowStockItems[0].sku}) has only{' '}
                <span className="font-bold">{lowStockItems[0].availableStock} units</span> remaining (Min Reorder Level: {lowStockItems[0].minLevel}).
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('purchase')}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition"
          >
            Create Purchase Requisition
          </button>
        </div>
      )}

      {/* Two Column Section: Recent Sales Orders & Outstanding Invoices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Sales Orders */}
        <div className="erp-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Recent Sales Orders</h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All Orders →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {salesOrders.slice(0, 4).map((so) => (
              <div key={so.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700">{so.orderNumber}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        so.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : so.status === 'In Production'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {so.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 mt-1">{so.customerName}</div>
                  <div className="text-[11px] text-slate-400">Order Date: {so.orderDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">₹{so.totalAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500">{so.items.length} Item(s)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices Status Breakdown */}
        <div className="erp-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Tax Invoices (GST 18%)</h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Manage Invoices →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 4).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inv.status === 'Paid'
                          ? 'badge-success'
                          : inv.status === 'Pending'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 mt-1">{inv.customerName}</div>
                  <div className="text-[11px] text-slate-400">Due: {inv.dueDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500">GST: ₹{inv.taxAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
