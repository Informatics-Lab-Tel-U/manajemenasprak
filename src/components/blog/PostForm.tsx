'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TiptapEditor } from '@/components/tiptap';
import { createBlogPost, updateBlogPost } from '@/app/actions/blog';
import { toast } from 'sonner';

type PostFormProps = {
  initialData?: any;
  categories: any[];
  tags?: any[];
};

export function PostForm({ initialData, categories, tags = [] }: PostFormProps) {
  const router = useRouter();
  const editorRef = React.useRef<any>(null);
  const [content, setContent] = React.useState<any>(initialData?.content || null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    initialData?.blog_post_tags?.map((t: any) => t.tag_id) || []
  );
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // CRITICAL: ProseMirror's getJSON() returns attrs as null-prototype objects.
    // Next.js Server Action (React Flight) silently drops null-prototype objects.
    // JSON round-trip normalizes them to plain objects before the server boundary.
    const rawContent = editorRef.current ? editorRef.current.getJSON() : content;
    const latestContent = rawContent ? JSON.parse(JSON.stringify(rawContent)) : rawContent;

    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateBlogPost(initialData.id, formData, latestContent);
          toast.success('Post berhasil diperbarui');
        } else {
          await createBlogPost(formData, latestContent);
          toast.success('Post berhasil dibuat');
        }
      } catch (error: any) {
        toast.error(error.message || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Judul Post</Label>
          <Input id="title" name="title" defaultValue={initialData?.title} placeholder="Contoh: Pengumuman Pendaftaran Klinik Akademik" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" name="slug" defaultValue={initialData?.slug} placeholder="contoh: pendaftaran-klinik-akademik" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category_id">Kategori</Label>
          <Select name="category_id" defaultValue={initialData?.category_id || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initialData?.status || 'draft'} required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Tags (Topik)</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags((prev) => prev.filter((id) => id !== tag.id));
                    } else {
                      setSelectedTags((prev) => [...prev, tag.id]);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border hover:bg-muted'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && <span className="text-sm text-muted-foreground">Belum ada tag.</span>}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="excerpt">Ringkasan (Excerpt)</Label>
          <Textarea id="excerpt" name="excerpt" defaultValue={initialData?.excerpt || ''} />
        </div>

        <div className="grid gap-2">
          <Label>Konten Utama</Label>
          <TiptapEditor value={content} onChange={setContent} onCreated={(ed) => (editorRef.current = ed)} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Buat Post'}
        </Button>
      </div>
    </form>
  );
}
