import React, { useEffect, useMemo, useState } from 'react';
import { Factory, Layers3, Plus, Play, CheckCircle2, PackageCheck } from 'lucide-react';
import { useErpStore, Product } from '../../store/erpStore';
import { showAppToast } from '../../utils/handleApiError';

interface BomComponent {
  productId: string;
  quantity: number;
  scrapPercent: number;
  uom: string;
  level: number;
}

interface Bom {
  id: string;
  bomNumber: string;
  productId: string;
  productName: string;
  revision: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  components: BomComponent[];
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  productName: string;
  plannedQuantity: number;
  producedQuantity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  plannedStartDate: string;
  plannedEndDate: string;
  status: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  materials: Array<{ productName: string; requiredQuantity: number; availableQuantity: number; consumedQuantity: number; uom: string }>;
}

const today = new Date().toISOString().slice(0, 10);

export const ProductionModule: React.FC = () => {
  const { products, activeOrganisationId, activeBranchId, activeFinancialYear } = useErpStore();
  const [boms, setBoms] = useState<Bom[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'boms' | 'orders'>('boms');
  const [showBomForm, setShowBomForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [finishedProductId, setFinishedProductId] = useState('');
  const [revision, setRevision] = useState('A');
  const [componentProductId, setComponentProductId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [components, setComponents] = useState<BomComponent[]>([]);
  const [selectedBomId, setSelectedBomId] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState(1);
  const [priority, setPriority] = useState<WorkOrder['priority']>('MEDIUM');
  const [plannedStartDate, setPlannedStartDate] = useState(today);
  const [plannedEndDate, setPlannedEndDate] = useState(today);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (activeOrganisationId) params.set('organisationId', activeOrganisationId);
    if (activeBranchId) params.set('branchId', activeBranchId);
    if (activeFinancialYear) params.set('financialYear', activeFinancialYear);
    return params.toString();
  }, [activeOrganisationId, activeBranchId, activeFinancialYear]);

  const load = async () => {
    const [bomResponse, orderResponse] = await Promise.all([
      fetch(`/api/erp/production/boms?${query}`),
      fetch(`/api/erp/production/work-orders?${query}`),
    ]);
    if (!bomResponse.ok || !orderResponse.ok) throw new Error('Unable to load production planning data.');
    setBoms(await bomResponse.json());
    setOrders(await orderResponse.json());
  };

  useEffect(() => {
    load().catch((error: Error) => showAppToast(error.message, 'error'));
  }, [query]);

  const addComponent = () => {
    const product = products.find((item) => item.id === componentProductId);
    if (!product || componentQuantity <= 0 || product.id === finishedProductId) {
      showAppToast('Choose a valid component and positive quantity.', 'warning');
      return;
    }
    setComponents((current) => [...current, { productId: product.id, quantity: componentQuantity, scrapPercent: 0, uom: product.uom, level: 1 }]);
    setComponentProductId('');
    setComponentQuantity(1);
  };

  const createBom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!finishedProductId || components.length === 0) {
      showAppToast('Choose a finished product and add at least one component.', 'warning');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/erp/production/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: finishedProductId, revision, components, branchId: activeBranchId, organisationId: activeOrganisationId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create BOM.');
      setShowBomForm(false);
      setFinishedProductId('');
      setRevision('A');
      setComponents([]);
      await load();
      showAppToast('BOM created as draft.', 'success');
    } catch (error: any) {
      showAppToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch('/api/erp/production/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bomId: selectedBomId,
          plannedQuantity,
          priority,
          plannedStartDate,
          plannedEndDate,
          branchId: activeBranchId,
          organisationId: activeOrganisationId,
          financialYear: activeFinancialYear,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create work order.');
      setShowOrderForm(false);
      await load();
      showAppToast('Work order created with a material availability snapshot.', 'success');
    } catch (error: any) {
      showAppToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const updateOrder = async (order: WorkOrder, action: 'RELEASED' | 'IN_PROGRESS' | 'CANCELLED') => {
    const response = await fetch(`/api/erp/production/work-orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to update work order.');
    await load();
  };

  const consumeMaterials = async (order: WorkOrder) => {
    const response = await fetch(`/api/erp/production/work-orders/${order.id}/consume-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to consume materials.');
    await load();
  };

  const receiveOutput = async (order: WorkOrder) => {
    const remaining = order.plannedQuantity - order.producedQuantity;
    const entered = window.prompt(`Finished quantity to receive (maximum ${remaining}):`, String(remaining));
    if (entered === null) return;
    const quantity = Number(entered);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > remaining) {
      showAppToast('Enter a valid finished-goods quantity.', 'warning');
      return;
    }
    const response = await fetch(`/api/erp/production/work-orders/${order.id}/receive-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to receive finished goods.');
    await load();
  };

  const activateBom = async (bom: Bom) => {
    const response = await fetch(`/api/erp/production/boms/${bom.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Unable to activate BOM.');
    await load();
  };

  const productName = (id: string) => products.find((product) => product.id === id)?.name || 'Unknown product';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700"><Factory className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Operations</span></div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Production Planning</h1>
          <p className="mt-1 text-sm text-slate-500">Define multi-level assemblies, plan material demand, and execute work orders.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => activeTab === 'boms' ? setShowBomForm(true) : setShowOrderForm(true)}>
          <Plus className="h-4 w-4" /> {activeTab === 'boms' ? 'New BOM' : 'New Work Order'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800">
        <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'boms' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-500'}`} onClick={() => setActiveTab('boms')}>Bill of Materials ({boms.length})</button>
        <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-500'}`} onClick={() => setActiveTab('orders')}>Work Orders ({orders.length})</button>
      </div>

      {activeTab === 'boms' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {boms.map((bom) => (
            <div key={bom.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-mono text-xs text-slate-400">{bom.bomNumber} · Rev {bom.revision}</p><h2 className="mt-1 font-semibold text-slate-900 dark:text-white">{bom.productName}</h2></div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${bom.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{bom.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">{bom.components.map((component, index) => <div key={`${component.productId}-${index}`} className="flex justify-between border-b border-slate-100 py-2 dark:border-zinc-800"><span>{productName(component.productId)}</span><span className="font-mono text-slate-500">{component.quantity} {component.uom}</span></div>)}</div>
              {bom.status === 'DRAFT' && <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700" onClick={() => activateBom(bom).catch((error: Error) => showAppToast(error.message, 'error'))}><CheckCircle2 className="h-4 w-4" /> Activate BOM</button>}
            </div>
          ))}
          {boms.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 lg:col-span-2">No BOMs yet. Create one to plan production.</div>}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const availability = order.materials.length === 0 ? 1 : order.materials.filter((material) => material.availableQuantity >= material.requiredQuantity).length / order.materials.length;
            return <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs text-slate-400">{order.workOrderNumber}</p><h2 className="font-semibold text-slate-900 dark:text-white">{order.productName}</h2><p className="text-xs text-slate-500">{order.plannedStartDate} → {order.plannedEndDate} · {order.priority}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{order.status}</span></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Planned / Produced</p><p className="font-mono">{order.plannedQuantity} / {order.producedQuantity}</p></div><div><p className="text-xs text-slate-500">Material readiness</p><p className={`font-mono ${availability === 1 ? 'text-emerald-700' : 'text-amber-700'}`}>{Math.round(availability * 100)}%</p></div><div className="flex items-end justify-end gap-2">{order.status === 'PLANNED' && <button className="btn-secondary inline-flex items-center gap-1 text-xs" onClick={() => updateOrder(order, 'RELEASED').catch((error: Error) => showAppToast(error.message, 'error'))}><Play className="h-3 w-3" /> Release</button>}{order.status === 'RELEASED' && <button className="btn-secondary inline-flex items-center gap-1 text-xs" onClick={() => updateOrder(order, 'IN_PROGRESS').catch((error: Error) => showAppToast(error.message, 'error'))}><Layers3 className="h-3 w-3" /> Start</button>}{['RELEASED', 'IN_PROGRESS'].includes(order.status) && <button className="btn-secondary inline-flex items-center gap-1 text-xs" onClick={() => consumeMaterials(order).catch((error: Error) => showAppToast(error.message, 'error'))}><Layers3 className="h-3 w-3" /> Consume</button>}{order.status === 'IN_PROGRESS' && <button className="btn-secondary inline-flex items-center gap-1 text-xs" onClick={() => receiveOutput(order).catch((error: Error) => showAppToast(error.message, 'error'))}><PackageCheck className="h-3 w-3" /> Receive</button>}</div></div>
            </div>;
          })}
          {orders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No work orders yet. Activate a BOM first.</div>}
        </div>
      )}

      {showBomForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={createBom} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"><h2 className="text-xl font-semibold">Create BOM</h2><select className="input w-full" value={finishedProductId} onChange={(event) => setFinishedProductId(event.target.value)}><option value="">Finished product</option>{products.map((product: Product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select><input className="input w-full" value={revision} onChange={(event) => setRevision(event.target.value)} placeholder="Revision" /><div className="flex gap-2"><select className="input flex-1" value={componentProductId} onChange={(event) => setComponentProductId(event.target.value)}><option value="">Component</option>{products.filter((product) => product.id !== finishedProductId).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input className="input w-28" type="number" min="0.0001" step="0.0001" value={componentQuantity} onChange={(event) => setComponentQuantity(Number(event.target.value))} /><button type="button" className="btn-secondary" onClick={addComponent}>Add</button></div><div className="max-h-40 space-y-2 overflow-auto">{components.map((component, index) => <div key={`${component.productId}-${index}`} className="flex justify-between rounded bg-slate-50 p-2 text-sm dark:bg-zinc-800"><span>{productName(component.productId)}</span><span>{component.quantity} {component.uom}</span></div>)}</div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setShowBomForm(false)}>Cancel</button><button disabled={busy} className="btn-primary" type="submit">Save Draft</button></div></form></div>}
      {showOrderForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={createOrder} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"><h2 className="text-xl font-semibold">Create Work Order</h2><select className="input w-full" required value={selectedBomId} onChange={(event) => setSelectedBomId(event.target.value)}><option value="">Active BOM</option>{boms.filter((bom) => bom.status === 'ACTIVE').map((bom) => <option key={bom.id} value={bom.id}>{bom.bomNumber} · {bom.productName}</option>)}</select><div className="grid grid-cols-2 gap-3"><input className="input" type="number" min="0.0001" step="0.0001" value={plannedQuantity} onChange={(event) => setPlannedQuantity(Number(event.target.value))} /><select className="input" value={priority} onChange={(event) => setPriority(event.target.value as WorkOrder['priority'])}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select><input className="input" type="date" value={plannedStartDate} onChange={(event) => setPlannedStartDate(event.target.value)} /><input className="input" type="date" value={plannedEndDate} onChange={(event) => setPlannedEndDate(event.target.value)} /></div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setShowOrderForm(false)}>Cancel</button><button disabled={busy} className="btn-primary" type="submit">Create Work Order</button></div></form></div>}
    </div>
  );
};
