import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Bell,
  ChevronDown,
  FileText,
  ReceiptText,
  FileCheck,
  Users,
  Package,
  Menu,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

interface NavbarProps {
  onOpenQuickAdd: (type: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenContextSwitcher: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenQuickAdd,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  onOpenContextSwitcher,
  onToggleSidebar,
}) => {
  const { branches, activeBranchId, activeFinancialYear } = useErpStore();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const activeBranch =
    branches.find((b) => b.id === activeBranchId) ||
    branches[0] || {
      id: activeBranchId || 'hq',
      code: 'HQ',
      name: 'Chennai HQ',
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
    <header className="h-16 shrink-0 w-full border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6 shadow-xs flex items-center justify-between gap-3 z-30 select-none">
      {/* Left Section: Mobile Menu + Clean Context Switcher Button */}
      <div className="flex items-center gap-2 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition lg:hidden cursor-pointer shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Unified Tenant & Branch Context Pill Button */}
        <button
          type="button"
          onClick={onOpenContextSwitcher}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 px-2.5 py-1.5 text-xs transition shadow-xs cursor-pointer min-w-0"
          title="Open Workspace & Fiscal Context Switcher"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs group-hover:scale-105 transition">
            <Building2 className="h-3.5 w-3.5" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 truncate hidden md:inline">
              Smart Enterprise
            </span>
            <span className="text-slate-400 hidden md:inline">•</span>
            <span className="font-semibold text-slate-800 truncate">
              {activeBranch.code} · {activeBranch.name.split(' ')[0]}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded text-[11px] whitespace-nowrap">
              FY {activeFinancialYear || '2026-2027'}
            </span>
          </div>

          <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition pl-0.5 shrink-0">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>

      {/* Center Section: Global Search */}
      <div className="flex-1 max-w-sm mx-2 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100/70 transition shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search customers, invoices, items...</span>
          </div>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shrink-0 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Section: Actions + Notifications + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Quick Add Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 sm:px-3 text-xs font-semibold text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-xs cursor-pointer shrink-0"
            title="Quick Create"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-3 w-3 shrink-0 hidden sm:inline" />
          </button>

          {isQuickAddOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickAddOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
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
                    onOpenQuickAdd('bill');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ReceiptText className="h-3.5 w-3.5 text-indigo-600" />
                  <span>New Vendor Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickAdd('po');
                    setIsQuickAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>New Purchase Order</span>
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
          title={unreadCount > 0 ? `${unreadCount} unread operational alert${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar Trigger */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 cursor-pointer group shrink-0"
          title="Open Profile Drawer"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs group-hover:ring-2 group-hover:ring-blue-400/50 transition">
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
