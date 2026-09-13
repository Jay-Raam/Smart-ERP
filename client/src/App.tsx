import React, { useState, useEffect } from 'react';
import { Sidebar, ModuleType } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ProfileDrawer } from './components/layout/ProfileDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuthStore } from './store/authStore';
import { useErpStore } from './store/erpStore';

// ERP Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { SalesModule } from './components/modules/SalesModule';
import { InvoiceModule } from './components/modules/InvoiceModule';
import { PurchaseModule } from './components/modules/PurchaseModule';
import { StoreModule } from './components/modules/StoreModule';
import { ProductsModule } from './components/modules/ProductsModule';
import { CustomerModule } from './components/modules/CustomerModule';
import { DeliveryModule } from './components/modules/DeliveryModule';
import { BranchModule } from './components/modules/BranchModule';
import { FinancialYearModule } from './components/modules/FinancialYearModule';

export function App() {
  const { isAuthenticated, checkSession, logout } = useAuthStore();
  const { fetchBootstrap, isInitialized, isLoading } = useErpStore();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      fetchBootstrap();
    }
  }, [isAuthenticated, isInitialized, fetchBootstrap]);

  // If not authenticated, display Enterprise Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
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

  const handleQuickAdd = (type: string) => {
    if (type === 'invoice') {
      setActiveModule('invoices');
      setQuickAddType('invoice');
    } else if (type === 'sales') {
      setActiveModule('sales');
      setQuickAddType('sales');
    } else if (type === 'customer') {
      setActiveModule('customers');
      setQuickAddType('customer');
    } else if (type === 'product') {
      setActiveModule('products');
      setQuickAddType('product');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans">
      {/* 1. Left Fixed Sidebar (h-screen shrink-0) */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={(m) => {
          setActiveModule(m);
          setQuickAddType(null);
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
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Module Content Canvas: ONLY THIS BODY SCROLLS */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl w-full mx-auto pb-12">
            {activeModule === 'dashboard' && (
              <DashboardModule onNavigate={(m) => setActiveModule(m)} />
            )}
            {activeModule === 'sales' && (
              <SalesModule initialOpenAdd={quickAddType === 'sales'} />
            )}
            {activeModule === 'invoices' && (
              <InvoiceModule initialOpenAdd={quickAddType === 'invoice'} />
            )}
            {activeModule === 'purchase' && <PurchaseModule />}
            {activeModule === 'store' && <StoreModule />}
            {activeModule === 'products' && (
              <ProductsModule initialOpenAdd={quickAddType === 'product'} />
            )}
            {activeModule === 'customers' && (
              <CustomerModule initialOpenAdd={quickAddType === 'customer'} />
            )}
            {activeModule === 'delivery' && <DeliveryModule />}
            {activeModule === 'branches' && <BranchModule />}
            {activeModule === 'financial-years' && <FinancialYearModule />}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(m: ModuleType) => setActiveModule(m)}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Slide-over Profile & Account Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
