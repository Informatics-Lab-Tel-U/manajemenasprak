'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteCategory, deleteTag } from '@/app/actions/blog';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaxonomyDeleteButtonProps {
  type: 'category' | 'tag';
  id: string;
  name: string;
}

export function TaxonomyDeleteButton({ type, id, name }: TaxonomyDeleteButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const title = type === 'category' ? 'Kategori' : 'Tag';

  const handleDelete = () => {
    startTransition(async () => {
      try {
        if (type === 'category') {
          await deleteCategory(id);
        } else {
          await deleteTag(id);
        }
        toast.success(`${title} "${name}" berhasil dihapus`);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || `Gagal menghapus ${title.toLowerCase()}`);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Hapus {name}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus {title.toLowerCase()} <strong>"{name}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
