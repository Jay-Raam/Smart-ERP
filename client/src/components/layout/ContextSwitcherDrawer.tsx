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
} from 'lucide-react';
import { useErpStore, Branch } from '../../store/erpStore';
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
    organisations,
    organisation,
    branches,
    activeBranchId,
    switchBranch,
    financialYears,
    activeFinancialYear,
    switchFinancialYear,
    switchOrganisation,
    activeOrganisationId,
  } = useErpStore();
  const { user } = useAuthStore();

  const [draftOrgId, setDraftOrgId] = useState<string>('');
  const [draftBranchId, setDraftBranchId] = useState<string>('');
  const [draftFinancialYear, setDraftFinancialYear] = useState<string>('');
  const [draftBranches, setDraftBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const orgList = organisations && organisations.length > 0 ? organisations : [organisation];
  const resolvedCurrentOrgId = activeOrganisationId || organisation.id || organisation._id || '';

  // Initialize draft selections when drawer opens or active state changes
  useEffect(() => {
    if (isOpen) {
      const initialOrgId = resolvedCurrentOrgId || orgList[0]?.id || orgList[0]?._id || '';
      setDraftOrgId(initialOrgId);
      setDraftBranches(branches);
      setDraftBranchId(activeBranchId || (branches[0]?.id ?? ''));
      setDraftFinancialYear(activeFinancialYear || '2026-2027');
    }
  }, [isOpen, resolvedCurrentOrgId, activeBranchId, branches, activeFinancialYear]);

  if (!isOpen) return null;

  // Handle clicking an organisation
  const handleSelectOrg = async (targetOrgId: string) => {
    if (targetOrgId === draftOrgId) return;
    setDraftOrgId(targetOrgId);

    if (targetOrgId === resolvedCurrentOrgId) {
      setDraftBranches(branches);
      if (branches.length > 0) {
        setDraftBranchId(branches[0].id);
      }
      return;
    }

    setIsLoadingBranches(true);
    try {
      const res = await fetch(`/api/erp/branches?organisationId=${targetOrgId}`);
      if (res.ok) {
        const branchData: Branch[] = await res.json();
        setDraftBranches(branchData);
        if (branchData.length > 0) {
          setDraftBranchId(branchData[0].id);
        } else {
          setDraftBranchId('');
        }
      }
    } catch (err) {
      console.error('Failed to load branches for target org:', err);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  // Filter branches strictly allowed for current user role
  const allowedBranches = draftBranches.filter((b) => {
    if (user.role === 'SuperAdmin' || !user.roles || user.roles.length === 0) {
      return true;
    }
    return user.roles.some((r) => r.branchId === b.id);
  });

  const hasBranchChanged = draftBranchId !== activeBranchId;
  const hasFyChanged = draftFinancialYear !== activeFinancialYear;
  const hasOrgChanged = draftOrgId !== resolvedCurrentOrgId;
  const hasChanges = hasBranchChanged || hasFyChanged || hasOrgChanged;

  const currentActiveBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const draftBranchObj = draftBranches.find((b) => b.id === draftBranchId) || draftBranches[0];
  const draftOrgObj = orgList.find((o) => (o.id || o._id) === draftOrgId) || organisation;

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
    setDraftOrgId(resolvedCurrentOrgId);
    setDraftBranches(branches);
    setDraftBranchId(activeBranchId || (branches[0]?.id ?? ''));
    setDraftFinancialYear(activeFinancialYear || '2026-2027');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-12">
        <div className="w-screen max-w-lg transform bg-white dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-[#222225] shadow-2xl transition ease-in-out duration-300 flex flex-col text-slate-900 dark:text-slate-100">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222225] px-6 py-4 bg-slate-50/90 dark:bg-[#111114]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Workspace & Multi-Org Switcher
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select enterprise organisation, operational branch, and fiscal year
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1f1f23] hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Close Drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active Status Ribbon */}
          <div className="border-b border-slate-200 dark:border-[#222225] bg-blue-50/60 dark:bg-[#13151b] px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Current:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {organisation.name.split(' ')[0]} · {currentActiveBranch?.code || 'HQ'}
              </span>
              <span className="text-slate-400 dark:text-slate-600 shrink-0">|</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                FY {activeFinancialYear || '2026-2027'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
              {orgList.length} Orgs Available
            </span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Multiple Organisations Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Select Organisation ({orgList.length})
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Switch corporate legal entity
                </span>
              </div>

              <div className="space-y-2.5">
                {orgList.map((orgItem) => {
                  const orgItemId = orgItem.id || orgItem._id || '';
                  const isSelected = draftOrgId === orgItemId;
                  const isCurrentlyActive = resolvedCurrentOrgId === orgItemId;

                  return (
                    <div
                      key={orgItemId}
                      onClick={() => handleSelectOrg(orgItemId)}
                      className={`relative flex items-center justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/25 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-[#232328] bg-white dark:bg-[#141417] hover:border-slate-300 dark:hover:border-[#333339] hover:bg-slate-50/60 dark:hover:bg-[#18181c]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-[#202025] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {orgItem.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {orgItem.name}
                            </span>
                            {isCurrentlyActive && (
                              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Active Workspace
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>CIN: {orgItem.cin || 'N/A'}</span>
                            <span>•</span>
                            <span>GSTIN: {orgItem.gstin || 'N/A'}</span>
                          </div>
                          {orgItem.branchCount !== undefined && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              <span>{orgItem.branchCount} Operational Branches</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-[#333338] bg-white dark:bg-[#18181c]'
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

            {/* 2. Operational Branch Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Operational Branches ({allowedBranches.length})
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {isLoadingBranches ? 'Loading branches...' : `Branches for ${draftOrgObj?.name?.split(' ')[0] || 'Selected'}`}
                </span>
              </div>

              {isLoadingBranches ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading branches for selected organisation...
                </div>
              ) : allowedBranches.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-[#2a2a2f] text-center text-xs text-slate-500">
                  No branches configured for this organisation.
                </div>
              ) : (
                <div className="space-y-2">
                  {allowedBranches.map((branch) => {
                    const isSelected = draftBranchId === branch.id;
                    const isCurrentlyActive =
                      activeBranchId === branch.id && resolvedCurrentOrgId === draftOrgId;

                    return (
                      <div
                        key={branch.id}
                        onClick={() => setDraftBranchId(branch.id)}
                        className={`relative flex items-center justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/25 shadow-xs ring-1 ring-blue-500/20'
                            : 'border-slate-200 dark:border-[#232328] bg-white dark:bg-[#141417] hover:border-slate-300 dark:hover:border-[#333339] hover:bg-slate-50/60 dark:hover:bg-[#18181c]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-[#202025] text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {branch.code.split('-')[1] || branch.code.slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {branch.name}
                              </span>
                              {branch.isHeadOffice && (
                                <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  Head Office
                                </span>
                              )}
                              {isCurrentlyActive && (
                                <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  Active Now
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-medium">
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
                                : 'border-slate-300 dark:border-[#333338] bg-white dark:bg-[#18181c]'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Financial Fiscal Year Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Financial Fiscal Year
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Fiscal ledger books
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
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/25 ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-[#232328] bg-white dark:bg-[#141417] hover:border-slate-300 dark:hover:border-[#333339]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          FY {fy.yearName}
                        </span>
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {fy.isCurrent ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Current FY</span>
                        ) : (
                          <span>{fy.status}</span>
                        )}
                        {isCurrentlyActive && <span>• Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hint Box */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Persistent Multi-Tenant Context Guarantee
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
                Switching context persists to your secure session and synchronizes live scoped records (Invoices, Customers, Bank Accounts, Inventory) from MongoDB Atlas.
              </p>
            </div>
          </div>

          {/* Sticky Footer Action with Switch Button */}
          {hasChanges ? (
            <div className="border-t border-slate-200 dark:border-[#222225] bg-white dark:bg-[#111114] p-4 shadow-xl animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[340px]">
                  Target:{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {draftOrgObj?.name?.split(' ')[0]} · {draftBranchObj?.name?.split(' ')[0] || draftBranchObj?.code || 'Branch'}
                  </span>{' '}
                  ·{' '}
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{draftFinancialYear}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer shrink-0"
                >
                  Discard
                </button>
              </div>

              <button
                type="button"
                onClick={handleApplySwitch}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white px-4 py-2.5 text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <ArrowLeftRight className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Switching Enterprise Context...' : 'Apply & Switch Context'}</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-200 dark:border-[#222225] bg-slate-50/80 dark:bg-[#111114] px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Workspace context is in sync</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1c1c20] transition cursor-pointer"
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
