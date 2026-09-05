'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useTermStore } from '@/store/useTermStore';

type AccessRequestUser = Pengguna & { email: string; auth_created_at?: string };

interface ApproveRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AccessRequestUser | null;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: 'ASPRAK', label: 'Asisten Praktikum', desc: 'Akses modul & pelaksanaan kegiatan praktikum yang ditugaskan' },
  { value: 'ASPRAK_KOOR', label: 'Koordinator Asprak', desc: 'Monitoring & pelanggaran mata praktikum terkait' },
  { value: 'ASLAB', label: 'Asisten Laboratorium', desc: 'Akses penuh fitur operasional praktikum & modul' },
  { value: 'ADMIN', label: 'Administrator', desc: 'Akses penuh seluruh sistem dan manajemen akun' },
];

export function ApproveRequestModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ApproveRequestModalProps) {
  const [role, setRole] = React.useState<Role>('ASLAB');
  const [isLoading, setIsLoading] = React.useState(false);
  const [praktikumList, setPraktikumList] = React.useState<Praktikum[]>([]);
  const [selectedPraktikumId, setSelectedPraktikumId] = React.useState<string>('');
  const [loadingPraktikum, setLoadingPraktikum] = React.useState(false);
  const { activeTerm } = useTermStore();

  React.useEffect(() => {
    if (!open || !user) return;

    setRole('ASLAB');
    setSelectedPraktikumId('');

    async function fetchPraktikum() {
      setLoadingPraktikum(true);
      try {
        const res = await fetch('/api/praktikum?action=all');
        const json = await res.json();
        if (json.ok && json.data) {
          setPraktikumList(json.data);
        }
      } catch (err) {
        console.error('Failed to load praktikum:', err);
      } finally {
        setLoadingPraktikum(false);
      }
    }

    fetchPraktikum();
  }, [open, user]);

  const filteredPraktikum = React.useMemo(() => {
    if (!activeTerm) return praktikumList;
    const termMatches = praktikumList.filter((p) => p.tahun_ajaran === activeTerm);
    return termMatches.length > 0 ? termMatches : praktikumList;
  }, [praktikumList, activeTerm]);

  async function handleApprove() {
    if (!user) return;

    if (role === 'ASPRAK_KOOR' && !selectedPraktikumId) {
      toast.error('Harap pilih mata praktikum untuk Koordinator Asprak.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          praktikum_ids: selectedPraktikumId ? [selectedPraktikumId] : [],
        }),
      });

      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || 'Gagal menyetujui akun.');
      }

      toast.success(`Akun "${user.nama_lengkap}" berhasil disetujui.`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Setujui Permintaan Akses</DialogTitle>
          <DialogDescription>
            Tentukan peran untuk akun <strong>{user.nama_lengkap}</strong> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pilih Peran</Label>
            <RadioGroup
              value={role}
              onValueChange={(val) => setRole(val as Role)}
              className="gap-2"
            >
              {ROLE_OPTIONS.map((opt) => (
                <FieldLabel key={opt.value} htmlFor={`role-${opt.value}`}>
                  <Field orientation="horizontal">
                    <RadioGroupItem value={opt.value} id={`role-${opt.value}`} />
                    <FieldContent>
                      <FieldTitle>{opt.label}</FieldTitle>
                      <FieldDescription>{opt.desc}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </div>

          {/* Praktikum picker for ASPRAK_KOOR */}
          {role === 'ASPRAK_KOOR' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mata Praktikum Binaan</Label>
              {loadingPraktikum ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Spinner className="h-4 w-4" /> Memuat...
                </div>
              ) : (
                <Select value={selectedPraktikumId} onValueChange={setSelectedPraktikumId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih praktikum..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPraktikum.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} ({p.tahun_ajaran})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading ? <Spinner className="h-4 w-4" /> : null}
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
