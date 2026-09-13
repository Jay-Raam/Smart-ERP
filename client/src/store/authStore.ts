import { create } from 'zustand';
import { cookieUtils } from '../utils/cookies';
import { showAppToast } from '../utils/handleApiError';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Staff' | 'Viewer' | 'owner' | 'viewer';

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
  organisationId: string;
  organisationName: string;
  branchId: string;
  branchName: string;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserSession;
  currentTenant: TenantConfig;
  switchTenant: (id: string) => void;
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
}

// Check initial session from cookies or localStorage
const savedToken = cookieUtils.get('authToken') || localStorage.getItem('token');
const savedUser = localStorage.getItem('userName') || 'Jay Raam';
const savedRole = (localStorage.getItem('userType') as UserRole) || 'SuperAdmin';
const savedBranchId = localStorage.getItem('Branch') || '6aa641dd0aaf856b62c3b7dd';
const savedBranchName = localStorage.getItem('BranchName') || 'Chennai Central HQ & Assembly Plant';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!savedToken,
  token: savedToken || null,
  currentTenant: AVAILABLE_TENANTS[0],
  switchTenant: (id: string) => {
    const t = AVAILABLE_TENANTS.find((x) => x.id === id) || AVAILABLE_TENANTS[0];
    set({ currentTenant: t });
    showAppToast(`Switched schema to ${t.schemaName}`, 'info');
  },
  user: {
    userId: localStorage.getItem('UserID') || '6aa641dd0aaf856b62c3b7e1',
    userName: savedUser,
    email: localStorage.getItem('userEmail') || 'jay.raam@smart.com',
    role: savedRole,
    organisationId: localStorage.getItem('OrganizationId') || '6aa641dd0aaf856b62c3b7da',
    organisationName: 'Smart Enterprise Industries Ltd.',
    branchId: savedBranchId,
    branchName: savedBranchName,
    permissions: savedRole === 'SuperAdmin' ? ['*'] : ['sales:*', 'invoices:*', 'store:read'],
  },

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
      cookieUtils.set('authToken', token, 7);

      localStorage.setItem('token', token);
      localStorage.setItem('UserID', data.user.userId);
      localStorage.setItem('userName', data.user.userName);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userType', data.user.role);
      localStorage.setItem('OrganizationId', data.user.organisationId);
      localStorage.setItem('Branch', data.user.branchId);
      localStorage.setItem('BranchName', data.user.branchName);

      set({
        isAuthenticated: true,
        token,
        user: {
          userId: data.user.userId,
          userName: data.user.userName,
          email: data.user.email,
          role: data.user.role as UserRole,
          organisationId: data.user.organisationId,
          organisationName: 'Smart Enterprise Industries Ltd.',
          branchId: data.user.branchId,
          branchName: data.user.branchName,
          permissions: data.user.role === 'SuperAdmin' ? ['*'] : ['sales:*', 'invoices:*', 'store:read'],
        },
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

    localStorage.setItem('token', token);
    localStorage.setItem('UserID', '6aa641dd0aaf856b62c3b7e1');
    localStorage.setItem('userName', data.userName || 'Jay Raam');
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userType', data.role || 'SuperAdmin');
    localStorage.setItem('OrganizationId', data.organisationId || '6aa641dd0aaf856b62c3b7da');
    localStorage.setItem('Branch', data.branchId || '6aa641dd0aaf856b62c3b7dd');

    set({
      isAuthenticated: true,
      token,
      user: {
        userId: '6aa641dd0aaf856b62c3b7e1',
        userName: data.userName || 'Jay Raam',
        email: data.email,
        role: data.role || 'SuperAdmin',
        organisationId: data.organisationId || '6aa641dd0aaf856b62c3b7da',
        organisationName: 'Smart Enterprise Industries Ltd.',
        branchId: data.branchId || '6aa641dd0aaf856b62c3b7dd',
        branchName: data.branchName || 'Chennai Central HQ & Assembly Plant',
        permissions: (data.role || 'SuperAdmin') === 'SuperAdmin' ? ['*'] : ['sales:*', 'invoices:*'],
      },
    });

    showAppToast(`Welcome back, ${data.userName || 'Jay Raam'}!`, 'success');
  },

  logout: () => {
    cookieUtils.remove('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('UserID');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('OrganizationId');
    localStorage.removeItem('Branch');

    set({
      isAuthenticated: false,
      token: null,
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
    set((state) => ({
      user: {
        ...state.user,
        branchId,
        branchName,
      },
    }));
  },
}));
