import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { showAppToast } from '../../utils/handleApiError';

interface Match {
  billId: string;
  billNumber: string;
  vendorName: string;
  billTotal: number;
  poNumber?: string;
  totalVariance: number;
  overallStatus: string;
  actionRecommendation: string;
}
interface Summary {
  totalBillsAudited: number;
  perfectMatches: number;
  discrepanciesCount: number;
  unmatchedCount: number;
  totalVarianceAmount: number;
  matches: Match[];
}

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const ReconciliationModule: React.FC = () => {
  const { activeOrganisationId, activeBranchId } = useErpStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeOrganisationId) params.set('organisationId', activeOrganisationId);
      if (activeBranchId) params.set('branchId', activeBranchId);
      const response = await fetch(`/api/erp/finance/reconciliation?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to run reconciliation.');
      setSummary(data);
    } catch (error: any) {
      showAppToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOrganisationId, activeBranchId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700"><ClipboardList className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Controls</span></div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Three-way Reconciliation</h1>
          <p className="mt-1 text-sm text-slate-500">Compare vendor bills with purchase orders and inward stock before payment.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Run audit</button>
      </div>
      {summary && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Bills audited</p><p className="mt-2 text-3xl font-bold">{summary.totalBillsAudited}</p></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm text-emerald-700">Perfect matches</p><p className="mt-2 text-3xl font-bold text-emerald-900">{summary.perfectMatches}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-700">Discrepancies</p><p className="mt-2 text-3xl font-bold text-amber-900">{summary.discrepanciesCount}</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-sm text-rose-700">Variance exposure</p><p className="mt-2 text-3xl font-bold text-rose-900">{money(summary.totalVarianceAmount)}</p></div></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-900 dark:text-white">Bill reconciliation results</h2></div><div className="divide-y divide-slate-100 dark:divide-zinc-800">{summary.matches.map((match) => <div key={match.billId} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><div className="flex items-center gap-2">{match.overallStatus === 'PERFECT_MATCH' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}<p className="font-semibold text-slate-900 dark:text-white">{match.billNumber} · {match.vendorName}</p></div><p className="mt-1 text-xs text-slate-500">{match.poNumber ? `PO ${match.poNumber} · ` : 'No linked PO · '}{match.actionRecommendation}</p></div><div className="text-right"><p className="font-mono font-semibold">{money(match.billTotal)}</p><p className={`text-xs ${Math.abs(match.totalVariance) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>Variance: {money(match.totalVariance)}</p></div></div>)}{summary.matches.length === 0 && <p className="p-6 text-sm text-slate-500">No vendor bills found for this scope.</p>}</div></section></>}
    </div>
  );
};
