'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import type { Pengguna, Praktikum } from '@/types/database';
import type { Role } from '@/config/rbac';

type UserWithEmail = Pengguna & { email: string };

type Props =
  | {
      open: boolean;
      onOpenChange: (v: boolean) => void;
      mode: 'create';
      user?: never;
      onSuccess: () => void;
    }
  | {
      open: boolean;
      onOpenChange: (v: boolean) => void;
      mode: 'edit';
      user: UserWithEmail;
      onSuccess: () => void;
    };

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'ASLAB', label: 'Asisten Laboratorium' },
  { value: 'ASPRAK_KOOR', label: 'Koordinator Asprak' },
];

export function ManajemenAkunFormModal({ open, onOpenChange, mode, user, onSuccess }: Props) {
  const [state, updateState] = React.useReducer(
    (prev: any, next: any) => typeof next === 'function' ? { ...prev, ...next(prev) } : { ...prev, ...next },
    {
      nama: '', email: '', password: '', showPassword: false, role: 'ASPRAK_KOOR', isLoading: false,
      praktikumList: [], tahunAjaranList: [], selectedTahun: '', selectedPraktikumId: '', loadingPraktikum: false
    }
  );
  const { nama, email, password, showPassword, role, isLoading, praktikumList, tahunAjaranList, selectedTahun, selectedPraktikumId, loadingPraktikum } = state;

  
  
  
  
  
  

  // ASPRAK_KOOR — a koordinator handles exactly 1 praktikum
  
  
  
   // single
  

  /* ── Load praktikum list once per dialog open ── */
  React.useEffect(() => {
    if (!open) return;

    // Reset form fields
    updateState({
      nama: user?.nama_lengkap ?? '',
      email: user?.email ?? '',
      password: '',
      showPassword: false,
      role: user?.role ?? 'ASPRAK_KOOR',
      praktikumList: [],
      tahunAjaranList: [],
      selectedTahun: '',
      selectedPraktikumId: ''
    });

    // Fetch praktikum + existing assignment if ASPRAK_KOOR
    const shouldFetch = (user?.role ?? 'ASPRAK_KOOR') === 'ASPRAK_KOOR';
    if (!shouldFetch) return;

    updateState({ loadingPraktikum: true });
    const controller = new AbortController();

    const loadData = async () => {
      try {
        // 1. Fetch all praktikum
        // eslint-disable-next-line react-doctor/no-fetch-in-effect
        const pRes = await fetch('/api/praktikum?action=all', { signal: controller.signal });
        const pJson = await pRes.json();
        if (controller.signal.aborted) return;

        let list: Praktikum[] = [];
        let tahuns: string[] = [];
        if (pJson.ok && pJson.data) {
          list = pJson.data;
          tahuns = Array.from(new Set(list.map((p: Praktikum) => p.tahun_ajaran)))
            .sort()
            .reverse() as string[];
        }

        // 2. Fetch existing assignment for this user (edit mode)
        let existingPraktikumId = '';
        let existingTahun = tahuns[0] ?? '';
        if (mode === 'edit' && user?.id) {
          // eslint-disable-next-line react-doctor/no-fetch-in-effect
          const aRes = await fetch(`/api/admin/users/assignments?id_pengguna=${user.id}`, { signal: controller.signal });
          const aJson = await aRes.json();
          if (!controller.signal.aborted && aJson.ok && aJson.data?.length > 0) {
            existingPraktikumId = aJson.data[0].id_praktikum ?? '';
            existingTahun = aJson.data[0].tahun_ajaran ?? tahuns[0] ?? '';
          }
        }

        if (!controller.signal.aborted) {
          updateState({
            praktikumList: list,
            tahunAjaranList: tahuns,
            selectedTahun: existingTahun,
            selectedPraktikumId: existingPraktikumId
          });
        }
      } catch (e: any) {
        if (!controller.signal.aborted) toast.error('Gagal memuat data praktikum');
      } finally {
        if (!controller.signal.aborted) updateState({ loadingPraktikum: false });
      }
    };

    loadData();
    return () => {
      controller.abort();
    };
    // Only re‑run when `open` changes — deliberate: avoids the setState→useEffect loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── Re-fetch praktikum when user explicitly switches role to ASPRAK_KOOR ── */
  React.useEffect(() => {
    if (!open || role !== 'ASPRAK_KOOR' || praktikumList.length > 0 || loadingPraktikum) return;

    updateState({ loadingPraktikum: true });
    const controller = new AbortController();

    // eslint-disable-next-line react-doctor/no-fetch-in-effect
    fetch('/api/praktikum?action=all', { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted) return;
        if (json.ok && json.data) {
          const list: Praktikum[] = json.data;
          const tahuns = Array.from(new Set(list.map((p) => p.tahun_ajaran)))
            .sort()
            .reverse() as string[];
          updateState({
            praktikumList: list,
            tahunAjaranList: tahuns,
            ...(tahuns.length > 0 ? { selectedTahun: tahuns[0] } : {})
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) toast.error('Gagal memuat data praktikum')
      })
      .finally(() => {
        if (!controller.signal.aborted) updateState({ loadingPraktikum: false });
      });

    return () => {
      controller.abort();
    };
    // intentionally only depends on role changing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filteredPraktikum = React.useMemo(
    () => praktikumList.filter((p: any) => p.tahun_ajaran === selectedTahun),
    [praktikumList, selectedTahun]
  );

  async function handleSubmit(_e: React.FormEvent) {
    _e.preventDefault();
    updateState({ isLoading: true });

    try {
      if (mode === 'create') {
        if (role === 'ASPRAK_KOOR' && !selectedPraktikumId) {
          toast.error('Pilih 1 praktikum untuk Koordinator Asprak');
          updateState({ isLoading: false });
          return;
        }

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            nama_lengkap: nama,
            role,
            // tahun_ajaran is derived from id_praktikum via join — not stored in asprak_koordinator
            praktikum_ids: role === 'ASPRAK_KOOR' ? [selectedPraktikumId] : undefined,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        toast.success(`Akun "${nama}" berhasil dibuat.`);
      } else {
        if (role === 'ASPRAK_KOOR' && !selectedPraktikumId) {
          toast.error('Pilih 1 praktikum untuk Koordinator Asprak');
          updateState({ isLoading: false });
          return;
        }

        const payload: any = { nama_lengkap: nama, role };
        if (role === 'ASPRAK_KOOR') {
          payload.praktikum_ids = [selectedPraktikumId];
          // tahun_ajaran is derived from id_praktikum — not sent
        }

        const res = await fetch(`/api/admin/users/${user!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        toast.success(`Akun "${nama}" berhasil diperbarui.`);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      updateState({ isLoading: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tambah Akun Baru' : 'Edit Akun'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Buat akun pengguna baru. Pastikan email dan kata sandi valid.'
              : 'Perbarui nama atau role pengguna ini.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="akun-nama">Nama Lengkap</Label>
            <Input
              id="akun-nama"
              value={nama}
              onChange={(e) => updateState({ nama: e.target.value })}
              required
              disabled={isLoading}
              placeholder="Nama Lengkap"
            />
          </div>

          {mode === 'create' && (
            <>
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="akun-email">Email</Label>
                <Input
                  id="akun-email"
                  type="email"
                  value={email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="email@contoh.com"
                  autoComplete="off"
                />
              </div>

              {/* Password with visibility toggle */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="akun-password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="akun-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => updateState({ password: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => updateState((prev: any) => ({ showPassword: !prev.showPassword }))}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="akun-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                updateState({ role: v as Role });
                updateState({ selectedPraktikumId: '' });
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="akun-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ASPRAK_KOOR: Single Praktikum Assignment */}
          {role === 'ASPRAK_KOOR' && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Assignment Praktikum
                </p>
                {loadingPraktikum && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Tahun Ajaran */}
              <div className="flex flex-col gap-1.5">
                <Label>Tahun Ajaran</Label>
                <Select
                  value={selectedTahun}
                  onValueChange={(v) => {
                    updateState({ selectedTahun: v });
                    updateState({ selectedPraktikumId: '' }); // clear selection when changing year
                  }}
                  disabled={isLoading || loadingPraktikum || tahunAjaranList.length === 0}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunAjaranList.map((t: any) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Praktikum — single select via radio-style list */}
              <div className="flex flex-col gap-1.5">
                <Label>Nama Praktikum *</Label>
                {loadingPraktikum ? (
                  <p className="text-sm text-muted-foreground py-2">Memuat...</p>
                ) : filteredPraktikum.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Tidak ada praktikum di tahun ini
                  </p>
                ) : (
                  <RadioGroup
                    value={selectedPraktikumId}
                    onValueChange={(val) => updateState({ selectedPraktikumId: val })}
                    className="space-y-2 max-h-60 overflow-y-auto pr-1"
                  >
                    {filteredPraktikum.map((p: any) => (
                      <FieldLabel key={p.id} htmlFor={`p-${p.id}`} className="cursor-pointer">
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle>{p.nama}</FieldTitle>
                            <FieldDescription>ID: {p.id.substring(0, 8)}...</FieldDescription>
                          </FieldContent>
                          <RadioGroupItem value={p.id} id={`p-${p.id}`} disabled={isLoading} />
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === 'create' ? (
                'Buat Akun'
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
