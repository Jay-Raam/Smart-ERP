import {
  LayoutDashboard,
  Users,
  Receipt,
  ReceiptText,
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
  BarChart3,
  Landmark,
  ArrowLeftRight,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useAuthStore } from '../../store/authStore';

export type ModuleType =
  | 'dashboard'
  | 'customers'
  | 'invoices'
  | 'purchase'
  | 'bills'
  | 'store'
  | 'products'
  | 'delivery'
  | 'branches'
  | 'financial-years'
  | 'bank'
  | 'transactions'
  | 'reports'
  | 'users';

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
    bills,
    invoices,
    purchaseOrders,
    storeItems,
    products,
    branches,
    financialYears,
    deliveryChallans,
    bankAccounts,
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
  const pendingBills = bills.filter((b) => b.status === 'Pending').length;

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
          id: 'bills' as ModuleType,
          label: 'Vendor Bills',
          icon: ReceiptText,
          badge: pendingBills > 0 ? `${pendingBills} Due` : null,
          badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        },
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
        { id: 'delivery' as ModuleType, label: 'Delivery Challans', icon: Truck, badge: deliveryChallans.length },
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

  const isSuperAdmin = Boolean(
    user?.role?.toLowerCase().replace(/\s+/g, '') === 'superadmin' ||
      (user as any)?.isSuperAdmin
  );

  navigationSections.push({
    title: 'Account',
    items: [
      {
        id: 'bank' as ModuleType,
        label: 'Bank',
        icon: Landmark,
        badge: bankAccounts.length > 0 ? `${bankAccounts.length}` : null,
      },
      {
        id: 'transactions' as ModuleType,
        label: 'Transaction',
        icon: ArrowLeftRight,
        badge: null,
      },
      ...(isSuperAdmin
        ? [
            {
              id: 'reports' as ModuleType,
              label: 'Reports',
              icon: BarChart3,
              badge: 'Super Admin',
              badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
            },
            {
              id: 'users' as ModuleType,
              label: 'Users & Roles',
              icon: ShieldCheck,
              badge: 'Super Admin',
              badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
            },
          ]
        : []),
    ],
  });

  const filteredSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isSuperAdmin) return true;
        const userPerms = (user as any)?.permissions;
        if (!userPerms) return false;
        const modPerm = userPerms[item.id];
        return Boolean(modPerm?.view === true);
      }),
    }))
    .filter((section) => section.items.length > 0);

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

      {/* Main Sidebar Shell (radix structure with theme support) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-18'
            : 'translate-x-0 w-64 shadow-xl lg:shadow-none'
        } select-none overflow-hidden`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-subtle)',
          borderRightWidth: '1px',
        }}
      >
        {/* SidebarHeader */}
        <div
          className="flex h-16 items-center px-3"
          style={{ borderColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm transition hover:scale-105 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
              title="Click to Expand Sidebar"
            >
              S
            </button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  S
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    Smart Enterprise
                    <span
                      className="rounded px-1.5 py-0.2 text-[9px] font-bold border"
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        borderColor: 'var(--color-primary-subtle)',
                      }}
                    >
                      ERP
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {activeBranch?.name}
                  </div>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* SidebarContent */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {filteredSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              {/* SidebarGroupLabel */}
              {!isCollapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                      className={`group relative flex items-center gap-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isCollapsed
                          ? 'w-10 h-10 mx-auto justify-center p-0'
                          : 'w-full px-2.5 py-2'
                      } ${
                        isActive
                          ? 'font-semibold shadow-xs'
                          : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                        color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                        borderColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                        borderWidth: '1px',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 transition"
                        style={{
                          color: isActive ? 'var(--color-primary)' : 'var(--text-subtle)',
                        }}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge !== null && (
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold shrink-0 ${
                                item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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

        {/* SidebarFooter (User Identity Card) */}
        <div
          className="p-2.5"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            borderTopWidth: '1px',
          }}
        >
          {!isCollapsed ? (
            <div
              className="rounded-xl border p-2.5 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {getInitials(user?.userName || 'User')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                    {user?.userName || 'User'}
                  </div>
                  <div className="text-[10px] font-medium capitalize truncate" style={{ color: 'var(--text-muted)' }}>
                    {user?.role || 'Staff'}
                  </div>
                </div>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer hover:scale-105 transition"
                style={{ backgroundColor: 'var(--color-primary)' }}
                title={`${user?.userName || 'User'} (${user?.role || 'Staff'})`}
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
