'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { createBlogPost, updateBlogPost } from '@/app/actions/blog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Trash2, ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const TiptapEditor = dynamic(
  () => import('@/components/tiptap/editor').then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse bg-muted/30 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
        Memuat Editor...
      </div>
    ),
  }
);

type PostFormProps = {
  initialData?: any;
  categories: any[];
  tags?: any[];
};

export function PostForm({ initialData, categories, tags = [] }: PostFormProps) {
  const router = useRouter();
  const editorRef = React.useRef<any>(null);
  const [content, setContent] = React.useState<any>(initialData?.content || null);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(initialData?.cover_image_url || null);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const extractTagIds = React.useCallback((data: any): string[] => {
    if (!data) return [];
    const rawTags = data.blog_post_tags || data.tags || data.blog_tags || [];
    if (!Array.isArray(rawTags)) return [];
    return rawTags
      .map((t: any) => {
        if (typeof t === 'string') return t;
        if (t?.tag_id) return t.tag_id;
        if (t?.id) return t.id;
        if (t?.tag?.id) return t.tag.id;
        return null;
      })
      .filter((tagId): tagId is string => typeof tagId === 'string' && tagId.length > 0);
  }, []);

  const [selectedTags, setSelectedTags] = React.useState<string[]>(() => extractTagIds(initialData));

  React.useEffect(() => {
    if (initialData) {
      setSelectedTags(extractTagIds(initialData));
    }
  }, [initialData, extractTagIds]);

  const [isPending, startTransition] = React.useTransition();

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFile = e.target.files[0];
    
    setIsUploadingCover(true);
    try {
      // Kompres gambar sebelum diupload
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      const file = await imageCompression(rawFile, options);
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('manajemenasprak')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('manajemenasprak')
        .getPublicUrl(filePath);

      setCoverImageUrl(publicUrlData.publicUrl);
      toast.success('Thumbnail berhasil diunggah!');
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast.error('Gagal mengunggah thumbnail');
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    if (!coverImageUrl) return;
    setCoverImageUrl(null);
    toast.success('Thumbnail dihapus (perubahan akan disimpan saat Anda klik Simpan)');
  };

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
        router.push('/manage-post');
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
      <input type="hidden" name="cover_image_url" value={coverImageUrl || ''} />
      
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label>Gambar Cover / Thumbnail (Opsional)</Label>
          <div className="flex flex-col gap-4">
            {coverImageUrl ? (
              <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border bg-muted group">
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveCover}
                    disabled={isUploadingCover}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Gambar
                  </Button>
                </div>
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="w-full max-w-xl aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => !isUploadingCover && fileInputRef.current?.click()}
              >
                {isUploadingCover ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Klik untuk mengunggah thumbnail</p>
                      <p className="text-xs text-muted-foreground mt-1">Rekomendasi rasio 16:9 (Landscape)</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="title">Judul Post</Label>
          <Input id="title" name="title" defaultValue={initialData?.title} placeholder="Contoh: Pengumuman Pendaftaran Klinik Akademik" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" name="slug" defaultValue={initialData?.slug} placeholder="contoh: pendaftaran-klinik-akademik" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category_id">Kategori</Label>
            <Select name="category_id" defaultValue={initialData?.category_id || ''}>
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="published_at">Tanggal Publish (Opsional)</Label>
          <Input
            id="published_at"
            name="published_at"
            type="datetime-local"
            defaultValue={
              initialData?.published_at
                ? new Date(initialData.published_at).toISOString().slice(0, 16)
                : ''
            }
          />
          <p className="text-xs text-muted-foreground">
            Jika dikosongkan saat memilih status Published, sistem akan mengisi tanggal publish secara otomatis dengan waktu saat ini.
          </p>
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
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Buat Post'}
        </Button>
      </div>
    </form>
  );
}
