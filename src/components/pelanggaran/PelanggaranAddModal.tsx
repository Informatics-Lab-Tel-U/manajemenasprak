import PelanggaranForm from './PelanggaranForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreatePelanggaranInput } from '@/types/api';

interface PelanggaranAddModalProps {
  onSubmit: (data: CreatePelanggaranInput) => Promise<void>;
  onClose: () => void;
  open: boolean;
  isLoading?: boolean;
}

export default function PelanggaranAddModal({
  onSubmit,
  onClose,
  open,
  isLoading = false,
}: PelanggaranAddModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[min(700px,85vh)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">Catat Pelanggaran Baru</DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-4">
              <PelanggaranForm
                onSubmit={onSubmit}
                onCancel={onClose}
                isLoading={isLoading}
              />
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}