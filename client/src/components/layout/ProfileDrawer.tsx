import React from 'react';
import {
  X,
  Building,
  LogOut,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useErpStore } from '../../store/erpStore';
import { Combobox } from '../shared/Combobox';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout, setBranch } = useAuthStore();
  const { branches, organisation } = useErpStore();

  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === user.branchId) || branches[0] || {
    id: user.branchId || 'hq',
    code: 'HQ',
    name: user.branchName || 'Headquarters & Assembly Plant',
  };

  const handleBranchChange = (branchId: string) => {
    const targetBranch = branches.find((b) => b.id === branchId);
    if (targetBranch) {
      setBranch(targetBranch.id, targetBranch.name);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white shadow-2xl transition ease-in-out duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Profile & Account</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Session credentials, active branch & role privileges
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* User Identity Banner */}
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/20">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-md border border-white/30">
                {getInitials(user.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold truncate leading-tight">
                    {user.userName}
                  </h4>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-1 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-blue-200 mt-1 font-mono">
                  <span>ID: {user.userId}</span>
                  <span>&bull;</span>
                  <span>JWT in Cookie</span>
                </div>
              </div>
            </div>

            {/* Organisation & Branch Context */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Enterprise Context
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Organisation</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                  <span>{organisation.name}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">
                  Active Operating Branch
                </div>
                <Combobox
                  value={branches.find((b) => b.id === user.branchId)?.id || branches[0]?.id || user.branchId}
                  onChange={(val) => handleBranchChange(val)}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: `${b.code} — ${b.name}`,
                    sublabel: b.location,
                  }))}
                  searchable={false}
                />
              </div>
            </div>

            {/* Multi-Tenant Security Diagnostics */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-600" />
                <span>Multi-Tenant Schema Security</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your session is bound to PostgreSQL search path{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">
                  tenant_acme
                </code>
                . Invoices, customers, and store records remain strictly separated.
              </p>
            </div>
          </div>

          {/* Footer Action: Logout */}
          <div className="border-t border-slate-200 p-5 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2.5 px-4 text-xs font-bold text-rose-700 transition shadow-xs cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Log Out & Clear Session Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
