import React, { useState } from 'react';
import { ChevronRight, Download, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { InvoiceData } from '../../hooks/useTenantData';
import { CanAccess } from '../CanAccess';
import { useAuthStore } from '../../store/authStore';

interface TableProps {
  invoices: InvoiceData[];
  onOpenCreateModal: () => void;
  onExportCsv: () => void;
  isExporting?: boolean;
}

export const EnterpriseDataTable: React.FC<TableProps> = ({
  invoices,
  onOpenCreateModal,
  onExportCsv,
  isExporting = false,
}) => {
  const { currentTenant } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.project?.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/85 backdrop-blur-2xl shadow-xl">
      {/* Table Header Controls */}
      <div className="border-b border-white/[0.08] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Isolated Schema Invoices
            </h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-[#888888]">
              search_path: {currentTenant.schemaName}
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Cryptographically separated ledger scoped to {currentTenant.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#666666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter invoice or project..."
              className="rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#555555] outline-none focus:border-[#D4FF00]/50 transition"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-[#888888]" />
            <span>{isExporting ? 'Queuing...' : 'Export CSV'}</span>
          </button>

          {/* Create Invoice Button (RBAC Protected) */}
          <CanAccess
            permission="invoices:write"
            fallback={
              <button
                disabled
                title="Requires invoices:write permission (Current Role: Viewer)"
                className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-[#555555] cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Invoice</span>
              </button>
            }
          >
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4FF00]/30 bg-[#D4FF00] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-[#c2ea00] active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </button>
          </CanAccess>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-6 py-2 bg-white/[0.01]">
        {['all', 'paid', 'pending', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-mono uppercase transition ${
              filterStatus === status
                ? 'bg-white/10 text-white font-medium'
                : 'text-[#666666] hover:text-[#AAAAAA]'
            }`}
          >
            {status}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-[#555555]">
          Showing {filteredInvoices.length} of {invoices.length} entries
        </span>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-mono uppercase text-[#888888]">
            <tr>
              <th className="px-6 py-3.5">Invoice</th>
              <th className="px-6 py-3.5">Project</th>
              <th className="px-6 py-3.5">Subtotal</th>
              <th className="px-6 py-3.5">GST (18%)</th>
              <th className="px-6 py-3.5">Total</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-white">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-xs font-mono text-[#666666]">
                  No invoice records match current filters in schema `{currentTenant.schemaName}`
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-mono text-xs text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-white">{inv.project?.name || 'General Operations'}</div>
                    <div className="text-[11px] font-mono text-[#888888]">{inv.project?.code || 'PRJ-OPS'}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#CCCCCC]">
                    ${inv.subtotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#888888]">
                    ${(inv.subtotal * 0.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-[#D4FF00]">
                    ${inv.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase ${
                        inv.status === 'paid'
                          ? 'bg-[#D4FF00]/10 text-[#D4FF00] border border-[#D4FF00]/20'
                          : inv.status === 'pending'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {inv.status === 'paid' && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {inv.status === 'pending' && <Clock className="h-2.5 w-2.5" />}
                      {inv.status === 'overdue' && <AlertTriangle className="h-2.5 w-2.5" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => alert(`Viewing invoice ${inv.invoiceNumber} details`)}
                      className="text-[#888888] transition hover:text-white p-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
