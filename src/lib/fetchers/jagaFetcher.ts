import { JadwalJaga } from '@/types/database';

export async function fetchJadwalJaga(term: string, modul?: number, hari?: string): Promise<{ data?: JadwalJaga[]; error?: string }> {
  try {
    const params = new URLSearchParams({ term });
    if (modul) params.append('modul', modul.toString());
    if (hari) params.append('hari', hari);

    const res = await fetch(`/api/jaga?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch jadwal jaga');
    }

    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function addJadwalJaga(payload: { id_asprak: string; tahun_ajaran: string; modul: number; hari: string; shift: number }): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/jaga', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to add jadwal jaga');
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteJadwalJaga(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/jaga?id=${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete jadwal jaga');
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function fetchRekapJagaAggregated(term: string): Promise<{ data?: any[]; error?: string }> {
  try {
    const res = await fetch(`/api/jaga/rekap?term=${term}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch rekap jaga');
    }

    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}
