import React from 'react';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  hasPermission: boolean;
  actionLabel?: string;
  moduleName?: string;
  fallbackMode?: 'hide' | 'disable';
  children: React.ReactNode;
  className?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  hasPermission,
  actionLabel = 'perform this action',
  moduleName = 'this module',
  fallbackMode = 'hide',
  children,
  className = '',
}) => {
  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallbackMode === 'hide') {
    return null;
  }

  return (
    <div
      className={`relative group inline-block cursor-not-allowed ${className}`}
      title={`Permission required: You lack permission to ${actionLabel} in ${moduleName}.`}
    >
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="hidden group-hover:flex items-center gap-1 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
        <Lock className="w-3 h-3 text-amber-400" />
        <span>Requires {actionLabel} permission</span>
      </div>
    </div>
  );
};
