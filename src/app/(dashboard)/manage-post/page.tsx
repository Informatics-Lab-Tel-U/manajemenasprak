import * as blogService from '@/services/blogService';
import Link from 'next/link';
import { PlusCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DeletePostButton } from '@/components/blog/DeletePostButton';
import { TemplateSelectionModal } from '@/components/blog/TemplateSelectionModal';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Post Lab',
};

export default async function ManagePostPage() {
  await requireRole(['ADMIN', 'ASLAB']);

  let posts: any[] = [];
  try {
    posts = await blogService.getAllBlogPosts();
  } catch (error) {
    console.error('[ManagePostPage] SSR fetch error:', error);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Post Lab</h1>
          <p className="text-muted-foreground">Manajemen konten artikel dan pengumuman lab.</p>
        </div>
        <TemplateSelectionModal />
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Judul</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Penulis</th>
              <th className="px-4 py-3 font-medium">Tgl Publish</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts?.map((post: any) => (
              <tr key={post.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{post.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    post.status === 'published' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                    post.status === 'draft' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3">{post.blog_categories?.name || '-'}</td>
                <td className="px-4 py-3">{post.pengguna?.nama_lengkap || '-'}</td>
                <td className="px-4 py-3">
                  {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: id }) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/manage-post/${post.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeletePostButton id={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada post yang dibuat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
