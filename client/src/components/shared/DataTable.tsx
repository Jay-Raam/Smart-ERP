import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FolderX,
  XCircle,
} from 'lucide-react';
import { TableSkeleton } from './LoadingState';
import { Combobox } from './Combobox';
import { useUrlTableState } from '../../hooks/useUrlTableState';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  statusOptions?: { label: string; value: string }[];
  statusKey?: keyof T | string;
  onReload?: () => Promise<void> | void;
  isLoading?: boolean;
  actions?: React.ReactNode;
  pageSizeDefault?: number;
  syncWithUrl?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  statusOptions,
  statusKey,
  onReload,
  isLoading = false,
  actions,
  pageSizeDefault = 10,
  syncWithUrl = true,
}: DataTableProps<T>) {
  const urlState = useUrlTableState({
    perPage: pageSizeDefault,
    statusField: String(statusKey || 'status'),
  });

  const [searchTerm, setSearchTerm] = useState(syncWithUrl ? urlState.search : '');
  const [selectedStatus, setSelectedStatus] = useState(() => {
    if (!syncWithUrl) return 'ALL';
    const parts = urlState.filterBy.split('.');
    const val = parts.length > 1 ? parts[1] : (parts[0] || 'ALL');
    return val.toUpperCase() === 'ALL' ? 'ALL' : val;
  });
  const [sortColumn, setSortColumn] = useState<string | null>(syncWithUrl ? urlState.sortColumn || null : null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    syncWithUrl && (urlState.sortOrder === 'asc' || urlState.sortOrder === 'A') ? 'asc' : 'desc'
  );
  const [currentPage, setCurrentPage] = useState(syncWithUrl ? urlState.page : 1);
  const [pageSize, setPageSize] = useState(syncWithUrl ? urlState.perPage : pageSizeDefault);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state to URL if enabled
  useEffect(() => {
    if (!syncWithUrl) return;
    urlState.setPage(currentPage);
  }, [currentPage, syncWithUrl]);

  useEffect(() => {
    if (!syncWithUrl) return;
    urlState.setPerPage(pageSize);
  }, [pageSize, syncWithUrl]);

  useEffect(() => {
    if (!syncWithUrl) return;
    urlState.setSearch(searchTerm);
  }, [searchTerm, syncWithUrl]);

  useEffect(() => {
    if (!syncWithUrl) return;
    if (selectedStatus.toUpperCase() === 'ALL') {
      urlState.setFilterBy('All');
    } else {
      urlState.setFilterBy(`${String(statusKey || 'status')}.${selectedStatus}`);
    }
  }, [selectedStatus, statusKey, syncWithUrl]);

  // Trigger reload with animation
  const handleReload = async () => {
    setIsRefreshing(true);
    if (onReload) {
      await onReload();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Sort handler
  const handleSort = (key: string) => {
    const newDir = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(key);
    setSortDirection(newDir);
    if (syncWithUrl) {
      urlState.setSort(key, newDir);
    }
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSortColumn(null);
    setCurrentPage(1);
    if (syncWithUrl) {
      urlState.resetFilters();
    }
  };

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Status Filter
    if (statusKey && selectedStatus && selectedStatus.toUpperCase() !== 'ALL') {
      result = result.filter((item) => String(item[statusKey as string] || '').toLowerCase() === selectedStatus.toLowerCase());
    }

    // 2. Global Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        if (searchKeys.length > 0) {
          return searchKeys.some((key) =>
            String(item[key as string] || '')
              .toLowerCase()
              .includes(term)
          );
        }
        return Object.values(item).some((val) =>
          String(val || '')
            .toLowerCase()
            .includes(term)
        );
      });
    }

    // 3. Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn] ?? '';
        const valB = b[sortColumn] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, statusKey, selectedStatus, searchTerm, searchKeys, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const hasActiveFilters = searchTerm.trim() !== '' || (selectedStatus && selectedStatus.toUpperCase() !== 'ALL');

  return (
    <div className="flex flex-col w-full rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/60">
        {/* Left: Search input + Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px] sm:max-w-xs flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Combobox */}
          {statusOptions && (
            <div className="w-44">
              <Combobox
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Statuses', value: 'ALL' },
                  ...statusOptions,
                ]}
                searchable={false}
              />
            </div>
          )}

          {/* Reset Filters button if filters active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Clear Filter</span>
            </button>
          )}

          {/* Reload / Refresh Button */}
          <button
            type="button"
            onClick={handleReload}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Reload table data"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${
                isRefreshing || isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'
              }`}
            />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* Right: Actions / Buttons */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Content Area */}
      <div className="w-full overflow-x-auto">
        {isLoading || isRefreshing ? (
          <TableSkeleton rows={pageSize > 6 ? 6 : pageSize} columns={columns.length} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {columns.map((col) => {
                  const isSorted = sortColumn === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={`px-4 py-3.5 ${
                        col.sortable !== false
                          ? 'cursor-pointer hover:bg-slate-200/60 transition'
                          : ''
                      } ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'right'
                            ? 'justify-end'
                            : col.align === 'center'
                            ? 'justify-center'
                            : 'justify-start'
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <ArrowUpDown
                            className={`h-3 w-3 ${
                              isSorted ? 'text-blue-600 font-bold' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    {/* Tiaano ERP Style Empty State */}
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 shadow-inner">
                        <FolderX className="h-8 w-8 text-slate-400 stroke-[1.5]" />
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
                        NO DATA FOUND
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 text-center leading-relaxed">
                        There are no records available for the active Branch, Organisation, or Financial Year.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                          >
                            Clear Search / Filter
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleReload}
                          className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition cursor-pointer"
                        >
                          Reload Data
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {processedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, processedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{processedData.length}</span>{' '}
            records
          </span>

          <div className="w-24">
            <Combobox
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { value: '5', label: '5 / page' },
                { value: '10', label: '10 / page' },
                { value: '20', label: '20 / page' },
                { value: '50', label: '50 / page' },
              ]}
              searchable={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}