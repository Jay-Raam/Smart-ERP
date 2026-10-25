import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleDollarSign } from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { showAppToast } from '../../utils/handleApiError';

interface AgingRow { label: string; count: number; amount: number }
interface AgingData { receivables: AgingRow[]; payables: AgingRow[]; totals: { receivables: number; payables: number } }
interface ForecastRow { start: string; end: string; expectedInflow: number; expectedOutflow: number; netFlow: number; projectedClosingCash: number }
interface CashFlowData { openingCash: number; forecast: ForecastRow[] }

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const FinanceInsightsModule: React.FC = () => {
  const { activeOrganisationId, activeBranchId, activeFinancialYear } = useErpStore();
  const [aging, setAging] = useState<AgingData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ asOf });
      if (activeOrganisationId) params.set('organisationId', activeOrganisationId);
      if (activeBranchId) params.set('branchId', activeBranchId);
      if (activeFinancialYear) params.set('financialYear', activeFinancialYear);
      const [agingResponse, cashResponse] = await Promise.all([
        fetch(`/api/erp/finance/aging?${params}`),
        fetch(`/api/erp/finance/cash-flow?${params}&horizonDays=90`),
      ]);
      if (!agingResponse.ok || !cashResponse.ok) throw new Error('Unable to load finance insights.');
      setAging(await agingResponse.json());
      setCashFlow(await cashResponse.json());
    } catch (error: any) {
      showAppToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [asOf, activeOrganisationId, activeBranchId, activeFinancialYear]);
  const agingSections = aging ? [
    { title: 'Receivables aging', rows: aging.receivables, colour: 'emerald', total: aging.totals.receivables },
    { title: 'Payables aging', rows: aging.payables, colour: 'amber', total: aging.totals.payables },
  ] as const : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700"><CircleDollarSign className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Finance</span></div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Cash & Credit Insights</h1>
          <p className="mt-1 text-sm text-slate-500">Prioritise collections and payments using due-date exposure and projected cash.</p>
        </div>
        <label className="text-sm text-slate-500">As of <input className="input ml-2" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label>
      </div>

      {loading && <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">Refreshing finance insights…</div>}
      {aging && <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-emerald-800">Receivables outstanding</span><ArrowDownRight className="h-5 w-5 text-emerald-600" /></div><p className="mt-3 text-2xl font-bold text-emerald-900">{money(aging.totals.receivables)}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-amber-800">Payables outstanding</span><ArrowUpRight className="h-5 w-5 text-amber-600" /></div><p className="mt-3 text-2xl font-bold text-amber-900">{money(aging.totals.payables)}</p></div></div>}

      {aging && <div className="grid gap-6 lg:grid-cols-2">{agingSections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-semibold text-slate-900 dark:text-white">{section.title}</h2><div className="mt-4 space-y-3">{section.rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{row.label} <span className="text-xs text-slate-400">({row.count})</span></span><span className="font-mono">{money(row.amount)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${section.colour === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${section.total ? Math.min(100, (row.amount / section.total) * 100) : 0}%` }} /></div></div>)}</div></section>)}</div>}

      {cashFlow && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900 dark:text-white">90-day cash-flow forecast</h2><p className="text-sm text-slate-500">Opening cash: {money(cashFlow.openingCash)}</p></div><CalendarClock className="h-5 w-5 text-indigo-500" /></div><div className="mt-4 grid gap-3 md:grid-cols-3">{cashFlow.forecast.map((period) => <div key={period.start} className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800"><p className="text-xs text-slate-500">{period.start} → {period.end}</p><p className={`mt-2 font-mono font-semibold ${period.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{period.netFlow >= 0 ? '+' : ''}{money(period.netFlow)}</p><p className="mt-1 text-xs text-slate-500">Closing: {money(period.projectedClosingCash)}</p><div className="mt-3 flex justify-between text-[11px]"><span className="text-emerald-700">In {money(period.expectedInflow)}</span><span className="text-rose-700">Out {money(period.expectedOutflow)}</span></div></div>)}</div></section>}
    </div>
  );
};
