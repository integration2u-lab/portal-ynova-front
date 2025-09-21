import { useState, useEffect, useCallback } from 'react';
import { commissionService, GetCommissionsParams } from '../services/commissionService';
import { Commission } from '../types';

export interface UseCommissionsReturn {
  commissions: Commission[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<GetCommissionsParams>) => void;
}

export function useCommissions(initialParams: GetCommissionsParams = {}): UseCommissionsReturn {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [params, setParams] = useState<GetCommissionsParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commissionService.getCommissions(params);
      
      if (response.success) {
        setCommissions(response.data.commissions);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch commissions');
      }
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateFilters = useCallback((newFilters: Partial<GetCommissionsParams>) => {
    setParams(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return {
    commissions,
    loading,
    error,
    pagination,
    refetch: fetchCommissions,
    updateFilters,
  };
}
