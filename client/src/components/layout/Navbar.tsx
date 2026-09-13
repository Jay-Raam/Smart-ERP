import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Check,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Menu,
  Sun,
  Calendar,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';
import { Combobox } from '../shared/Combobox';

interface NavbarProps {
  onOpenQuickAdd: (type: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenQuickAdd,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  onToggleSidebar,
}) => {
  const {
    branches,
    activeBranchId,
    switchBranch,
    organisation,
    switchOrganisation,
    financialYears,
    activeFinancialYear,
    switchFinancialYear,
  } = useErpStore();
  const { user } = useAuthStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  const fyRef = useRef<HTMLDivElement>(null);

  // Close FY dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fyRef.current && !fyRef.current.contains(e.target as Node)) {
        setIsFyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter branches strictly allowed for current user role
  const allowedBranches = branches.filter((b) => {
    if (user.role === 'SuperAdmin' || !user.roles || user.roles.length === 0) {
      return true;
    }
    return user.roles.some((r) => r.branchId === b.id);
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    <header className="h-16 shrink-0 w-full border-b border-slate-200 bg-white px-2 sm:px-4 lg:px-6 shadow-xs flex items-center justify-between gap-2 z-30 select-none">
      {/* Left Section: Sidebar Toggle + Greeting + Dual Switchers (Organisation & Branch) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition lg:hidden cursor-pointer shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Dynamic Greeting (Large Desktop Only) */}
        <div className="hidden 2xl:flex flex-col shrink-0 mr-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
            <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-medium">{getGreeting()},</span>
            <span className="font-bold text-slate-800">{user.userName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="font-medium truncate max-w-[180px]">
              {organisation.name}
            </span>
          </div>
        </div>

        {/* 1. Organisation Switcher Combobox (Visible on md and up) */}
        <div className="hidden md:block w-32 lg:w-40 shrink-0">
          <Combobox
            value={organisation.id || user.organisationId || 'org_main'}
            onChange={(val) => switchOrganisation(val)}
            options={[
              {
                value: organisation.id || user.organisationId || 'org_main',
                label: organisation.name.split(' ')[0] + ' ' + (organisation.name.split(' ')[1] || ''),
                sublabel: organisation.name,
              },
            ]}
            searchable={false}
          />
        </div>

        {/* 2. Branch Switcher Combobox (Adaptive Width, Always Accessible) */}
        <div className="w-32 sm:w-40 md:w-44 lg:w-52 shrink-0">
          <Combobox
            value={activeBranchId}
            onChange={(val) => switchBranch(val)}
            options={allowedBranches.map((b) => ({
              value: b.id,
              label: `${b.code} · ${b.name.split(' ')[0]}`,
              sublabel: b.name,
            }))}
            searchable={false}
          />
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-xs mx-3 hidden lg:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100/60 transition shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search ERP records...</span>
          </div>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Section: Financial Year Switcher + Quick Add + Notifications + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 3. Financial Year Switcher (Smart ERP Style) */}
        <div className="relative shrink-0" ref={fyRef}>
          <button
            type="button"
            onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200 bg-white px-2 sm:px-2.5 md:px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
            title="Switch Financial Year"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold shadow-xs">
              📅
            </div>
            <span className="hidden sm:inline font-mono text-xs whitespace-nowrap">
              {activeFinancialYear || '2026-2027'}
            </span>
            <ChevronDown
              className={`h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200 ${
                isFyDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isFyDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Financial Year
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {financialYears.map((fy) => {
                  const isSelected = activeFinancialYear === fy.yearName;
                  return (
                    <button
                      key={fy.id || fy.yearName}
                      type="button"
                      onClick={() => {
                        switchFinancialYear(fy.yearName);
                        setIsFyDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono">
                        <span>{fy.yearName}</span>
                        {fy.isCurrent && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="lg:hidden rounded-lg p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Quick Add Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 p-2 sm:px-2.5 sm:py-1.5 md:px-3 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer shrink-0"
            title="Quick Create"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:inline">Create</span>
            <ChevronDown className="h-3 w-3 shrink-0 hidden md:inline" />
          </button>

          {isQuickAddOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickAddOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAdd('invoice');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>New Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAdd('sales');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                  <span>New Sales Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAdd('customer');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5 text-violet-600" />
                  <span>New Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAdd('product');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  <span>New Product / SKU</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Trigger Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative rounded-lg p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer shrink-0"
          title="Open Notifications Drawer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar Trigger */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 cursor-pointer group shrink-0"
          title="Open Profile Drawer"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs group-hover:ring-2 group-hover:ring-blue-400/50 transition">
            {getInitials(user.userName)}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[90px]">
              {user.userName}
            </span>
            <span className="text-[10px] font-medium text-slate-400 capitalize">
              {user.role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
