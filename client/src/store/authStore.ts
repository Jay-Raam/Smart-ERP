import { create } from 'zustand';
import { cookieUtils } from '../utils/cookies';
import { showAppToast } from '../utils/handleApiError';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Staff' | 'Viewer' | 'owner' | 'viewer';

export interface UserRoleAssignment {
  organisationId: string;
  organisationName: string;
  branchId: string;
  branchName: string;
  roleName: string;
  userType: string;
}

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  schemaName: string;
  tier: string;
  status: string;
}

export const AVAILABLE_TENANTS: TenantConfig[] = [
  { id: 'acme', slug: 'acme', name: 'Acme Corp', schemaName: 'tenant_acme', tier: 'ENTERPRISE', status: 'active' },
  { id: 'globex', slug: 'globex', name: 'Globex Intl', schemaName: 'tenant_globex', tier: 'SCALE', status: 'active' },
  { id: 'initech', slug: 'initech', name: 'Initech Labs', schemaName: 'tenant_initech', tier: 'PRO', status: 'active' },
];

export interface UserSession {
  userId: string;
  userName: string;
  email: string;
  role: UserRole;
  userType?: string;
  organisationId: string;
  organisationName: string;
  branchId: string;
  branchName: string;
  permissions: string[];
  userPermissions?: Record<string, { view?: boolean; add?: boolean; edit?: boolean; delete?: boolean; history?: boolean; approve?: boolean }>;
  roles: UserRoleAssignment[];
}

interface AuthState {
  isAuthenticated: boolean;
  isSessionValidated: boolean;
  token: string | null;
  user: UserSession;
  currentTenant: TenantConfig;
  switchTenant: (id: string) => void;
  checkSession: () => boolean;
  validateSession: () => Promise<boolean>;
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (data: {
    email: string;
    userName?: string;
    role?: UserRole;
    branchId: string;
    branchName: string;
    organisationId: string;
  }) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setBranch: (branchId: string, branchName: string) => void;
  setRoles: (roles: UserRoleAssignment[]) => void;
}

// Ensure secret token is NEVER stored in localStorage
localStorage.removeItem('token');
localStorage.removeItem('userType');
localStorage.removeItem('UserID');
localStorage.removeItem('userName');
localStorage.removeItem('userEmail');

// Strictly verify session from cookies (if cookie deleted, user is unauthenticated)
const savedCookieToken = cookieUtils.get('authToken');
const savedBranchId = localStorage.getItem('Branch') || '';
const savedBranchName = localStorage.getItem('BranchName') || '';
const savedOrgId = localStorage.getItem('OrganizationId') || '';

const initialEmptyUser: UserSession = {
  userId: '',
  userName: '',
  email: '',
  role: 'Viewer',
  organisationId: savedOrgId,
  organisationName: 'Smart Enterprise Industries Ltd.',
  branchId: savedBranchId,
  branchName: savedBranchName,
  permissions: [],
  userPermissions: {},
  roles: [],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!savedCookieToken,
  isSessionValidated: false,
  token: savedCookieToken || null,
  currentTenant: AVAILABLE_TENANTS[0],
  switchTenant: (id: string) => {
    const t = AVAILABLE_TENANTS.find((x) => x.id === id) || AVAILABLE_TENANTS[0];
    set({ currentTenant: t });
    showAppToast(`Switched schema to ${t.schemaName}`, 'info');
  },
  checkSession: () => {
    const token = cookieUtils.get('authToken');
    if (!token) {
      if (get().isAuthenticated) {
        get().logout();
      }
      return false;
    }
    return true;
  },

  validateSession: async () => {
    const token = cookieUtils.get('authToken');
    if (!token) {
      if (get().isAuthenticated) {
        get().logout();
      }
      return false;
    }

    try {
      const res = await fetch('/api/erp/auth/me');
      if (!res.ok) {
        get().logout();
        return false;
      }

      const data = await res.json();
      if (!data.success || !data.user) {
        get().logout();
        return false;
      }

      const isSuperAdmin = data.user.role === 'SuperAdmin' || data.user.userType === 'SUPER_ADMIN';
      const userSession: UserSession = {
        userId: data.user.userId || data.user.id,
        userName: data.user.userName || data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        userType: data.user.userType,
        organisationId: data.user.organisationId,
        organisationName: data.user.organisationName || 'Smart Enterprise Industries Ltd.',
        branchId: data.user.branchId,
        branchName: data.user.branchName,
        permissions: isSuperAdmin ? ['*'] : [],
        userPermissions: data.user.permissions || {},
        roles: data.user.roles || [],
      };

      set({
        isAuthenticated: true,
        token,
        user: userSession,
        isSessionValidated: true,
      });

      return true;
    } catch (err) {
      get().logout();
      return false;
    }
  },

  user: initialEmptyUser,

  loginWithCredentials: async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/erp/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid credentials. Please verify your email/mobile and password.',
        };
      }

      const token = data.token;
      // Secret token is saved ONLY in cookies (NEVER in localStorage)
      cookieUtils.set('authToken', token, 7);

      // Operational branch context saved in localStorage (NO role or permissions stored)
      if (data.user.organisationId) localStorage.setItem('OrganizationId', data.user.organisationId);
      if (data.user.branchId) localStorage.setItem('Branch', data.user.branchId);
      if (data.user.branchName) localStorage.setItem('BranchName', data.user.branchName);
      if (!localStorage.getItem('FinancialYear')) {
        localStorage.setItem('FinancialYear', '2026-2027');
      }

      const isSuperAdmin = data.user.role === 'SuperAdmin' || data.user.userType === 'SUPER_ADMIN';
      const userSession: UserSession = {
        userId: data.user.userId || data.user.id,
        userName: data.user.userName || data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        userType: data.user.userType,
        organisationId: data.user.organisationId,
        organisationName: data.user.organisationName || 'Smart Enterprise Industries Ltd.',
        branchId: data.user.branchId,
        branchName: data.user.branchName,
        permissions: isSuperAdmin ? ['*'] : [],
        userPermissions: data.user.permissions || {},
        roles: data.user.roles || [],
      };

      set({
        isAuthenticated: true,
        token,
        user: userSession,
        isSessionValidated: true,
      });

      showAppToast(`Welcome back, ${data.user.userName}! Authenticated successfully.`, 'success');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Server connection error. Please try again.',
      };
    }
  },

  login: (data) => {
    const token = `jwt_token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cookieUtils.set('authToken', token, 7);

    localStorage.setItem('UserID', '');
    localStorage.setItem('userName', data.userName || '');
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userType', data.role || 'Staff');
    localStorage.setItem('OrganizationId', data.organisationId || '');
    localStorage.setItem('Branch', data.branchId || '');

    set({
      isAuthenticated: true,
      token,
      user: {
        userId: '',
        userName: data.userName || '',
        email: data.email,
        role: data.role || 'Staff',
        organisationId: data.organisationId || '',
        organisationName: '',
        branchId: data.branchId || '',
        branchName: data.branchName || '',
        permissions: (data.role || 'Staff') === 'SuperAdmin' ? ['*'] : ['sales:*', 'invoices:*'],
        roles: [],
      },
    });

    showAppToast(`Welcome back, ${data.userName || 'User'}!`, 'success');
  },

  logout: () => {
    cookieUtils.remove('authToken');
    localStorage.removeItem('token');
    fetch('/api/erp/auth/logout', { method: 'POST' }).catch(() => {});

    set({
      isAuthenticated: false,
      token: null,
      user: {
        userId: '',
        userName: '',
        email: '',
        role: 'Viewer',
        organisationId: '',
        organisationName: 'Smart Enterprise Industries Ltd.',
        branchId: '',
        branchName: '',
        permissions: [],
        roles: [],
      },
    });

    showAppToast('You have been logged out safely.', 'info');
  },

  setRole: (role: UserRole) => {
    localStorage.setItem('userType', role);
    set((state) => ({
      user: {
        ...state.user,
        role,
        permissions: role === 'SuperAdmin' ? ['*'] : ['sales:read', 'invoices:read', 'store:read'],
      },
    }));
    showAppToast(`Role updated to ${role}`, 'info');
  },

  setBranch: (branchId: string, branchName: string) => {
    localStorage.setItem('Branch', branchId);
    localStorage.setItem('BranchName', branchName);
    set((state) => ({
      user: {
        ...state.user,
        branchId,
        branchName,
      },
    }));
  },

  setRoles: (roles: UserRoleAssignment[]) => {
    set((state) => ({
      user: {
        ...state.user,
        roles,
      },
    }));
  },
}));
