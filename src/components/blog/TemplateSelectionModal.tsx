'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Info, Search, FileEdit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { POST_TEMPLATES } from '@/config/postTemplates';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TemplateSelectionModal() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleSelectTemplate = (templateId?: string) => {
    setOpen(false);
    if (templateId) {
      router.push(`/manage-post/create?template=${templateId}`);
    } else {
      router.push('/manage-post/create');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pilih Template Post</DialogTitle>
          <DialogDescription>
            Pilih template untuk mengisi format post secara otomatis, atau mulai dari awal (Kosong).
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Card 
            className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => handleSelectTemplate()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <FileEdit className="mr-2 h-4 w-4 text-muted-foreground" />
                Post Kosong (Blank)
              </CardTitle>
              <CardDescription className="text-xs">
                Mulai menulis artikel atau pengumuman dari kanvas kosong.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => handleSelectTemplate('tp')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                {POST_TEMPLATES.tp.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {POST_TEMPLATES.tp.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => handleSelectTemplate('info')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Info className="mr-2 h-4 w-4 text-muted-foreground" />
                {POST_TEMPLATES.info.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {POST_TEMPLATES.info.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => handleSelectTemplate('lostfound')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                {POST_TEMPLATES.lostfound.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {POST_TEMPLATES.lostfound.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
