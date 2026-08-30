'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, Building2 } from 'lucide-react';
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
  { value: 'ASLAB', label: 'Asisten Laboratorium', desc: 'Akses penuh fitur operasional praktikum & modul' },
  { value: 'ASPRAK_KOOR', label: 'Koordinator Asprak', desc: 'Akses terbatas untuk monitoring & pelanggaran mata praktikum terkait' },
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
      toast.error('Harap pilih mata praktikum binaan untuk Koordinator Asprak.');
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

      toast.success(`Akun "${user.nama_lengkap}" berhasil disetujui sebagai ${role}.`);
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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserCheck className="h-5 w-5 text-emerald-500" />
            Setujui Permintaan Akses
          </DialogTitle>
          <DialogDescription>
            Tentukan hak akses dan peran sistem untuk akun yang mendaftar melalui SSO Telkom University.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User Preview Box */}
          <div className="p-3.5 rounded-lg bg-muted/50 border border-border/60 space-y-1">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Akun Microsoft Terverifikasi
            </div>
            <div className="font-semibold text-foreground text-sm">{user.nama_lengkap}</div>
            <div className="font-mono text-xs text-muted-foreground">{user.email}</div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pilih Peran (Role)</Label>
            <RadioGroup
              value={role}
              onValueChange={(val) => setRole(val as Role)}
              className="gap-2.5"
            >
              {ROLE_OPTIONS.map((opt) => (
                <FieldLabel
                  key={opt.value}
                  htmlFor={`role-${opt.value}`}
                  className={`border rounded-lg p-3 cursor-pointer transition-all flex items-start gap-3 ${
                    role === opt.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`role-${opt.value}`} className="mt-0.5" />
                  <FieldContent className="p-0 space-y-0.5">
                    <FieldTitle className="text-sm font-medium leading-none">{opt.label}</FieldTitle>
                    <FieldDescription className="text-xs text-muted-foreground">{opt.desc}</FieldDescription>
                  </FieldContent>
                </FieldLabel>
              ))}
            </RadioGroup>
          </div>

          {/* If Koordinator Asprak -> Pick Practicum */}
          {role === 'ASPRAK_KOOR' && (
            <div className="space-y-2 pt-1">
              <Label className="text-sm font-medium">Pilih Mata Praktikum Binaan</Label>
              {loadingPraktikum ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Spinner className="h-4 w-4" /> Memuat data praktikum...
                </div>
              ) : (
                <Select
                  value={selectedPraktikumId}
                  onValueChange={setSelectedPraktikumId}
                >
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleApprove} disabled={isLoading} className="gap-2">
            {isLoading ? <Spinner className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            Setujui & Berikan Akses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
