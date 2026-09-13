import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  Boxes,
  Building2,
  Calendar,
  FileCheck,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';

export type ModuleType =
  | 'dashboard'
  | 'customers'
  | 'sales'
  | 'invoices'
  | 'purchase'
  | 'store'
  | 'products'
  | 'delivery'
  | 'branches'
  | 'financial-years';

interface NavItem {
  id: ModuleType;
  label: string;
  icon: any;
  badge?: string | number | null;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isCollapsed,
  setIsCollapsed,
}) => {
  const {
    customers,
    salesOrders,
    invoices,
    purchaseOrders,
    storeItems,
    products,
    branches,
    financialYears,
    activeBranchId,
  } = useErpStore();
  const { user } = useAuthStore();

  const activeBranch =
    branches.find((b) => b.id === activeBranchId) ||
    branches[0] || {
      id: activeBranchId || 'hq',
      code: 'HQ',
      name: 'Headquarters',
    };

  const lowStockCount = storeItems.filter((i) => i.status === 'Low Stock').length;
  const pendingInvoices = invoices.filter((i) => i.status === 'Pending').length;

  const navigationSections: NavSection[] = [
    {
      title: 'Platform',
      items: [
        { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      title: 'Sales & Billing',
      items: [
        { id: 'customers' as ModuleType, label: 'Customers', icon: Users, badge: customers.length },
        { id: 'sales' as ModuleType, label: 'Sales Orders', icon: ShoppingCart, badge: salesOrders.length },
        {
          id: 'invoices' as ModuleType,
          label: 'Tax Invoices',
          icon: Receipt,
          badge: pendingInvoices > 0 ? `${pendingInvoices} Due` : null,
          badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
        },
      ],
    },
    {
      title: 'Inventory & Procurement',
      items: [
        { id: 'purchase' as ModuleType, label: 'Purchase Orders', icon: FileCheck, badge: purchaseOrders.length },
        {
          id: 'store' as ModuleType,
          label: 'Store & Stock',
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
          badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200',
        },
        { id: 'products' as ModuleType, label: 'Products Master', icon: Package, badge: products.length },
      ],
    },
    {
      title: 'Logistics',
      items: [
        { id: 'delivery' as ModuleType, label: 'Delivery Challans', icon: Truck, badge: null },
      ],
    },
    {
      title: 'Organisation & Setup',
      items: [
        { id: 'branches' as ModuleType, label: 'Branches & Hubs', icon: Building2, badge: `${branches.length} Br` },
        { id: 'financial-years' as ModuleType, label: 'Financial Years', icon: Calendar, badge: `${financialYears.length} FY` },
      ],
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Main Sidebar Shell (shadcn radix structure with template colors) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
          isCollapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-18'
            : 'translate-x-0 w-64 shadow-xl lg:shadow-none'
        } select-none overflow-hidden`}
      >
        {/* SidebarHeader */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-3.5">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-500/20">
                S
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                  Smart Enterprise
                  <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 border border-blue-200">
                    ERP
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 truncate">
                  {activeBranch?.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-500/20">
              S
            </div>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* SidebarContent */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              {/* SidebarGroupLabel */}
              {!isCollapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
              )}

              {/* SidebarMenu */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveModule(item.id)}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive
                            ? 'text-blue-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge !== null && (
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold shrink-0 ${
                                item.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Active Left Indicator Strip for Collapsed View */}
                      {isCollapsed && isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SidebarFooter (User Identity + Multi-Tenant Sync Card) */}
        <div className="border-t border-slate-200 p-2.5 bg-slate-50/60">
          {!isCollapsed ? (
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs">
                  {getInitials(user?.userName || 'Jay Raam')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.userName || 'Jay Raam'}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 capitalize truncate">
                    {user?.role || 'SuperAdmin'}
                  </div>
                </div>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="text-slate-400">Schema</span>
                <span className="font-semibold text-slate-700">tenant_acme</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs cursor-pointer"
                title={`${user?.userName || 'User'} (${user?.role || 'SuperAdmin'})`}
              >
                {getInitials(user?.userName || 'JR')}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
