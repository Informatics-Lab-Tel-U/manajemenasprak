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
  const [nama, setNama] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState<Role>('ASPRAK_KOOR');
  const [isLoading, setIsLoading] = React.useState(false);

  // ASPRAK_KOOR — a koordinator handles exactly 1 praktikum
  const [praktikumList, setPraktikumList] = React.useState<Praktikum[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = React.useState<string[]>([]);
  const [selectedTahun, setSelectedTahun] = React.useState('');
  const [selectedPraktikumId, setSelectedPraktikumId] = React.useState(''); // single
  const [loadingPraktikum, setLoadingPraktikum] = React.useState(false);

  /* ── Load praktikum list once per dialog open ── */
  React.useEffect(() => {
    if (!open) return;

    // Reset form fields
    setNama(user?.nama_lengkap ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setShowPassword(false);
    setRole(user?.role ?? 'ASPRAK_KOOR');
    setPraktikumList([]);
    setTahunAjaranList([]);
    setSelectedTahun('');
    setSelectedPraktikumId('');

    // Fetch praktikum + existing assignment if ASPRAK_KOOR
    const shouldFetch = (user?.role ?? 'ASPRAK_KOOR') === 'ASPRAK_KOOR';
    if (!shouldFetch) return;

    setLoadingPraktikum(true);
    let cancelled = false;

    const loadData = async () => {
      try {
        // 1. Fetch all praktikum
        const pRes = await fetch('/api/praktikum?action=all');
        const pJson = await pRes.json();
        if (cancelled) return;

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
          const aRes = await fetch(
            `/api/admin/users/assignments?id_pengguna=${user.id}`
          );
          const aJson = await aRes.json();
          if (!cancelled && aJson.ok && aJson.data?.length > 0) {
            existingPraktikumId = aJson.data[0].id_praktikum ?? '';
            existingTahun = aJson.data[0].tahun_ajaran ?? tahuns[0] ?? '';
          }
        }

        if (!cancelled) {
          setPraktikumList(list);
          setTahunAjaranList(tahuns);
          setSelectedTahun(existingTahun);
          setSelectedPraktikumId(existingPraktikumId);
        }
      } catch (e: any) {
        if (!cancelled) toast.error('Gagal memuat data praktikum');
      } finally {
        if (!cancelled) setLoadingPraktikum(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  // Only re‑run when `open` changes — deliberate: avoids the setState→useEffect loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── Re-fetch praktikum when user explicitly switches role to ASPRAK_KOOR ── */
  React.useEffect(() => {
    if (!open || role !== 'ASPRAK_KOOR' || praktikumList.length > 0 || loadingPraktikum) return;

    setLoadingPraktikum(true);
    let cancelled = false;

    fetch('/api/praktikum?action=all')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok && json.data) {
          const list: Praktikum[] = json.data;
          const tahuns = Array.from(new Set(list.map((p) => p.tahun_ajaran)))
            .sort()
            .reverse() as string[];
          setPraktikumList(list);
          setTahunAjaranList(tahuns);
          if (tahuns.length > 0) setSelectedTahun(tahuns[0]);
        }
      })
      .catch(() => toast.error('Gagal memuat data praktikum'))
      .finally(() => { if (!cancelled) setLoadingPraktikum(false); });

    return () => { cancelled = true; };
  // intentionally only depends on role changing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filteredPraktikum = React.useMemo(
    () => praktikumList.filter((p) => p.tahun_ajaran === selectedTahun),
    [praktikumList, selectedTahun]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'create') {
        if (role === 'ASPRAK_KOOR' && !selectedPraktikumId) {
          toast.error('Pilih 1 praktikum untuk Koordinator Asprak');
          setIsLoading(false);
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
          setIsLoading(false);
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
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Akun Baru' : 'Edit Akun'}
          </DialogTitle>
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
              onChange={(e) => setNama(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
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
                setRole(v as Role);
                setSelectedPraktikumId('');
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
                    setSelectedTahun(v);
                    setSelectedPraktikumId(''); // clear selection when changing year
                  }}
                  disabled={isLoading || loadingPraktikum || tahunAjaranList.length === 0}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunAjaranList.map((t) => (
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
                    onValueChange={setSelectedPraktikumId}
                    className="space-y-2 max-h-60 overflow-y-auto pr-1"
                  >
                    {filteredPraktikum.map((p) => (
                      <FieldLabel key={p.id} htmlFor={`p-${p.id}`} className="cursor-pointer">
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle>{p.nama}</FieldTitle>
                            <FieldDescription>
                              ID: {p.id.substring(0, 8)}...
                            </FieldDescription>
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

