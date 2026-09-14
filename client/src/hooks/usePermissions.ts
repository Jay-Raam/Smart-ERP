import { useAuthStore } from '../store/authStore';

export interface ModulePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canHistory: boolean;
  canApprove: boolean;
  isSuperAdmin: boolean;
}

export const usePermissions = (moduleName: string): ModulePermissions => {
  const { user } = useAuthStore();

  const isSuperAdmin = Boolean(
    user?.role?.toLowerCase().replace(/\s+/g, '') === 'superadmin' ||
      user?.userType === 'SUPER_ADMIN' ||
      (user as any)?.isSuperAdmin
  );

  if (isSuperAdmin) {
    return {
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canHistory: true,
      canApprove: true,
      isSuperAdmin: true,
    };
  }

  const perms = ((user?.userPermissions || (user as any)?.permissions) || {}) as Record<string, any>;
  const mod = perms[moduleName] || {};

  return {
    canView: Boolean(mod.view),
    canAdd: Boolean(mod.add),
    canEdit: Boolean(mod.edit),
    canDelete: Boolean(mod.delete),
    canHistory: Boolean(mod.history),
    canApprove: Boolean(mod.approve),
    isSuperAdmin: false,
  };
};
