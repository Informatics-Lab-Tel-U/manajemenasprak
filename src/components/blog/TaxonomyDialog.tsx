'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createCategory, createTag } from '@/app/actions/blog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TaxonomyDialogProps {
  type: 'category' | 'tag';
}

export function TaxonomyDialog({ type }: TaxonomyDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const title = type === 'category' ? 'Kategori' : 'Tag';
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        if (type === 'category') {
          await createCategory(formData);
        } else {
          await createTag(formData);
        }
        toast.success(`${title} berhasil ditambahkan`);
        setOpen(false);
      } catch (error: any) {
        toast.error(error.message || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah {title}</DialogTitle>
            <DialogDescription>
              Buat {title.toLowerCase()} baru untuk dihubungkan ke artikel.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                Nama
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={`Contoh: ${type === 'category' ? 'Tutorial' : 'PBO'}`}
                className="w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">
                Slug
              </Label>
              <Input
                id="slug"
                name="slug"
                placeholder={`Contoh: ${type === 'category' ? 'tutorial' : 'pbo'}`}
                className="w-full"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
