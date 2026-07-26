'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createCategory, updateCategory, createTag, updateTag } from '@/app/actions/blog';
import { useRouter } from 'next/navigation';
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
  mode?: 'create' | 'edit';
  initialData?: {
    id: string;
    name: string;
    slug: string;
  };
  trigger?: React.ReactNode;
}

export function TaxonomyDialog({ type, mode = 'create', initialData, trigger }: TaxonomyDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(initialData?.name || '');
  const [slug, setSlug] = React.useState(initialData?.slug || '');
  const router = useRouter();

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
    }
  }, [initialData]);

  const title = type === 'category' ? 'Kategori' : 'Tag';
  const isEdit = mode === 'edit';
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        if (type === 'category') {
          if (isEdit && initialData?.id) {
            await updateCategory(initialData.id, formData);
            toast.success(`Kategori berhasil diperbarui`);
          } else {
            await createCategory(formData);
            toast.success(`Kategori berhasil ditambahkan`);
          }
        } else {
          if (isEdit && initialData?.id) {
            await updateTag(initialData.id, formData);
            toast.success(`Tag berhasil diperbarui`);
          } else {
            await createTag(formData);
            toast.success(`Tag berhasil ditambahkan`);
          }
        }
        setOpen(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            {isEdit ? <Pencil className="mr-2 h-3.5 w-3.5" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {isEdit ? 'Edit' : 'Tambah'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Tambah'} {title}</DialogTitle>
            <DialogDescription>
              {isEdit ? `Perbarui data ${title.toLowerCase()}` : `Buat ${title.toLowerCase()} baru untuk dihubungkan ke artikel.`}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
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
