import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Shield,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Menu,
  Sun,
  Moon,
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
  const { branches, activeBranchId, setActiveBranch, organisation } = useErpStore();
  const { user } = useAuthStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || {
    id: activeBranchId || 'hq',
    code: 'HQ',
    name: 'Headquarters',
  };

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
    <header className="h-16 shrink-0 w-full border-b border-slate-200 bg-white px-4 lg:px-6 shadow-xs flex items-center justify-between z-30 select-none">
      {/* Left Section: Sidebar Toggle + Greeting + Organisation/Branch */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition lg:hidden cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Dynamic Greeting */}
        <div className="hidden md:flex flex-col shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
            <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-medium">{getGreeting()},</span>
            <span className="font-bold text-slate-800">{user.userName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="font-medium truncate max-w-[200px] lg:max-w-[280px]">
              {organisation.name}
            </span>
          </div>
        </div>

        {/* Branch Selector Combobox */}
        <div className="w-[170px] sm:w-[220px]">
          <Combobox
            value={activeBranchId}
            onChange={(val) => setActiveBranch(val)}
            options={branches.map((b) => ({
              value: b.id,
              label: `${b.code} • ${b.name.split(' ')[0]}`,
              sublabel: b.name,
            }))}
            searchable={false}
          />
        </div>
      </div>

      {/* Center Section: Compact/Expandable Search Bar */}
      <div className="flex-1 max-w-sm mx-3 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100/60 transition shadow-xs cursor-pointer"
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

      {/* Right Section: Mobile Search Icon + Quick Add + Notifications + Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Quick Add Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-3 w-3" />
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
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          title="Open Notifications Drawer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar Trigger */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
          title="Open Profile Drawer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs group-hover:ring-2 group-hover:ring-blue-400/50 transition">
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
