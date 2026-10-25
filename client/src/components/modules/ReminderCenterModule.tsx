import React, { useEffect, useState } from 'react';
import { ExternalLink, Mail, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { showAppToast } from '../../utils/handleApiError';

interface Reminder {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  dueDate: string;
  daysOverdue: number;
  outstandingAmount: number;
  mailtoUrl: string;
  whatsappUrl: string;
}
interface ReminderSummary {
  totalOverdueInvoices: number;
  totalReceivableAtRisk: number;
  averageOverdueDays: number;
  reminders: Reminder[];
}

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const ReminderCenterModule: React.FC = () => {
  const { activeOrganisationId, activeBranchId } = useErpStore();
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [minOverdueDays, setMinOverdueDays] = useState('0');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ minOverdueDays });
      if (activeOrganisationId) params.set('organisationId', activeOrganisationId);
      if (activeBranchId) params.set('branchId', activeBranchId);
      const response = await fetch(`/api/erp/finance/reminders?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load payment reminders.');
      setSummary(data);
    } catch (error: any) {
      showAppToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOrganisationId, activeBranchId, minOverdueDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700"><Send className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Collections</span></div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Payment Reminder Center</h1>
          <p className="mt-1 text-sm text-slate-500">Open customer-ready email or WhatsApp reminders for overdue invoices.</p>
        </div>
        <div className="flex items-center gap-2"><label className="text-xs text-slate-500">Minimum overdue days<select className="input ml-2" value={minOverdueDays} onChange={(event) => setMinOverdueDays(event.target.value)}><option value="0">Any overdue</option><option value="7">7+</option><option value="30">30+</option><option value="60">60+</option><option value="90">90+</option></select></label><button type="button" onClick={load} disabled={loading} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
      </div>
      {summary && <><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-sm text-rose-700">Overdue invoices</p><p className="mt-2 text-3xl font-bold text-rose-950">{summary.totalOverdueInvoices}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-700">Receivable at risk</p><p className="mt-2 text-3xl font-bold text-amber-950">{money(summary.totalReceivableAtRisk)}</p></div><div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5"><p className="text-sm text-indigo-700">Average overdue age</p><p className="mt-2 text-3xl font-bold text-indigo-950">{summary.averageOverdueDays} days</p></div></div><section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-900 dark:text-white">Ready-to-send reminders</h2></div><div className="divide-y divide-slate-100 dark:divide-zinc-800">{summary.reminders.map((reminder) => <div key={reminder.invoiceId} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold text-slate-900 dark:text-white">{reminder.customerName} · {reminder.invoiceNumber}</p><p className="mt-1 text-xs text-slate-500">Due {reminder.dueDate} · {reminder.daysOverdue} days overdue · {money(reminder.outstandingAmount)}</p></div><div className="flex gap-2"><a href={reminder.mailtoUrl} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Mail className="h-4 w-4" /> Email</a><a href={reminder.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp <ExternalLink className="h-3 w-3" /></a></div></div>)}{summary.reminders.length === 0 && <p className="p-6 text-sm text-slate-500">No overdue invoices match this filter.</p>}</div></section></>}
    </div>
  );
};
