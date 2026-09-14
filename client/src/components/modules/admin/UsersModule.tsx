import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Key,
  History,
  Lock,
  UserCheck,
  UserX,
  X,
  Users as UsersIcon,
  Building2,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { useErpStore } from '../../../store/erpStore';
import { useAuthStore } from '../../../store/authStore';
import { showAppToast } from '../../../utils/handleApiError';
import { usePermissions } from '../../../hooks/usePermissions';

export interface UserModulePermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  history: boolean;
  approve: boolean;
}

export interface UserItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  userType: string;
  branchId: string;
  branchName: string;
  organisationId: string;
  permissions?: Record<string, UserModulePermission>;
  createdAt?: string;
  updatedAt?: string;
}

const ERP_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'customers', label: 'Customers' },
  { key: 'invoices', label: 'Tax Invoices' },
  { key: 'purchase', label: 'Purchase Orders' },
  { key: 'bills', label: 'Vendor Bills' },
  { key: 'store', label: 'Store & Stock' },
  { key: 'products', label: 'Products Master' },
  { key: 'delivery', label: 'Delivery Challans' },
  { key: 'branches', label: 'Branches & Hubs' },
  { key: 'financial-years', label: 'Financial Years' },
  { key: 'bank', label: 'Bank Accounts' },
  { key: 'transactions', label: 'Transactions Ledger' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'users', label: 'Users & Roles' },
];

const PERMISSION_COLUMNS: { key: keyof UserModulePermission; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'add', label: 'Add' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'history', label: 'History' },
  { key: 'approve', label: 'Approve' },
];

export const UsersModule: React.FC = () => {
  const { branches } = useErpStore();
  const { user: currentUser } = useAuthStore();
  const { canAdd, canEdit, canApprove, canHistory } = usePermissions('users');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    rolesBreakdown: {} as Record<string, number>,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPermDrawerOpen, setIsPermDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Add Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'Staff',
    userType: 'STAFF',
    branchId: '',
    branchName: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permissions Drawer State
  const [currentPerms, setCurrentPerms] = useState<Record<string, UserModulePermission>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/erp/users?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load users');
      }
      const data = await res.json();
      setUsers(data.users || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      showAppToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Status Toggle
  const handleToggleStatus = async (userItem: UserItem) => {
    const nextStatus = userItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/erp/users/${userItem.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      showAppToast(data.message || `User marked as ${nextStatus}`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, status: nextStatus } : u))
      );
      setStats((prev) => ({
        ...prev,
        activeUsers: nextStatus === 'ACTIVE' ? prev.activeUsers + 1 : prev.activeUsers - 1,
        inactiveUsers: nextStatus === 'INACTIVE' ? prev.inactiveUsers + 1 : prev.inactiveUsers - 1,
      }));
    } catch (err: any) {
      showAppToast(err.message, 'error');
    }
  };

  // Open Permissions Matrix Drawer
  const handleOpenPermissions = (u: UserItem) => {
    setSelectedUser(u);
    const existing = u.permissions || {};
    const initialized: Record<string, UserModulePermission> = {};

    ERP_MODULES.forEach((m) => {
      initialized[m.key] = {
        view: existing[m.key]?.view ?? false,
        add: existing[m.key]?.add ?? false,
        edit: existing[m.key]?.edit ?? false,
        delete: existing[m.key]?.delete ?? false,
        history: existing[m.key]?.history ?? false,
        approve: existing[m.key]?.approve ?? false,
      };
    });

    setCurrentPerms(initialized);
    setIsPermDrawerOpen(true);
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      setIsSavingPerms(true);
      const res = await fetch(`/api/erp/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: currentPerms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save permissions');

      showAppToast('Permissions successfully updated', 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, permissions: currentPerms } : u))
      );
      setIsPermDrawerOpen(false);
    } catch (err: any) {
      showAppToast(err.message, 'error');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Open Audit History Drawer
  const handleOpenHistory = async (u: UserItem) => {
    setSelectedUser(u);
    setIsHistoryDrawerOpen(true);
    try {
      setIsLoadingHistory(true);
      const res = await fetch(`/api/erp/users/${u.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.history || []);
      }
    } catch (err: any) {
      showAppToast('Failed to load history', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Permission Matrix Helpers
  const handleToggleCell = (modKey: string, action: keyof UserModulePermission) => {
    setCurrentPerms((prev) => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        [action]: !prev[modKey]?.[action],
      },
    }));
  };

  const handleToggleRow = (modKey: string) => {
    const row = currentPerms[modKey] || { view: false, add: false, edit: false, delete: false, history: false, approve: false };
    const allChecked = PERMISSION_COLUMNS.every((c) => row[c.key]);
    const nextVal = !allChecked;

    setCurrentPerms((prev) => ({
      ...prev,
      [modKey]: {
        view: nextVal,
        add: nextVal,
        edit: nextVal,
        delete: nextVal,
        history: nextVal,
        approve: nextVal,
      },
    }));
  };

  const handleToggleColumn = (action: keyof UserModulePermission) => {
    const allChecked = ERP_MODULES.every((m) => currentPerms[m.key]?.[action]);
    const nextVal = !allChecked;

    setCurrentPerms((prev) => {
      const updated = { ...prev };
      ERP_MODULES.forEach((m) => {
        updated[m.key] = {
          ...updated[m.key],
          [action]: nextVal,
        };
      });
      return updated;
    });
  };

  const handleGrantFullAccess = () => {
    const full: Record<string, UserModulePermission> = {};
    ERP_MODULES.forEach((m) => {
      full[m.key] = { view: true, add: true, edit: true, delete: true, history: true, approve: true };
    });
    setCurrentPerms(full);
  };

  const handleGrantReadOnly = () => {
    const ro: Record<string, UserModulePermission> = {};
    ERP_MODULES.forEach((m) => {
      ro[m.key] = { view: true, add: false, edit: false, delete: false, history: false, approve: false };
    });
    setCurrentPerms(ro);
  };

  const handleRevokeAll = () => {
    const none: Record<string, UserModulePermission> = {};
    ERP_MODULES.forEach((m) => {
      none[m.key] = { view: false, add: false, edit: false, delete: false, history: false, approve: false };
    });
    setCurrentPerms(none);
  };

  // Add User Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile) errors.mobile = 'Mobile number is required';
    else if (cleanMobile.length < 10) errors.mobile = 'Mobile must be at least 10 digits';

    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const branchObj = branches.find((b) => b.id === formData.branchId) || branches[0];
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: cleanMobile,
        password: formData.password,
        role: formData.role,
        userType: formData.role === 'SuperAdmin' ? 'SUPER_ADMIN' : 'STAFF',
        branchId: branchObj?.id || 'BR-CHN-01',
        branchName: branchObj?.name || 'Chennai HQ - Guindy',
        organisationId: 'ORG-001',
      };

      const res = await fetch('/api/erp/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      showAppToast('User account created successfully', 'success');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        role: 'Staff',
        userType: 'STAFF',
        branchId: '',
        branchName: '',
      });
      fetchUsers();
    } catch (err: any) {
      showAppToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Super Admin User Management</h1>
              <p className="text-xs text-slate-500">
                Institutional credentials, multi-branch assignments, security activation, and granular module RBAC
              </p>
            </div>
          </div>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                mobile: '',
                password: '',
                confirmPassword: '',
                role: 'Staff',
                userType: 'STAFF',
                branchId: branches[0]?.id || '',
                branchName: branches[0]?.name || '',
              });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>New User Account</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Registered Users</span>
            <UsersIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cross-branch user directory</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Accounts</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.activeUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Permitted live workspace access</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Deactivated Users</span>
            <UserX className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{stats.inactiveUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Login strictly blocked & revoked</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Super Admins</span>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">
            {stats.rolesBreakdown['SuperAdmin'] || 1}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unrestricted system authority</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Admin">Admin</option>
              <option value="Branch Manager">Branch Manager</option>
              <option value="Staff">Staff</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role & User Type</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {u.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {u.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{u.mobile}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.role === 'SuperAdmin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{u.branchName || 'Chennai HQ'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.email === 'admin@smarterp.com' || currentUser?.userId === u.id || !canApprove}
                        title={
                          !canApprove
                            ? 'Requires Approve permission to change user status'
                            : u.email === 'admin@smarterp.com'
                            ? 'Primary SuperAdmin cannot be deactivated'
                            : currentUser?.userId === u.id
                            ? 'Cannot deactivate your own session'
                            : 'Click to toggle status'
                        }
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            u.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
                        {u.status}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissions(u)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition cursor-pointer"
                            title="Configure Granular RBAC Permissions"
                          >
                            <Key className="h-3 w-3" />
                            <span>Permissions</span>
                          </button>
                        )}
                        {canHistory && (
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(u)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition cursor-pointer"
                            title="Audit History"
                          >
                            <History className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New User Account</h3>
                  <p className="text-xs text-slate-500">Provide credentials and branch role assignments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formErrors.name && <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="ramesh@smarterp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {formErrors.email && <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  {formErrors.mobile && <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.mobile}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {formErrors.password && <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-rose-600 text-[11px] mt-0.5">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Viewer">Viewer</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Assignment *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2.5 text-[11px] text-blue-800 flex items-start gap-1.5">
                <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Passwords are securely hashed using bcrypt (10 rounds). Confirm password is strictly validated on client and never stored.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Granular Permission Matrix (Modeled after RoleManagementAdd.jsx) */}
      {isPermDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Granular Module Permissions</h3>
                    <p className="text-xs text-slate-500">
                      User: <span className="font-semibold text-slate-800">{selectedUser.name}</span> ({selectedUser.email}) &bull;{' '}
                      <span className="font-mono text-purple-700 font-bold">{selectedUser.role}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPermDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={handleGrantFullAccess}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold cursor-pointer"
                >
                  Grant Full Access
                </button>
                <button
                  type="button"
                  onClick={handleGrantReadOnly}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold cursor-pointer"
                >
                  View Only (Read)
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold cursor-pointer"
                >
                  Revoke All
                </button>
              </div>

              {/* Permission Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">ERP Module</th>
                      {PERMISSION_COLUMNS.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 text-center">
                          <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                            <span className="font-bold text-[11px]">{col.label}</span>
                            <input
                              type="checkbox"
                              checked={ERP_MODULES.every((m) => currentPerms[m.key]?.[col.key])}
                              onChange={() => handleToggleColumn(col.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                            />
                          </label>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center font-bold text-[10px] text-slate-500">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ERP_MODULES.map((mod) => {
                      const row = currentPerms[mod.key] || {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false,
                        history: false,
                        approve: false,
                      };
                      const allChecked = PERMISSION_COLUMNS.every((c) => row[c.key]);

                      return (
                        <tr key={mod.key} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{mod.label}</td>
                          {PERMISSION_COLUMNS.map((col) => (
                            <td key={col.key} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(row[col.key])}
                                onChange={() => handleToggleCell(mod.key, col.key)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                              />
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleRow(mod.key)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer ${
                                allChecked
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {allChecked ? 'Uncheck' : 'Check'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPermDrawerOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPerms}
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
              >
                {isSavingPerms ? 'Saving Changes...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Audit History */}
      {isHistoryDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">User Audit Trail</h3>
                    <p className="text-[11px] text-slate-500">{selectedUser.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-slate-400">Loading audit history...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No recorded audit actions for this user.</div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                        <span className="font-bold text-blue-700">{log.action}</span>
                      </div>
                      <div className="font-medium text-slate-900">Performed by: {log.userName || log.userEmail}</div>
                      {log.newData?.status && (
                        <div className="text-[11px] text-slate-600">
                          Status updated to: <span className="font-bold">{log.newData.status}</span>
                        </div>
                      )}
                      {log.newData?.role && (
                        <div className="text-[11px] text-slate-600">
                          Role updated to: <span className="font-bold">{log.newData.role}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
