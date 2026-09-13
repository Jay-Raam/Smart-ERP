import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  Check,
  ArrowLeftRight,
  MapPin,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';

interface ContextSwitcherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContextSwitcherDrawer: React.FC<ContextSwitcherDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    branches,
    activeBranchId,
    switchBranch,
    financialYears,
    activeFinancialYear,
    switchFinancialYear,
    organisation,
    switchOrganisation,
    activeOrganisationId,
  } = useErpStore();
  const { user } = useAuthStore();

  const [draftOrgId, setDraftOrgId] = useState<string>('');
  const [draftBranchId, setDraftBranchId] = useState<string>('');
  const [draftFinancialYear, setDraftFinancialYear] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize draft selections when drawer opens or active state changes
  useEffect(() => {
    if (isOpen) {
      setDraftOrgId(activeOrganisationId || organisation.id || 'org_main');
      setDraftBranchId(activeBranchId || (branches[0]?.id ?? ''));
      setDraftFinancialYear(activeFinancialYear || '2026-2027');
    }
  }, [isOpen, activeOrganisationId, organisation.id, activeBranchId, branches, activeFinancialYear]);

  if (!isOpen) return null;

  // Filter branches strictly allowed for current user role
  const allowedBranches = branches.filter((b) => {
    if (user.role === 'SuperAdmin' || !user.roles || user.roles.length === 0) {
      return true;
    }
    return user.roles.some((r) => r.branchId === b.id);
  });

  const hasBranchChanged = draftBranchId !== activeBranchId;
  const hasFyChanged = draftFinancialYear !== activeFinancialYear;
  const hasOrgChanged = draftOrgId !== (activeOrganisationId || organisation.id || 'org_main');
  const hasChanges = hasBranchChanged || hasFyChanged || hasOrgChanged;

  const currentActiveBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const draftBranchObj = branches.find((b) => b.id === draftBranchId) || currentActiveBranch;

  const handleApplySwitch = async () => {
    if (!hasChanges || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (hasOrgChanged && draftOrgId) {
        await switchOrganisation(draftOrgId);
      }
      if (hasBranchChanged && draftBranchId) {
        await switchBranch(draftBranchId);
      }
      if (hasFyChanged && draftFinancialYear) {
        await switchFinancialYear(draftFinancialYear);
      }
      onClose();
    } catch (err) {
      console.error('Failed to switch context:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDraftOrgId(activeOrganisationId || organisation.id || 'org_main');
    setDraftBranchId(activeBranchId || (branches[0]?.id ?? ''));
    setDraftFinancialYear(activeFinancialYear || '2026-2027');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-8 sm:pl-12">
        <div className="w-screen max-w-lg transform bg-white shadow-2xl transition ease-in-out duration-300 flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Workspace & Fiscal Context
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Switch active organisation, branch, and financial year
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              title="Close Drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active Status Ribbon */}
          <div className="border-b border-slate-200 bg-blue-50/60 px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 font-medium">Current Active:</span>
              <span className="font-bold text-slate-900">
                {currentActiveBranch?.code || 'HQ'} · {currentActiveBranch?.name?.split(' ')[0] || 'Chennai'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono font-semibold text-blue-700">
                FY {activeFinancialYear || '2026-2027'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {branches.length} Branches Available
            </span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Organisation Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  Tenant Organisation
                </label>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Primary Tenant
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {organisation.name || 'Smart Enterprise Industries Ltd.'}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                      <span>CIN: {organisation.cin || 'U29100TN2026PLC089211'}</span>
                      <span>•</span>
                      <span>GSTIN: {organisation.gstin || '33AAACT1024K1Z8'}</span>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-slate-200 shadow-xs">
                    CORP HQ
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Operational Branch Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  Operational Branch
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Select branch to scope records
                </span>
              </div>

              <div className="space-y-2">
                {allowedBranches.map((branch) => {
                  const isSelected = draftBranchId === branch.id;
                  const isCurrentlyActive = activeBranchId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      onClick={() => setDraftBranchId(branch.id)}
                      className={`relative flex items-center justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {branch.code.split('-')[1] || branch.code.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {branch.name}
                            </span>
                            {branch.isHeadOffice && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 border border-indigo-200">
                                Head Office
                              </span>
                            )}
                            {isCurrentlyActive && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-mono text-slate-600 font-medium">
                              {branch.code}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {branch.location || branch.address?.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Financial Fiscal Year Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Financial Fiscal Year
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Fiscal ledger & invoice books
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {financialYears.map((fy) => {
                  const isSelected = draftFinancialYear === fy.yearName;
                  const isCurrentlyActive = activeFinancialYear === fy.yearName;

                  return (
                    <button
                      key={fy.id || fy.yearName}
                      type="button"
                      onClick={() => setDraftFinancialYear(fy.yearName)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {fy.yearName}
                        </span>
                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        {fy.isCurrent && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                            Current FY
                          </span>
                        )}
                        {isCurrentlyActive && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-semibold text-blue-800">
                            Active
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium capitalize">
                          {fy.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information Notice */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Persistent Context Guarantee
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Switching context persists to your secure local session and reloads live MongoDB records for the selected branch and financial year.
              </p>
            </div>
          </div>

          {/* Sticky Footer Action with Switch Button */}
          {hasChanges ? (
            <div className="border-t border-slate-200 bg-white p-4 shadow-xl animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-medium text-slate-600">
                  Target: <span className="font-bold text-slate-900">{draftBranchObj?.name}</span> ·{' '}
                  <span className="font-mono font-semibold text-blue-600">{draftFinancialYear}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                >
                  Discard
                </button>
              </div>

              <button
                type="button"
                onClick={handleApplySwitch}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
              >
                <ArrowLeftRight className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Switching Workspace...' : 'Apply & Switch Context'}</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Workspace context is in sync</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
