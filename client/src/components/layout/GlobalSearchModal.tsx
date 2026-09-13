import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  Boxes,
  Building2,
  X,
  ArrowRight,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { ModuleType } from './Sidebar';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleType) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { customers, products, bills, invoices, branches } = useErpStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBills = bills
    .filter((b) => b.billNumber.toLowerCase().includes(query.toLowerCase()) || b.vendorName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredInvoices = invoices
    .filter((inv) => inv.invoiceNumber.toLowerCase().includes(query.toLowerCase()) || inv.customerName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredCustomers = customers
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.city.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search Sales Orders, Invoices, Customers, Products..."
            className="ml-3 w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none"
          />
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Vendor Bills */}
          {filteredBills.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendor Bills
              </div>
              <div className="space-y-1">
                {filteredBills.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onNavigate('bills');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="font-bold text-slate-900 font-mono">{b.billNumber}</span>
                      <span className="text-slate-600">— {b.vendorName}</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tax Invoices
              </div>
              <div className="space-y-1">
                {filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('invoices');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</span>
                      <span className="text-slate-600">— {inv.customerName}</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Products & Items
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-slate-400 font-mono">({p.sku})</span>
                    </div>
                    <span className="font-mono text-slate-600">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customers
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-violet-600" />
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-slate-400">({c.city})</span>
                    </div>
                    <span className="font-mono text-slate-500">{c.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
