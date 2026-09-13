import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Building,
  FileText,
  Settings,
  Shield,
  Zap,
  Download,
  Check,
} from 'lucide-react';
import { useAuthStore, AVAILABLE_TENANTS } from '../../store/authStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvoiceModal?: () => void;
  onExportCsv?: () => void;
  onTriggerWebhook?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenInvoiceModal,
  onExportCsv,
  onTriggerWebhook,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { currentTenant, switchTenant, user, setRole } = useAuthStore();

  const commands = [
    {
      id: 'switch-acme',
      icon: Building,
      label: 'Switch Tenant: Acme Corp (tenant_acme)',
      shortcut: '⌘1',
      category: 'Tenancy',
      action: () => switchTenant('acme'),
    },
    {
      id: 'switch-globex',
      icon: Building,
      label: 'Switch Tenant: Globex Intl (tenant_globex)',
      shortcut: '⌘2',
      category: 'Tenancy',
      action: () => switchTenant('globex'),
    },
    {
      id: 'switch-initech',
      icon: Building,
      label: 'Switch Tenant: Initech Labs (tenant_initech)',
      shortcut: '⌘3',
      category: 'Tenancy',
      action: () => switchTenant('initech'),
    },
    {
      id: 'gen-invoice',
      icon: FileText,
      label: 'Generate GST Invoiced Batch (Schema Leased)',
      shortcut: 'G I',
      category: 'Invoicing',
      action: () => onOpenInvoiceModal?.(),
    },
    {
      id: 'export-csv',
      icon: Download,
      label: 'Export Ledger CSV (BullMQ Async Queue)',
      shortcut: 'E R',
      category: 'Exports',
      action: () => onExportCsv?.(),
    },
    {
      id: 'trigger-wh',
      icon: Zap,
      label: 'Dispatch HMAC-SHA256 Webhook Event',
      shortcut: 'W H',
      category: 'Workers',
      action: () => onTriggerWebhook?.(),
    },
    {
      id: 'role-owner',
      icon: Shield,
      label: 'RBAC: Assume Owner Role (Full Access [ * ])',
      shortcut: 'R O',
      category: 'Security',
      action: () => setRole('owner'),
    },
    {
      id: 'role-viewer',
      icon: Shield,
      label: 'RBAC: Assume Viewer Role (Read-Only)',
      shortcut: 'R V',
      category: 'Security',
      action: () => setRole('viewer'),
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (commands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % (commands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, commands, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0C]/95 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center border-b border-white/[0.08] px-4 py-3.5">
              <Search className="h-4 w-4 text-[#888888]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search schemas, tenants, invoices, or RBAC actions..."
                className="ml-3 w-full bg-transparent text-sm text-white placeholder-[#555555] outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-[#888888]">
                ESC
              </kbd>
            </div>
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {commands.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#666666] font-mono">
                  No matching orchestrator commands found.
                </div>
              ) : (
                commands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'bg-white/[0.08] text-white'
                          : 'text-[#CCCCCC] hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <cmd.icon
                          className={`h-4 w-4 transition-colors ${
                            isSelected ? 'text-[#D4FF00]' : 'text-[#888888]'
                          }`}
                        />
                        <span>{cmd.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-[#666666] px-1.5 py-0.5 rounded bg-white/[0.03]">
                          {cmd.category}
                        </span>
                        <kbd
                          className={`text-[10px] font-mono transition-colors ${
                            isSelected ? 'text-[#D4FF00]' : 'text-[#666666]'
                          }`}
                        >
                          {cmd.shortcut}
                        </kbd>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-[#666666]">
              <span>Active Tenant: <span className="text-white">{currentTenant.name}</span></span>
              <span>Role: <span className="text-[#D4FF00] uppercase">{user.role}</span></span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
