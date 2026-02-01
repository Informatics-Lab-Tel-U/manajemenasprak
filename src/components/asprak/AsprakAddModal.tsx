import AsprakForm, { AsprakFormData } from './AsprakForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AsprakAddModalProps {
  existingCodes: string[];
  availablePraktikums: { id: string; nama: string }[];
  onSubmit: (data: AsprakFormData) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export default function AsprakAddModal({
  existingCodes,
  availablePraktikums,
  onSubmit,
  onClose,
  open,
}: AsprakAddModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[min(700px,85vh)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">Input Manual Asprak</DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-4">
              <AsprakForm
                existingCodes={existingCodes}
                availablePraktikums={availablePraktikums}
                onSubmit={onSubmit}
                onCancel={onClose}
              />
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
