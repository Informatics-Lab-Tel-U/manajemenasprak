
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MataKuliah, Praktikum } from '@/types/database';
import { MataKuliahGrouped } from '@/services/mataKuliahService';

export function useMataKuliah() {
  const [loading, setLoading] = useState(false);
  
  const getMataKuliahByTerm = useCallback(async (term: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mata-kuliah?term=${term}`);
      if (!res.ok) throw new Error('Failed to fetch mata kuliah');
      const data: MataKuliahGrouped[] = await res.json();
      return data;
    } catch (error: any) {
      toast.error(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createMataKuliah = useCallback(async (data: any, term: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/mata-kuliah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data, term }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      return json;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkImportMataKuliah = useCallback(async (rows: any[], term: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/mata-kuliah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', data: rows, term }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Bulk import failed');
      return json;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getMataKuliahByTerm,
    createMataKuliah,
    bulkImportMataKuliah
  };
}
