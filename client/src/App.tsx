import React, { useState, useEffect } from 'react';
import { Sidebar, ModuleType } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ProfileDrawer } from './components/layout/ProfileDrawer';
import { ContextSwitcherDrawer } from './components/layout/ContextSwitcherDrawer';
import { ThemeDrawer } from './components/layout/ThemeDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuthStore } from './store/authStore';
import { useErpStore } from './store/erpStore';
import { useThemeStore } from './store/themeStore';

// ERP Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { BillModule } from './components/modules/bills/BillModule';
import { BillCreatePage } from './components/modules/bills/BillCreatePage';
import { InvoiceModule } from './components/modules/InvoiceModule';
import { InvoiceCreatePage } from './components/modules/invoices/InvoiceCreatePage';
import { PurchaseModule } from './components/modules/PurchaseModule';
import { PurchaseOrderCreatePage } from './components/modules/purchase/PurchaseOrderCreatePage';
import { StoreModule } from './components/modules/StoreModule';
import { ProductsModule } from './components/modules/ProductsModule';
import { CustomerModule } from './components/modules/CustomerModule';
import { CustomerDetailPage } from './components/modules/customers/CustomerDetailPage';
import { DeliveryModule } from './components/modules/DeliveryModule';
import { OrganisationModule } from './components/modules/OrganisationModule';
import { BranchModule } from './components/modules/BranchModule';
import { FinancialYearModule } from './components/modules/FinancialYearModule';
import { ReportsModule } from './components/modules/reports/ReportsModule';
import { BankModule } from './components/modules/banking/BankModule';
import { TransactionModule } from './components/modules/banking/TransactionModule';
import { UsersModule } from './components/modules/admin/UsersModule';

export function App() {
  const {
    isAuthenticated,
    isSessionValidated,
    checkSession,
    logout,
    validateSession,
    user,
  } = useAuthStore();
  const { fetchBootstrap, isInitialized, isLoading } = useErpStore();
  const { initTheme } = useThemeStore();
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, [initTheme]);
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/customers')) return 'customers';
      if (p.startsWith('/bills')) return 'bills';
      if (p.startsWith('/invoices')) return 'invoices';
      if (p === '/purchase-orders') return 'purchase';
      if (p === '/reports') return 'reports';
      if (p === '/bank') return 'bank';
      if (p === '/transactions') return 'transactions';
      if (p === '/users') return 'users';
      if (p === '/organisations') return 'organisations';
      if (p === '/branches') return 'branches';
    }
    return 'dashboard';
  });
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to popstate for browser navigation (forward/back and history.pushState)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (path.startsWith('/customers')) setActiveModule('customers');
      else if (path.startsWith('/bills')) setActiveModule('bills');
      else if (path.startsWith('/invoices')) setActiveModule('invoices');
      else if (path === '/purchase-orders') setActiveModule('purchase');
      else if (path === '/reports') setActiveModule('reports');
      else if (path === '/bank') setActiveModule('bank');
      else if (path === '/transactions') setActiveModule('transactions');
      else if (path === '/users') setActiveModule('users');
      else if (path === '/organisations') setActiveModule('organisations');
      else if (path === '/branches') setActiveModule('branches');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strictly bind authentication to the presence of the authToken cookie
  useEffect(() => {
    const verifyCookiePresence = () => {
      const hasCookie = checkSession();
      if (!hasCookie && isAuthenticated) {
        logout();
      }
    };

    verifyCookiePresence();
    const interval = setInterval(verifyCookiePresence, 500);
    window.addEventListener('focus', verifyCookiePresence);
    document.addEventListener('visibilitychange', verifyCookiePresence);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', verifyCookiePresence);
      document.removeEventListener('visibilitychange', verifyCookiePresence);
    };
  }, [isAuthenticated, checkSession, logout]);

  // Validate session against backend on mount/reload to hydrate in-memory RBAC
  useEffect(() => {
    if (isAuthenticated && !isSessionValidated) {
      validateSession().then((isValid) => {
        if (!isValid) {
          logout();
        }
      });
    }
  }, [isAuthenticated, isSessionValidated, validateSession, logout]);

  // Fallback active module if user lacks permission for current module
  useEffect(() => {
    if (isAuthenticated && isSessionValidated && user) {
      const isSuperAdmin = Boolean(
        user.role?.toLowerCase().replace(/\s+/g, '') === 'superadmin' ||
        user.userType === 'SUPER_ADMIN' ||
        (user as any).isSuperAdmin
      );
      if (!isSuperAdmin) {
        const perms = (user.userPermissions || (user as any).permissions || {}) as Record<string, any>;
        const hasPermission = Boolean(perms[activeModule]?.view === true);
        if (!hasPermission) {
          const permitted = Object.keys(perms).find(
            (mod) => perms[mod]?.view === true
          ) as ModuleType | undefined;
          if (permitted) {
            setActiveModule(permitted);
          }
        }
      }
    }
  }, [isAuthenticated, isSessionValidated, user, activeModule]);

  useEffect(() => {
    if (isAuthenticated && isSessionValidated && !isInitialized) {
      fetchBootstrap();
    }
  }, [isAuthenticated, isSessionValidated, isInitialized, fetchBootstrap]);

  // If not authenticated, display Enterprise Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // If session has not finished validating with backend /auth/me, display loading screen
  if (isAuthenticated && !isSessionValidated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-2xl shadow-lg shadow-blue-500/30 animate-pulse">
          S
        </div>
        <div className="mt-4 text-sm font-semibold text-slate-200">
          Validating Security Session & Permissions...
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Hydrating in-memory credentials and access privileges
        </div>
      </div>
    );
  }

  if (isLoading && !isInitialized) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-2xl shadow-lg shadow-blue-500/30 animate-pulse">
          S
        </div>
        <div className="mt-4 text-sm font-semibold text-slate-200">
          Loading Enterprise Workspace...
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Synchronizing live records from MongoDB Atlas
        </div>
      </div>
    );
  }

  const navigateTo = (path: string, module?: ModuleType) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (module) setActiveModule(module);
  };

  const handleQuickAdd = (type: string) => {
    if (type === 'invoice') {
      navigateTo('/invoices/new', 'invoices');
    } else if (type === 'bill') {
      navigateTo('/bills/new', 'bills');
    } else if (type === 'po' || type === 'purchase') {
      navigateTo('/purchase-orders/new', 'purchase');
    } else if (type === 'customer') {
      navigateTo('/', 'customers');
      setQuickAddType('customer');
    } else if (type === 'product') {
      navigateTo('/', 'products');
      setQuickAddType('product');
    }
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden antialiased font-sans transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* 1. Left Fixed Sidebar (h-screen shrink-0) */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={(m) => {
          setActiveModule(m);
          setQuickAddType(null);
          if (currentPath !== '/') {
            navigateTo('/', m);
          }
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarCollapsed(true);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* 2. Main Operational Area */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* Fixed Top Navbar (h-16 shrink-0) */}
        <Navbar
          onOpenQuickAdd={handleQuickAdd}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenContextSwitcher={() => setIsContextSwitcherOpen(true)}
          onOpenThemeCustomizer={() => setIsThemeDrawerOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Module Content Canvas: ONLY THIS BODY SCROLLS */}
        <main
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 transition-colors duration-200"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div className="max-w-7xl w-full mx-auto pb-12">
            {/* Dedicated Full Pages */}
            {currentPath === '/invoices/new' && <InvoiceCreatePage />}
            {currentPath.startsWith('/invoices/') && currentPath.endsWith('/edit') && (
              <InvoiceCreatePage isEdit={true} invoiceId={currentPath.split('/')[2]} />
            )}
            {currentPath.startsWith('/customers/') && (
              <CustomerDetailPage customerId={currentPath.replace('/customers/', '').split('/')[0]} />
            )}
            {currentPath === '/purchase-orders/new' && <PurchaseOrderCreatePage />}
            {currentPath === '/bills/new' && <BillCreatePage />}

            {/* Standard Module Routes */}
            {!['/invoices/new', '/purchase-orders/new', '/bills/new'].includes(currentPath) &&
              !(currentPath.startsWith('/invoices/') && currentPath.endsWith('/edit')) &&
              !currentPath.startsWith('/customers/') && (
              <>
                {activeModule === 'dashboard' && (
                  <DashboardModule onNavigate={(m) => {
                    setActiveModule(m);
                    navigateTo('/', m);
                  }} />
                )}
                {activeModule === 'invoices' && (
                  <InvoiceModule initialOpenAdd={quickAddType === 'invoice'} />
                )}
                {activeModule === 'bills' && <BillModule />}
                {activeModule === 'purchase' && <PurchaseModule />}
                {activeModule === 'store' && <StoreModule />}
                {activeModule === 'products' && (
                  <ProductsModule initialOpenAdd={quickAddType === 'product'} />
                )}
                {activeModule === 'customers' && (
                  <CustomerModule initialOpenAdd={quickAddType === 'customer'} />
                )}
                {activeModule === 'delivery' && <DeliveryModule />}
                {activeModule === 'organisations' && <OrganisationModule />}
                {activeModule === 'branches' && <BranchModule />}
                {activeModule === 'financial-years' && <FinancialYearModule />}
                {activeModule === 'bank' && <BankModule />}
                {activeModule === 'transactions' && <TransactionModule />}
                {activeModule === 'reports' && <ReportsModule />}
                {activeModule === 'users' && <UsersModule />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(m: ModuleType) => setActiveModule(m)}
      />

      {/* Slide-over Context Switcher Drawer */}
      <ContextSwitcherDrawer
        isOpen={isContextSwitcherOpen}
        onClose={() => setIsContextSwitcherOpen(false)}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateModule={(m: string) => setActiveModule(m as ModuleType)}
      />

      {/* Slide-over Profile & Account Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Slide-over Theme Appearance Customizer Drawer */}
      <ThemeDrawer
        isOpen={isThemeDrawerOpen}
        onClose={() => setIsThemeDrawerOpen(false)}
      />
    </div>
  );
}
