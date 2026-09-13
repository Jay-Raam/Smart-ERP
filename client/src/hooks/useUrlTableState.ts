import { useState, useEffect, useCallback } from 'react';

export interface UrlTableStateDefaults {
  perPage?: number;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc' | 'A' | 'D';
  statusField?: string;
  filterBy?: string;
}

export function useUrlTableState(defaults: UrlTableStateDefaults = {}) {
  const {
    perPage: defPerPage = 10,
    sortColumn: defSortColumn = '',
    sortOrder: defSortOrder = 'desc',
    statusField = 'status',
    filterBy: defFilterBy = 'All',
  } = defaults;

  const parseParams = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const perPage = Number(searchParams.get('per_page')) || defPerPage;
    const sortColumn = searchParams.get('sort_column') || defSortColumn;
    const sortOrder = (searchParams.get('sort_order') as any) || defSortOrder;
    const search = searchParams.get('search') || '';
    const rawFilter = searchParams.get('filter_by');
    const filterBy = rawFilter ? rawFilter : defFilterBy ? `${statusField}.${defFilterBy}` : 'All';

    return { page, perPage, sortColumn, sortOrder, search, filterBy };
  }, [defPerPage, defSortColumn, defSortOrder, defFilterBy, statusField]);

  const [state, setState] = useState(parseParams);

  // Sync state when URL changes externally (e.g. back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setState(parseParams());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseParams]);

  // Merge updates into the URL and local state
  const patch = useCallback(
    (changes: Partial<{ page: number; per_page: number; sort_column: string; sort_order: string; filter_by: string; search: string }>) => {
      const searchParams = new URLSearchParams(window.location.search);

      Object.entries(changes).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined || value === 'All' || value === 'Status.All' || (key === 'page' && value === 1)) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, String(value));
        }
      });

      const newSearch = searchParams.toString();
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
      window.history.pushState({}, '', newUrl);

      setState(parseParams());
    },
    [parseParams]
  );

  const setPage = useCallback((p: number) => patch({ page: p }), [patch]);
  const setPerPage = useCallback((pp: number) => patch({ per_page: pp, page: 1 }), [patch]);
  const setSearch = useCallback((s: string) => patch({ search: s, page: 1 }), [patch]);
  const setSort = useCallback((column: string, order: 'asc' | 'desc' | 'A' | 'D') => patch({ sort_column: column, sort_order: order, page: 1 }), [patch]);
  const setFilterBy = useCallback((fb: string) => patch({ filter_by: fb, page: 1 }), [patch]);
  const resetFilters = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('page');
    searchParams.delete('per_page');
    searchParams.delete('sort_column');
    searchParams.delete('sort_order');
    searchParams.delete('filter_by');
    searchParams.delete('search');
    const newUrl = `${window.location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}${window.location.hash}`;
    window.history.pushState({}, '', newUrl);
    setState(parseParams());
  }, [parseParams]);

  return {
    page: state.page,
    perPage: state.perPage,
    sortColumn: state.sortColumn,
    sortOrder: state.sortOrder,
    search: state.search,
    filterBy: state.filterBy,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setFilterBy,
    resetFilters,
  };
}
