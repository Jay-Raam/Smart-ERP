import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading operational data...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
      <Loader2 className={`${sizeMap[size]} animate-spin text-blue-600`} />
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="w-full animate-pulse p-4 space-y-3">
      {/* Table Header Bar */}
      <div className="h-9 bg-slate-200/70 rounded-lg w-full mb-4" />

      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b border-slate-100">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-slate-100 rounded"
              style={{ width: `${Math.max(40, 100 - c * 10)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
