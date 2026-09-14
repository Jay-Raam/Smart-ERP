import React from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Customer, useErpStore } from '../../../store/erpStore';

interface CustomerDetailsDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateInvoice?: (customerId: string) => void;
}

export const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  customer,
  isOpen,
  onClose,
  onGenerateInvoice,
}) => {
  const { branches, organisation } = useErpStore();

  if (!isOpen || !customer) return null;

  const branch = branches.find((b) => b.id === customer.branchId) || branches[0];
  const availableCredit = Math.max(0, (customer.creditLimit || 0) - (customer.outstandingBalance || 0));
  const creditUsagePercent =
    customer.creditLimit && customer.creditLimit > 0
      ? Math.min(100, Math.round(((customer.outstandingBalance || 0) / customer.creditLimit) * 100))
      : 0;

  // Extract PAN from GSTIN (chars 3 to 12) if valid
  const panFromGstin =
    customer.gstin && customer.gstin.length >= 12
      ? customer.gstin.slice(2, 12).toUpperCase()
      : 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {customer.code}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 truncate" title={customer.name}>
                {customer.name}
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {customer.city}, {customer.billingState || customer.state || 'Tamil Nadu'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
              title="Close Drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
            {/* Financial & Credit Limits */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Credit & Account Status
                </span>
                <span className="text-[11px] font-medium text-slate-500 font-mono">
                  {creditUsagePercent}% Utilized
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Outstanding Balance</div>
                  <div className="text-sm font-bold font-mono text-amber-600 mt-0.5">
                    ₹{(customer.outstandingBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Sanctioned Credit Limit</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    ₹{(customer.creditLimit || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Credit Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full transition-all ${creditUsagePercent > 80
                    ? 'bg-rose-500'
                    : creditUsagePercent > 50
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                    }`}
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Available: ₹{availableCredit.toLocaleString('en-IN')}</span>
                <span>Limit: &gt; ₹10,000 Verified</span>
              </div>
            </div>

            {/* Primary Contact Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs mb-2">
                <Mail className="h-4 w-4 text-slate-500" />
                Contact Information
              </h3>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Key Contact Person</span>
                <span className="font-medium text-slate-900">{customer.contactPerson || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Email Address</span>
                <a
                  href={`mailto:${customer.email}`}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                >
                  {customer.email}
                </a>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Phone Number</span>
                <a
                  href={`tel:${customer.phone}`}
                  className="font-mono font-medium text-slate-900 hover:text-blue-600 flex items-center gap-1"
                >
                  <Phone className="h-3 w-3 text-slate-400" />
                  {customer.phone}
                </a>
              </div>
            </div>

            {/* GSTIN & Tax Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Statutory & Tax Verification
              </h3>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">GSTIN</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {customer.gstin || 'Unregistered'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Derived PAN</span>
                <span className="font-mono font-medium text-slate-700">{panFromGstin}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Place of Supply State</span>
                <span className="font-medium text-slate-800">
                  {customer.billingState || customer.state || 'Tamil Nadu'}
                </span>
              </div>
            </div>

            {/* Addresses */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs mb-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                Address Records
              </h3>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <span>Billing Address</span>
                  <span className="text-[10px] text-slate-400">({customer.billingState || customer.state})</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {customer.billingAddress || customer.address || 'Same as corporate office'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <span>Shipping Address (Consignee)</span>
                  <span className="text-[10px] text-slate-400">({customer.shippingState || customer.state})</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {customer.shippingAddress || customer.billingAddress || customer.address || 'Same as billing address'}
                </p>
              </div>
            </div>

            {/* Operational Context */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs mb-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                Branch & Operational Scope
              </h3>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Servicing Branch</span>
                <span className="font-medium text-slate-800">{branch?.name || 'All Branches'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Organisation</span>
                <span className="font-medium text-slate-800">{organisation?.name || 'Smart Enterprise Industries Ltd.'}</span>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
            >
              Close
            </button>

            {onGenerateInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGenerateInvoice(customer.id);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Generate Tax Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
