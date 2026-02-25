'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import type { Pengguna } from '@/types/database';
import type { Role } from '@/config/rbac';

type UserWithEmail = Pengguna & { email: string };

type Props =
  | { open: boolean; onOpenChange: (v: boolean) => void; mode: 'create'; user?: never; onSuccess: () => void }
  | { open: boolean; onOpenChange: (v: boolean) => void; mode: 'edit'; user: UserWithEmail; onSuccess: () => void };

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'ASLAB', label: 'Asisten Laboratorium' },
  { value: 'ASPRAK_KOOR', label: 'Koordinator Asprak' },
];

export function ManajemenAkunFormModal({ open, onOpenChange, mode, user, onSuccess }: Props) {
  const [nama, setNama] = React.useState(user?.nama_lengkap ?? '');
  const [email, setEmail] = React.useState(user?.email ?? '');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<Role>(user?.role ?? 'ASPRAK_KOOR');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setNama(user?.nama_lengkap ?? '');
      setEmail(user?.email ?? '');
      setPassword('');
      setRole(user?.role ?? 'ASPRAK_KOOR');
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, nama_lengkap: nama, role }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        toast.success(`Akun "${nama}" berhasil dibuat.`);
      } else {
        const res = await fetch(`/api/admin/users/${user!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_lengkap: nama, role }),
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Nama Lengkap"
            />
          </div>

          {mode === 'create' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isLoading}>
              <SelectTrigger id="role">
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

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
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
