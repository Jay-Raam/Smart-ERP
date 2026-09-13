import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Lock,
  Plus,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useErpStore, FinancialYear } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';

export const FinancialYearModule: React.FC = () => {
  const {
    financialYears,
    activeFinancialYear,
    switchFinancialYear,
    addFinancialYear,
    updateFinancialYear,
    fetchBootstrap,
    isLoading,
    branches,
    activeBranchId,
  } = useErpStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [status, setStatus] = useState<'Active' | 'Closed'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const totalYears = financialYears.length;
  const currentFY = financialYears.find((fy) => fy.isCurrent) || financialYears[0];
  const activeCount = financialYears.filter((fy) => fy.status === 'Active').length;
  const closedCount = financialYears.filter((fy) => fy.status === 'Closed').length;

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName || !startDate || !endDate) return;

    try {
      setIsSubmitting(true);
      await addFinancialYear({
        yearName: yearName.trim(),
        startDate,
        endDate,
        isCurrent,
        status,
        branchId: activeBranchId,
      });
      setIsModalOpen(false);
      setYearName('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
    } catch (err) {
      // Error toast is handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (fy: FinancialYear) => {
    await updateFinancialYear(fy.id, { isCurrent: true, status: 'Active' });
    await switchFinancialYear(fy.yearName);
  };

  const handleToggleStatus = async (fy: FinancialYear) => {
    const nextStatus = fy.status === 'Active' ? 'Closed' : 'Active';
    await updateFinancialYear(fy.id, { status: nextStatus });
  };

  const columns: ColumnDef<FinancialYear>[] = [
    {
      key: 'yearName',
      header: 'Financial Year',
      render: (fy) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>{fy.yearName}</span>
              {fy.isCurrent && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Current Active
                </span>
              )}
              {activeFinancialYear === fy.yearName && !fy.isCurrent && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Viewing
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">Fiscal accounting period</div>
          </div>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (fy) => <span className="font-mono text-slate-700">{fy.startDate}</span>,
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (fy) => <span className="font-mono text-slate-700">{fy.endDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (fy) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            fy.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {fy.status === 'Active' ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Lock className="h-3 w-3 text-slate-500" />
          )}
          <span>{fy.status}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Operations',
      align: 'right',
      render: (fy) => (
        <div className="flex items-center justify-end gap-2">
          {!fy.isCurrent && (
            <button
              type="button"
              onClick={() => handleSetCurrent(fy)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer shadow-xs"
            >
              Set as Current
            </button>
          )}
          {activeFinancialYear !== fy.yearName && (
            <button
              type="button"
              onClick={() => switchFinancialYear(fy.yearName)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            >
              Switch To
            </button>
          )}
          <button
            type="button"
            onClick={() => handleToggleStatus(fy)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              fy.status === 'Active'
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {fy.status === 'Active' ? 'Close Period' : 'Reopen'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
              Financial Year Master
            </h1>
            <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">
              FY Management
            </span>
            <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold">
              Branch: {currentBranch ? currentBranch.name : 'All Branches'}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">
            Maintain multi-year fiscal accounting periods and isolate transactional reporting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Financial Year</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Fiscal Years</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalYears}</div>
          <div className="mt-1 text-[11px] text-slate-400">Recorded financial years</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Current Operational Year</span>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {currentFY?.yearName || '2026-2027'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">System default posting year</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active FY Periods</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Open for transactions</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Closed / Audited</span>
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{closedCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Locked periods</div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={financialYears}
        columns={columns}
        searchPlaceholder="Search fiscal years..."
        searchKeys={['yearName', 'status', 'startDate', 'endDate']}
        statusKey="status"
        statusOptions={[
          { label: 'Active', value: 'Active' },
          { label: 'Closed', value: 'Closed' },
        ]}
        onReload={() => fetchBootstrap()}
        isLoading={isLoading}
      />

      {/* Modal for Creating Financial Year */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Add New Financial Year</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-2028"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <Combobox
                  value={status}
                  onChange={(val) => setStatus(val as 'Active' | 'Closed')}
                  options={[
                    { value: 'Active', label: 'Active (Open for Transactions)' },
                    { value: 'Closed', label: 'Closed (Audited / Locked)' },
                  ]}
                  searchable={false}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrentCheckbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="isCurrentCheckbox" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                  Set as Current Active Financial Year
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
