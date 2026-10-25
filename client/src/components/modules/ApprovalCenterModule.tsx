import React from 'react';
import { CheckCircle2, ClipboardCheck, PackageCheck, XCircle } from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { usePermissions } from '../../hooks/usePermissions';

export const ApprovalCenterModule: React.FC = () => {
  const {
    products,
    purchaseOrders,
    approveProduct,
    rejectProduct,
    approveAutoReorderPO,
  } = useErpStore();
  const { canApprove: canApproveProducts } = usePermissions('products');
  const { canApprove: canApprovePurchases } = usePermissions('purchase');
  const pendingProducts = products.filter((product) => product.approvalStatus === 'Pending');
  const pendingReorders = purchaseOrders.filter((order) => order.status === 'AUTO_REORDER_PENDING');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-700">
          <ClipboardCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Governance</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Approval Center</h1>
        <p className="mt-1 text-sm text-slate-500">Review pending master-data and automated procurement actions from one queue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-sm font-medium text-indigo-800">Products awaiting approval</p>
          <p className="mt-2 text-3xl font-bold text-indigo-950">{pendingProducts.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">Auto-reorder POs awaiting approval</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{pendingReorders.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Product master requests</h2>
        </div>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
          {pendingProducts.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                <p className="font-mono text-xs text-slate-500">{product.sku} · {product.category} · {product.uom}</p>
              </div>
              {canApproveProducts ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => approveProduct(product.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button type="button" onClick={() => rejectProduct(product.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              ) : <span className="text-xs text-slate-400">Approval permission required</span>}
            </div>
          ))}
          {pendingProducts.length === 0 && <p className="py-5 text-sm text-slate-500">No product requests are waiting.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Automated procurement requests</h2>
        </div>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
          {pendingReorders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{order.poNumber}</p>
                <p className="text-xs text-slate-500">{order.vendorName} · {order.items.length} item(s)</p>
              </div>
              {canApprovePurchases ? (
                <button type="button" onClick={() => approveAutoReorderPO(order.id)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
                  <CheckCircle2 className="h-4 w-4" /> Approve PO
                </button>
              ) : <span className="text-xs text-slate-400">Approval permission required</span>}
            </div>
          ))}
          {pendingReorders.length === 0 && <p className="py-5 text-sm text-slate-500">No automated purchase orders are waiting.</p>}
        </div>
      </section>
    </div>
  );
};
