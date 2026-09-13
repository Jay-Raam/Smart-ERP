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
  FileCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';

export type ModuleType =
  | 'dashboard'
  | 'customers'
  | 'sales'
  | 'invoices'
  | 'purchase'
  | 'store'
  | 'products'
  | 'delivery'
  | 'branches';

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
  const { customers, salesOrders, invoices, purchaseOrders, storeItems, products, branches, activeBranchId } = useErpStore();

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || {
    id: activeBranchId || 'hq',
    code: 'HQ',
    name: 'Headquarters',
  };
  const lowStockCount = storeItems.filter((i) => i.status === 'Low Stock').length;
  const pendingInvoices = invoices.filter((i) => i.status === 'Pending').length;

  const navigationSections: NavSection[] = [
    {
      title: 'CORE',
      items: [
        { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      title: 'SALES & BILLING',
      items: [
        { id: 'customers' as ModuleType, label: 'Customers', icon: Users, badge: customers.length },
        { id: 'sales' as ModuleType, label: 'Sales Orders', icon: ShoppingCart, badge: salesOrders.length },
        { id: 'invoices' as ModuleType, label: 'Tax Invoices', icon: Receipt, badge: pendingInvoices > 0 ? `${pendingInvoices} Pending` : null, badgeColor: 'bg-amber-100 text-amber-800' },
      ],
    },
    {
      title: 'INVENTORY & SOURCING',
      items: [
        { id: 'purchase' as ModuleType, label: 'Purchase Orders', icon: FileCheck, badge: purchaseOrders.length },
        { id: 'store' as ModuleType, label: 'Store & Stock', icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : null, badgeColor: 'bg-rose-100 text-rose-800' },
        { id: 'products' as ModuleType, label: 'Products Master', icon: Package, badge: products.length },
      ],
    },
    {
      title: 'LOGISTICS & DISPATCH',
      items: [
        { id: 'delivery' as ModuleType, label: 'Delivery Challans', icon: Truck, badge: null },
      ],
    },
    {
      title: 'COMPANY & SETUP',
      items: [
        { id: 'branches' as ModuleType, label: 'Organisation & Branches', icon: Building2, badge: `${branches.length} Br` },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } z-20 select-none shadow-sm overflow-hidden`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
              S
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1">
                Smart Enterprise
                <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-600 border border-blue-200">
                  ERP
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 truncate max-w-[130px]">
                {activeBranch?.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            S
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationSections.map((sec, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {sec.title}
              </div>
            )}
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge !== null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Multi-Tenant Sync</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 font-mono truncate">
              Schema: tenant_acme
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
