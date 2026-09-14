import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Building,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useErpStore, BankAccount } from '../../../store/erpStore';
import { showAppToast } from '../../../utils/handleApiError';
import { usePermissions } from '../../../hooks/usePermissions';

export const BankModule: React.FC = () => {
  const { bankAccounts, addBankAccount, setPrimaryBankAccount, customers, vendors } = useErpStore();
  const { canAdd, canApprove } = usePermissions('bank');

  const [searchQuery, setSearchQuery] = useState('');
  const [holderTypeFilter, setHolderTypeFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmPrimaryOpen, setIsConfirmPrimaryOpen] = useState(false);
  const [targetAccountToSetPrimary, setTargetAccountToSetPrimary] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    accountHolderName: 'Smart Enterprise Industries Ltd.',
    accountHolderType: 'ORGANISATION' as 'ORGANISATION' | 'CUSTOMER' | 'VENDOR',
    partyId: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'CURRENT' as 'CURRENT' | 'SAVINGS' | 'OVERDRAFT' | 'CASH_CREDIT',
    currency: 'INR',
    openingBalance: '',
    isPrimary: false,
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    let error = '';
    if (name === 'bankName' && !value.trim()) {
      error = 'Bank name is required';
    } else if (name === 'accountNumber') {
      if (!value.trim()) error = 'Account number is required';
      else if (!/^\d{9,18}$/.test(value.trim())) error = 'Enter 9 to 18 digits';
    } else if (name === 'confirmAccountNumber') {
      if (value !== formData.accountNumber) error = 'Account numbers do not match';
    } else if (name === 'ifscCode') {
      if (!value.trim()) error = 'IFSC code is required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase())) {
        error = 'Invalid IFSC format (e.g. HDFC0000128)';
      }
    } else if (name === 'accountHolderName' && !value.trim()) {
      error = 'Account holder name is required';
    }
    return error;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'accountHolderType' && value === 'ORGANISATION') {
        updated.accountHolderName = 'Smart Enterprise Industries Ltd.';
        updated.partyId = '';
      }
      return updated;
    });

    const err = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    ['accountHolderName', 'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode'].forEach((f) => {
      const err = validateField(f, (formData as any)[f]);
      if (err) errors[f] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showAppToast('Please resolve all validation errors before submitting', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await addBankAccount({
        accountHolderName: formData.accountHolderName,
        accountHolderType: formData.accountHolderType,
        partyId: formData.partyId || undefined,
        partyName:
          formData.accountHolderType === 'CUSTOMER'
            ? customers.find((c) => c.id === formData.partyId)?.name
            : formData.accountHolderType === 'VENDOR'
            ? vendors.find((v) => v.id === formData.partyId)?.name
            : undefined,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode.toUpperCase(),
        accountType: formData.accountType,
        currency: formData.currency,
        openingBalance: Number(formData.openingBalance) || 0,
        balance: Number(formData.openingBalance) || 0,
        isPrimary: formData.isPrimary,
        notes: formData.notes,
      });

      setIsAddModalOpen(false);
      setFormData({
        accountHolderName: 'Smart Enterprise Industries Ltd.',
        accountHolderType: 'ORGANISATION',
        partyId: '',
        bankName: '',
        branchName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        accountType: 'CURRENT',
        currency: 'INR',
        openingBalance: '',
        isPrimary: false,
        notes: '',
      });
      setFormErrors({});
    } catch (err: any) {
      // Toast handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSetPrimary = async () => {
    if (!targetAccountToSetPrimary) return;
    try {
      setIsSubmitting(true);
      await setPrimaryBankAccount(targetAccountToSetPrimary.id);
      setIsConfirmPrimaryOpen(false);
      setTargetAccountToSetPrimary(null);
    } catch (err: any) {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Accounts
  const filteredAccounts = bankAccounts.filter((acc) => {
    if (holderTypeFilter !== 'ALL' && acc.accountHolderType !== holderTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        acc.bankName.toLowerCase().includes(q) ||
        acc.accountNumber.toLowerCase().includes(q) ||
        acc.ifscCode.toLowerCase().includes(q) ||
        acc.accountHolderName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const orgAccounts = bankAccounts.filter((a) => a.accountHolderType === 'ORGANISATION');
  const primaryAccount = orgAccounts.find((a) => a.isPrimary) || orgAccounts[0];
  const totalLiquidFunds = orgAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Metric Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bank Accounts Management</h1>
              <p className="text-xs text-slate-500">
                Centralized management of Organisation, Customer, and Vendor institutional accounts
              </p>
            </div>
          </div>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Bank Account</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Liquid Balance (Organisation)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            ₹{totalLiquidFunds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {orgAccounts.length} active enterprise accounts</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800">Primary Organisation Account</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-1">
            {primaryAccount ? primaryAccount.bankName : 'No Primary Set'}
          </div>
          <p className="text-xs font-mono text-slate-600">
            A/c: {primaryAccount ? primaryAccount.accountNumber : '—'} &bull; IFSC: {primaryAccount?.ifscCode || '—'}
          </p>
          <div className="text-xs font-bold text-blue-700 mt-1 font-mono">
            ₹{(primaryAccount?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accounts Breakdown</span>
            <Building className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{bankAccounts.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {orgAccounts.length} Organisation &bull; {bankAccounts.filter((a) => a.accountHolderType === 'CUSTOMER').length} Customer &bull; {bankAccounts.filter((a) => a.accountHolderType === 'VENDOR').length} Vendor
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bank, account number, IFSC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ORGANISATION', 'CUSTOMER', 'VENDOR'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setHolderTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                holderTypeFilter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Accounts' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Account Holder</th>
                <th className="py-3 px-4">Bank & Branch</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">IFSC Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Available Balance</th>
                <th className="py-3 px-4 text-center">Primary Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No bank accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{acc.accountHolderName}</div>
                      <span
                        className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-sm mt-0.5 ${
                          acc.accountHolderType === 'ORGANISATION'
                            ? 'bg-blue-100 text-blue-800'
                            : acc.accountHolderType === 'CUSTOMER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {acc.accountHolderType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{acc.bankName}</div>
                      <div className="text-[11px] text-slate-500">{acc.branchName || 'Main Branch'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{acc.accountNumber}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">{acc.ifscCode}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(Number(acc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.isPrimary ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PRIMARY</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {acc.accountHolderType === 'ORGANISATION' && !acc.isPrimary && canApprove && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetAccountToSetPrimary(acc);
                            setIsConfirmPrimaryOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          <Star className="h-3 w-3" />
                          <span>Set Primary</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Add New Institutional Bank Account</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4 text-xs">
              {/* Holder Type Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ORGANISATION', 'CUSTOMER', 'VENDOR'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange('accountHolderType', type)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${
                        formData.accountHolderType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Party Selector */}
              {formData.accountHolderType === 'CUSTOMER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                  <select
                    value={formData.partyId}
                    onChange={(e) => {
                      const cust = customers.find((c) => c.id === e.target.value);
                      handleInputChange('partyId', e.target.value);
                      if (cust) handleInputChange('accountHolderName', cust.name);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gstin})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.accountHolderType === 'VENDOR' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Vendor *</label>
                  <select
                    value={formData.partyId}
                    onChange={(e) => {
                      const vend = vendors.find((v) => v.id === e.target.value);
                      handleInputChange('partyId', e.target.value);
                      if (vend) handleInputChange('accountHolderName', vend.name);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gstin || 'Unregistered'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account Holder Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    formErrors.accountHolderName ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                  }`}
                  required
                />
                {formErrors.accountHolderName && (
                  <p className="text-[10px] text-red-600 mt-0.5">{formErrors.accountHolderName}</p>
                )}
              </div>

              {/* Bank Name & Branch Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                      formErrors.bankName ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.bankName && (
                    <p className="text-[10px] text-red-600 mt-0.5">{formErrors.bankName}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Guindy Industrial Estate"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Account Number & Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="password"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      formErrors.accountNumber ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.accountNumber && (
                    <p className="text-[10px] text-red-600 mt-0.5">{formErrors.accountNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    placeholder="Confirm account number"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      formErrors.confirmAccountNumber ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.confirmAccountNumber && (
                    <p className="text-[10px] text-red-600 mt-0.5">{formErrors.confirmAccountNumber}</p>
                  )}
                </div>
              </div>

              {/* IFSC & Account Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0000128"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono uppercase ${
                      formErrors.ifscCode ? 'border-red-500 bg-red-50/40' : 'border-slate-300'
                    }`}
                    maxLength={11}
                    required
                  />
                  {formErrors.ifscCode && (
                    <p className="text-[10px] text-red-600 mt-0.5">{formErrors.ifscCode}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="CURRENT">Current Account</option>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="OVERDRAFT">Overdraft (OD)</option>
                    <option value="CASH_CREDIT">Cash Credit (CC)</option>
                  </select>
                </div>
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(e) => handleInputChange('openingBalance', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              {/* Primary Toggle for Organisation */}
              {formData.accountHolderType === 'ORGANISATION' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPrimary" className="text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold text-blue-900 block">Set as Primary Organisation Account</span>
                    <span className="text-[11px] text-slate-600">
                      If selected, this account will automatically become primary and any previous primary account will be demoted.
                    </span>
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Primary Confirmation Dialog */}
      {isConfirmPrimaryOpen && targetAccountToSetPrimary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Confirm Primary Bank Account Change</h3>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Setting <span className="font-bold text-slate-900">{targetAccountToSetPrimary.bankName}</span> (A/c:{' '}
              <span className="font-mono font-semibold">{targetAccountToSetPrimary.accountNumber}</span>) as your primary account will transactionally demote the existing primary account.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-[11px] space-y-1">
              <div><span className="font-semibold text-slate-700">Bank:</span> {targetAccountToSetPrimary.bankName}</div>
              <div><span className="font-semibold text-slate-700">Branch:</span> {targetAccountToSetPrimary.branchName}</div>
              <div><span className="font-semibold text-slate-700">IFSC:</span> {targetAccountToSetPrimary.ifscCode}</div>
              <div><span className="font-semibold text-slate-700">Balance:</span> ₹{(Number(targetAccountToSetPrimary.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmPrimaryOpen(false);
                  setTargetAccountToSetPrimary(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSetPrimary}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Confirm Set Primary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
